/**
 * THE ONLY FILE IN THIS APPLICATION THAT IMPORTS THE SUPABASE SDK.
 *
 * Not a convention — a checkable property. `lib/data/__tests__/boundary.test.ts`
 * reads the source tree and fails if any other file imports
 * `@supabase/supabase-js`. The reason is the service role key: it bypasses Row
 * Level Security completely, so every line of code holding a client holds the
 * whole database. Keeping that to one file means the review question is "is
 * this file right", not "has anyone anywhere done something careless".
 *
 * The client is built lazily, on first use, from `lib/env.ts`. Building it at
 * module scope would make importing this file a boot check for the entire
 * environment — convenient in production, fatal in a unit test that only wants
 * the type. The environment is still validated before the first query, which
 * is the property that actually matters.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { MEDIA_BUCKET } from "@/lib/schema";

import { DataError } from "./errors";
import {
  BOOK_ENTRY_COLUMNS,
  PHOTO_COLUMNS,
  type BookEntryRow,
  type PhotoRow,
} from "./rows";
import type {
  BookEntryPatch,
  DataGateway,
  MemberRow,
  PhotoPageQuery,
  PhotoPatch,
  PurgeAuditInsert,
} from "./gateway";

/* ------------------------------------------------------------------ *
 * The client
 * ------------------------------------------------------------------ */

let cached: SupabaseClient | null = null;

/**
 * The service-role client, built once per process.
 *
 * `persistSession: false` and `autoRefreshToken: false` because there is no
 * user session here: the service role key is the credential, it does not
 * expire, and a refresh timer in a serverless function is a timer that keeps
 * an instance alive for nothing.
 */
async function serviceClient(): Promise<SupabaseClient> {
  if (cached !== null) return cached;

  // Dynamic so that importing this module does not validate the environment.
  const { env } = await import("@/lib/env");

  cached = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
    },
  );
  return cached;
}

/** Only for tests that need to prove the singleton is not shared across cases. */
export function resetServiceClientForTests(): void {
  cached = null;
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
