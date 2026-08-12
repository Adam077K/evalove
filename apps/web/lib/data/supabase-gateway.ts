/**
 * The Supabase implementation of `DataGateway`.
 *
 * Every query in the photo and book flows lands here, and nowhere else touches
 * PostgREST. What this file does NOT do is construct the client: that lives in
 * `lib/data/client.ts`, which is the one file in the application permitted to
 * import `@supabase/supabase-js`.
 *
 * Not a convention — a checkable property. `lib/__tests__/no-client-secrets.test.ts`
 * reads the source tree and fails if any other file imports the SDK. The reason
 * is the service role key: it bypasses Row Level Security completely, so every
 * line of code holding a client holds the whole database. Keeping that to one
 * file means the review question is "is this file right", not "has anyone
 * anywhere done something careless".
 *
 * WHY `serviceClient()` IS ASYNC. `client.ts` imports `lib/env.ts`, which
 * validates at module evaluation. This module is reached from
 * `lib/data/index.ts`, which unit tests import for types and for the pure logic
 * in `photos.ts` — a static import here would turn every one of those into a
 * boot check for the whole environment. The `await import("./client")` below
 * defers that to the first actual query, which is where a missing credential
 * genuinely matters. The module registry caches the import, so this costs one
 * resolved promise per call and nothing else.
 */

import { MEDIA_BUCKET } from "@/lib/schema";

import type { SupabaseClient } from "./client";
import { DataError } from "./errors";
import {
  BOOK_ENTRY_COLUMNS,
  DATE_PLAN_COLUMNS,
  PHOTO_COLUMNS,
  type BookEntryRow,
  type DatePlanRow,
  type PhotoRow,
} from "./rows";
import type {
  BookEntryPatch,
  DataGateway,
  DatePlanPatch,
  DatePlanQuery,
  MemberRow,
  PhotoPageQuery,
  PhotoPatch,
  PurgeAuditInsert,
} from "./gateway";

/* ------------------------------------------------------------------ *
 * The client
 * ------------------------------------------------------------------ */

/**
 * The one service-role client, reached without importing the SDK.
 *
 * `db()` memoises in `client.ts`, so this is a lookup after the first call, not
 * a construction. The dynamic import is the deferral described at the top of
 * this file — it keeps `lib/env.ts` out of the import graph of anything that
 * merely imports `lib/data`.
 *
 * Tests that need a fresh client call `__resetDbForTests()` from `./client`.
 */
async function serviceClient(): Promise<SupabaseClient> {
  const { db } = await import("./client");
  return db();
}

/* ------------------------------------------------------------------ *
 * Error translation
 * ------------------------------------------------------------------ */

/** PostgreSQL check_violation. The shared-day trigger raises with this code. */
const CHECK_VIOLATION = "23514";
/** PostgreSQL unique_violation. */
const UNIQUE_VIOLATION = "23505";

interface PostgrestErrorish {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * Turn a PostgREST error into a `DataError` that says what kind it is.
 *
 * `23514` is singled out because on `photos` and `vault_items` it is almost
 * always one specific thing: the shared-day trigger from migration 08 refusing
 * a row whose `shared_day` disagrees with
 * `shared_day_of(created_at, shared_day_tz)`. That is a bug in this
 * application, not in the caller's request, so it is reported as `upstream`
 * with the database's own hint attached rather than being flattened into a
 * generic 400 that would send whoever reads the log looking at the client.
 */
function translate(
  operation: string,
  error: PostgrestErrorish,
  detail: Record<string, unknown> = {},
): DataError {
  const kind =
    error.code === UNIQUE_VIOLATION
      ? "conflict"
      : ("upstream" as const);

  const enriched: Record<string, unknown> = {
    operation,
    code: error.code ?? null,
    ...detail,
  };

  if (error.code === CHECK_VIOLATION) {
    enriched.likelyCause =
      "the shared_day trigger (migration 08) rejected the row: shared_day must " +
      "equal (created_at at time zone shared_day_tz)::date, resolved in the " +
      "author's own zone";
    enriched.databaseHint = error.hint ?? null;
  }

  return new DataError(kind, `${operation}: ${error.message}`, enriched);
}

/**
 * The PostgREST "no rows" sentinel.
 *
 * `.single()` raises PGRST116 when a filter matched nothing. For every read in
 * this file that is an ordinary answer — "there is no such photo" — not a
 * failure, so it becomes `null` rather than a thrown error.
 */
const NO_ROWS = "PGRST116";

/* ------------------------------------------------------------------ *
 * The gateway
 * ------------------------------------------------------------------ */

export function supabaseGateway(): DataGateway {
  return {
    /* -- members -------------------------------------------------- */

    async listMembers(): Promise<MemberRow[]> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("members")
        .select("id,slug,display_name,home_timezone,created_at")
        .order("slug", { ascending: true });

      if (error) throw translate("listMembers", error);
      return (data ?? []) as MemberRow[];
    },

    /* -- photos --------------------------------------------------- */

    /**
     * `on conflict (client_uuid) do nothing`, then read back the holder.
     *
     * PostgREST spells DO NOTHING as `Prefer: resolution=ignore-duplicates`,
     * which is what `upsert(..., { ignoreDuplicates: true })` sends. The insert
     * returns no representation in that mode, so the row is read back by the
     * conflict key. Two writers racing the same `client_uuid` therefore both
     * end up looking at the same single row, which is the entire point of the
     * key: a double flush from the offline outbox cannot make two photos.
     */
    async insertPhotoIfAbsent(row: PhotoRow): Promise<PhotoRow> {
      const db = await serviceClient();

      const { error } = await db
        .from("photos")
        .upsert(row, { onConflict: "client_uuid", ignoreDuplicates: true });

      if (error) {
        throw translate("insertPhotoIfAbsent", error, {
          clientUuid: row.client_uuid,
          sharedDay: row.shared_day,
          sharedDayTz: row.shared_day_tz,
          createdAt: row.created_at,
        });
      }

      const { data, error: readError } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("client_uuid", row.client_uuid)
        .single();

      if (readError) {
        throw translate("insertPhotoIfAbsent/readback", readError, {
          clientUuid: row.client_uuid,
        });
      }
      return data as unknown as PhotoRow;
    },

    async findPhotoById(id: string): Promise<PhotoRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === NO_ROWS) return null;
        throw translate("findPhotoById", error, { id });
      }
      return data as unknown as PhotoRow;
    },

    async findPhotoByClientUuid(clientUuid: string): Promise<PhotoRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("client_uuid", clientUuid)
        .single();

      if (error) {
        if (error.code === NO_ROWS) return null;
        throw translate("findPhotoByClientUuid", error, { clientUuid });
      }
      return data as unknown as PhotoRow;
    },

    /**
     * Find a live (not purged) photo by its SHA-256 content digest.
     *
     * Returns the first row whose `checksum_sha256` matches and whose
     * `purged_at` is null. `deleted_at` is deliberately NOT filtered: a
     * soft-deleted photo is still in the book (its bytes exist, it is merely
     * hidden), so uploading the same bytes again is still a duplicate. A purged
     * photo is gone — its slot is open.
     *
     * NOTE: there is currently no index on `checksum_sha256`. For a two-person
     * book this is a sequential scan over a handful of rows, which is
     * acceptable. The founder has been given the proposed index SQL (see the
     * `needs_migration` field of the backend-engineer return contract for this
     * task) and may apply it when the table grows.
     */
    async findPhotoByChecksumSha256(checksum: string): Promise<PhotoRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("checksum_sha256", checksum)
        .is("purged_at", null)
        .limit(1);

      if (error) throw translate("findPhotoByChecksumSha256", error, { checksum });
      const rows = (data ?? []) as unknown as PhotoRow[];
      return rows[0] ?? null;
    },

    async listPhotos(query: PhotoPageQuery): Promise<PhotoRow[]> {
      const db = await serviceClient();

      let q = db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .is("deleted_at", null)
        .is("purged_at", null);

      if (query.kind !== undefined) q = q.eq("kind", query.kind);
      if (query.from !== undefined) q = q.gte("shared_day", query.from);
      if (query.to !== undefined) q = q.lte("shared_day", query.to);

      if (query.before !== undefined) {
        // Keyset: strictly older by created_at, or the same instant and a
        // smaller id. `or()` takes PostgREST filter syntax, and the id is a
        // uuid from our own row so there is nothing to escape.
        const { createdAt, id } = query.before;
        q = q.or(
          `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
        );
      }

      const { data, error } = await q
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(query.limit);

      if (error) throw translate("listPhotos", error, { query });
      return (data ?? []) as unknown as PhotoRow[];
    },

    async dailyPhotosForDay(sharedDay: string): Promise<PhotoRow[]> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("kind", "daily")
        .eq("shared_day", sharedDay)
        .is("deleted_at", null)
        .is("purged_at", null)
        .order("created_at", { ascending: true });

      if (error) throw translate("dailyPhotosForDay", error, { sharedDay });
      return (data ?? []) as unknown as PhotoRow[];
    },

    async updatePhoto(id: string, patch: PhotoPatch): Promise<PhotoRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("photos")
        .update(patch)
        .eq("id", id)
        .select(PHOTO_COLUMNS)
        .single();

      if (error) {
        if (error.code === NO_ROWS) return null;
        throw translate("updatePhoto", error, { id });
      }
      return data as unknown as PhotoRow;
    },

    async supersedePriorDaily(args: {
      authorMemberId: string;
      sharedDay: string;
      exceptClientUuid: string;
      at: string;
    }): Promise<number> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("photos")
        .update({ deleted_at: args.at })
        .eq("author_member_id", args.authorMemberId)
        .eq("shared_day", args.sharedDay)
        .eq("kind", "daily")
        .is("deleted_at", null)
        .neq("client_uuid", args.exceptClientUuid)
        .select("id");

      if (error) throw translate("supersedePriorDaily", error, args);
      return (data ?? []).length;
    },

    /* -- the tally ------------------------------------------------ */

    async countDaysTogether(): Promise<number> {
      const db = await serviceClient();
      const { count, error } = await db
        .from("v_days_together")
        .select("shared_day", { count: "exact", head: true });

      if (error) throw translate("countDaysTogether", error);
      return count ?? 0;
    },

    /* -- purge audit ---------------------------------------------- */

    async countPurgeRequestsSince(since: string): Promise<number> {
      const db = await serviceClient();
      const { count, error } = await db
        .from("purge_audit")
        .select("id", { count: "exact", head: true })
        .gte("requested_at", since);

      if (error) throw translate("countPurgeRequestsSince", error, { since });
      return count ?? 0;
    },

    async insertPurgeAudit(row: PurgeAuditInsert): Promise<number> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("purge_audit")
        .insert(row)
        .select("id")
        .single();

      if (error) throw translate("insertPurgeAudit", error, { itemId: row.item_id });
      return (data as unknown as { id: number }).id;
    },

    async markPurgeAuditStoragePurged(
      auditId: number,
      at: string,
    ): Promise<void> {
      const db = await serviceClient();
      const { error } = await db
        .from("purge_audit")
        .update({ supabase_purged_at: at })
        .eq("id", auditId);

      if (error) throw translate("markPurgeAuditStoragePurged", error, { auditId });
    },

    /* -- book ----------------------------------------------------- */

    async listBookEntries(): Promise<BookEntryRow[]> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("book_entries")
        .select(BOOK_ENTRY_COLUMNS)
        .is("deleted_at", null)
        .order("position", { ascending: true });

      if (error) throw translate("listBookEntries", error);
      return (data ?? []) as unknown as BookEntryRow[];
    },

    async updateBookEntry(
      id: string,
      patch: BookEntryPatch,
    ): Promise<BookEntryRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("book_entries")
        .update(patch)
        .eq("id", id)
        .is("deleted_at", null)
        .select(BOOK_ENTRY_COLUMNS)
        .single();

      if (error) {
        if (error.code === NO_ROWS) return null;
        throw translate("updateBookEntry", error, { id });
      }
      return data as unknown as BookEntryRow;
    },

    /* -- date plans ----------------------------------------------- */

    async insertDatePlan(row: DatePlanRow): Promise<DatePlanRow> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("date_plans")
        .insert(row)
        .select(DATE_PLAN_COLUMNS)
        .single();

      if (error) {
        throw translate("insertDatePlan", error, {
          kind: row.kind,
          sharedDay: row.shared_day,
          windowId: row.window_id,
        });
      }
      return data as unknown as DatePlanRow;
    },

    async findDatePlanById(id: string): Promise<DatePlanRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("date_plans")
        .select(DATE_PLAN_COLUMNS)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === NO_ROWS) return null;
        throw translate("findDatePlanById", error, { id });
      }
      return data as unknown as DatePlanRow;
    },

    async findLiveDatePlanInSlot(args: {
      kind: string;
      sharedDay: string;
      windowId: string;
    }): Promise<DatePlanRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("date_plans")
        .select(DATE_PLAN_COLUMNS)
        .eq("kind", args.kind)
        .eq("shared_day", args.sharedDay)
        .eq("window_id", args.windowId)
        .in("status", ["proposed", "agreed"])
        .limit(1);

      if (error) throw translate("findLiveDatePlanInSlot", error, args);
      const rows = (data ?? []) as unknown as DatePlanRow[];
      return rows[0] ?? null;
    },

    async listDatePlans(query: DatePlanQuery): Promise<DatePlanRow[]> {
      const db = await serviceClient();

      let q = db.from("date_plans").select(DATE_PLAN_COLUMNS);

      if (query.statuses !== undefined) q = q.in("status", [...query.statuses]);
      if (query.sharedDay !== undefined) q = q.eq("shared_day", query.sharedDay);
      if (query.startingAtOrAfter !== undefined) {
        q = q.gte("starts_at", query.startingAtOrAfter);
      }

      // Soonest first, id breaking the tie so the order is total and a
      // re-read never shuffles two dates that start at the same second.
      const { data, error } = await q
        .order("starts_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(query.limit);

      if (error) throw translate("listDatePlans", error, { query });
      return (data ?? []) as unknown as DatePlanRow[];
    },

    async updateDatePlan(
      id: string,
      patch: DatePlanPatch,
    ): Promise<DatePlanRow | null> {
      const db = await serviceClient();
      const { data, error } = await db
        .from("date_plans")
        .update(patch)
        .eq("id", id)
        .select(DATE_PLAN_COLUMNS)
        .single();

      if (error) {
        if (error.code === NO_ROWS) return null;
        throw translate("updateDatePlan", error, { id, patch });
      }
      return data as unknown as DatePlanRow;
    },

    /* -- storage -------------------------------------------------- */

    async createSignedUploadUrl(
      path: string,
    ): Promise<{ url: string; token: string }> {
      const db = await serviceClient();
      const { data, error } = await db.storage
        .from(MEDIA_BUCKET)
        .createSignedUploadUrl(path);

      if (error) {
        throw new DataError(
          "upstream",
          `createSignedUploadUrl: ${error.message}`,
          { path },
          { cause: error },
        );
      }
      return { url: data.signedUrl, token: data.token };
    },

    async downloadObject(path: string): Promise<ArrayBuffer | null> {
      const db = await serviceClient();
      const { data, error } = await db.storage.from(MEDIA_BUCKET).download(path);

      if (error) {
        // Storage does not give a typed "not found"; a missing object and a
        // broken bucket both arrive as an error. The caller has already
        // established that the row exists, so a miss here means the bytes are
        // gone — reported as absence, which the route turns into a 404.
        return null;
      }
      return await data.arrayBuffer();
    },

    async removeObjects(paths: readonly string[]): Promise<string[]> {
      const db = await serviceClient();
      const { data, error } = await db.storage
        .from(MEDIA_BUCKET)
        .remove([...paths]);

      if (error) {
        throw new DataError(
          "upstream",
          `removeObjects: ${error.message}`,
          { paths },
          { cause: error },
        );
      }
      return (data ?? []).map((object) => object.name);
    },
  };
}
