/**
 * gateway.ts — a `DataGateway` for the standalone ingest loader.
 *
 * `apps/web/lib/data/gateway.ts`'s `DataGateway` interface is imported
 * type-only (erased at runtime, so it carries no dependency on `lib/env.ts`),
 * and this file provides a real implementation of it backed by `db.ts`'s own
 * client instead of the app's `lib/data/client.ts` — see db.ts's header for
 * why. This is what lets `load.ts` call `commitPhoto` and `issueUploadSlots`
 * from `apps/web/lib/data/photos.ts` UNCHANGED: those two functions are pure
 * orchestration over an injected `DataGateway`, and this is simply a second,
 * standalone implementation of the same port `supabase-gateway.ts` implements
 * for the running app — same pattern the CTO already approved for reads.
 *
 * Every query below mirrors `apps/web/lib/data/supabase-gateway.ts` method for
 * method. Methods this loader never calls (`listPhotos`, `updateBookEntry`,
 * purge-related methods, and so on) are still implemented, because
 * `PhotoDeps.gateway` is typed as the full `DataGateway` — a partial object
 * would not compile — but they are simple, direct translations, not new logic.
 */

import { MEDIA_BUCKET } from "@/lib/schema.ts";
import { PHOTO_COLUMNS, BOOK_ENTRY_COLUMNS } from "@/lib/data/rows.ts";
import type { BookEntryRow, PhotoRow } from "@/lib/data/rows.ts";
import type {
  BookEntryPatch,
  DataGateway,
  MemberRow,
  PhotoPageQuery,
  PhotoPatch,
  PurgeAuditInsert,
} from "@/lib/data/gateway.ts";
import type { IngestSupabaseClient } from "./db.ts";

const NO_ROWS = "PGRST116";

export function ingestGateway(db: IngestSupabaseClient): DataGateway {
  return {
    async listMembers(): Promise<MemberRow[]> {
      const { data, error } = await db
        .from("members")
        .select("id,slug,display_name,home_timezone,created_at")
        .order("slug", { ascending: true });
      if (error) throw new Error(`listMembers: ${error.message}`);
      return (data ?? []) as MemberRow[];
    },

    async insertPhotoIfAbsent(row: PhotoRow): Promise<PhotoRow> {
      const { error } = await db
        .from("photos")
        .upsert(row, { onConflict: "client_uuid", ignoreDuplicates: true });
      if (error) {
        throw new Error(
          `insertPhotoIfAbsent(${row.client_uuid}): ${error.message}`,
        );
      }
      const { data, error: readError } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("client_uuid", row.client_uuid)
        .single();
      if (readError) {
        throw new Error(
          `insertPhotoIfAbsent/readback(${row.client_uuid}): ${readError.message}`,
        );
      }
      return data as unknown as PhotoRow;
    },

    async findPhotoById(id: string): Promise<PhotoRow | null> {
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("id", id)
        .single();
      if (error) {
        if (error.code === NO_ROWS) return null;
        throw new Error(`findPhotoById(${id}): ${error.message}`);
      }
      return data as unknown as PhotoRow;
    },

    async findPhotoByClientUuid(clientUuid: string): Promise<PhotoRow | null> {
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("client_uuid", clientUuid)
        .single();
      if (error) {
        if (error.code === NO_ROWS) return null;
        throw new Error(`findPhotoByClientUuid(${clientUuid}): ${error.message}`);
      }
      return data as unknown as PhotoRow;
    },

    async listPhotos(query: PhotoPageQuery): Promise<PhotoRow[]> {
      let q = db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .is("deleted_at", null)
        .is("purged_at", null);
      if (query.kind !== undefined) q = q.eq("kind", query.kind);
      if (query.from !== undefined) q = q.gte("shared_day", query.from);
      if (query.to !== undefined) q = q.lte("shared_day", query.to);
      if (query.before !== undefined) {
        const { createdAt, id } = query.before;
        q = q.or(
          `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
        );
      }
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(query.limit);
      if (error) throw new Error(`listPhotos: ${error.message}`);
      return (data ?? []) as unknown as PhotoRow[];
    },

    async dailyPhotosForDay(sharedDay: string): Promise<PhotoRow[]> {
      const { data, error } = await db
        .from("photos")
        .select(PHOTO_COLUMNS)
        .eq("kind", "daily")
        .eq("shared_day", sharedDay)
        .is("deleted_at", null)
        .is("purged_at", null)
        .order("created_at", { ascending: true });
      if (error) throw new Error(`dailyPhotosForDay(${sharedDay}): ${error.message}`);
      return (data ?? []) as unknown as PhotoRow[];
    },

    async updatePhoto(id: string, patch: PhotoPatch): Promise<PhotoRow | null> {
      const { data, error } = await db
        .from("photos")
        .update(patch)
        .eq("id", id)
        .select(PHOTO_COLUMNS)
        .single();
      if (error) {
        if (error.code === NO_ROWS) return null;
        throw new Error(`updatePhoto(${id}): ${error.message}`);
      }
      return data as unknown as PhotoRow;
    },

    async supersedePriorDaily(args: {
      authorMemberId: string;
      sharedDay: string;
      exceptClientUuid: string;
      at: string;
    }): Promise<number> {
      const { data, error } = await db
        .from("photos")
        .update({ deleted_at: args.at })
        .eq("author_member_id", args.authorMemberId)
        .eq("shared_day", args.sharedDay)
        .eq("kind", "daily")
        .is("deleted_at", null)
        .neq("client_uuid", args.exceptClientUuid)
        .select("id");
      if (error) throw new Error(`supersedePriorDaily: ${error.message}`);
      return (data ?? []).length;
    },

    async countDaysTogether(): Promise<number> {
      const { count, error } = await db
        .from("v_days_together")
        .select("shared_day", { count: "exact", head: true });
      if (error) throw new Error(`countDaysTogether: ${error.message}`);
      return count ?? 0;
    },

    async countPurgeRequestsSince(since: string): Promise<number> {
      const { count, error } = await db
        .from("purge_audit")
        .select("id", { count: "exact", head: true })
        .gte("requested_at", since);
      if (error) throw new Error(`countPurgeRequestsSince: ${error.message}`);
      return count ?? 0;
    },

    async insertPurgeAudit(row: PurgeAuditInsert): Promise<number> {
      const { data, error } = await db
        .from("purge_audit")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(`insertPurgeAudit(${row.item_id}): ${error.message}`);
      return (data as unknown as { id: number }).id;
    },

    async markPurgeAuditStoragePurged(auditId: number, at: string): Promise<void> {
      const { error } = await db
        .from("purge_audit")
        .update({ supabase_purged_at: at })
        .eq("id", auditId);
      if (error) throw new Error(`markPurgeAuditStoragePurged(${auditId}): ${error.message}`);
    },

    async listBookEntries(): Promise<BookEntryRow[]> {
      const { data, error } = await db
        .from("book_entries")
        .select(BOOK_ENTRY_COLUMNS)
        .is("deleted_at", null)
        .order("position", { ascending: true });
      if (error) throw new Error(`listBookEntries: ${error.message}`);
      return (data ?? []) as unknown as BookEntryRow[];
    },

    async updateBookEntry(
      id: string,
      patch: BookEntryPatch,
    ): Promise<BookEntryRow | null> {
      const { data, error } = await db
        .from("book_entries")
        .update(patch)
        .eq("id", id)
        .is("deleted_at", null)
        .select(BOOK_ENTRY_COLUMNS)
        .single();
      if (error) {
        if (error.code === NO_ROWS) return null;
        throw new Error(`updateBookEntry(${id}): ${error.message}`);
      }
      return data as unknown as BookEntryRow;
    },

    async createSignedUploadUrl(
      path: string,
    ): Promise<{ url: string; token: string }> {
      const { data, error } = await db.storage
        .from(MEDIA_BUCKET)
        .createSignedUploadUrl(path);
      if (error) throw new Error(`createSignedUploadUrl(${path}): ${error.message}`);
      return { url: data.signedUrl, token: data.token };
    },

    async downloadObject(path: string): Promise<ArrayBuffer | null> {
      const { data, error } = await db.storage.from(MEDIA_BUCKET).download(path);
      if (error) return null;
      return await data.arrayBuffer();
    },

    async removeObjects(paths: readonly string[]): Promise<string[]> {
      const { data, error } = await db.storage
        .from(MEDIA_BUCKET)
        .remove([...paths]);
      if (error) throw new Error(`removeObjects: ${error.message}`);
      return (data ?? []).map((object) => object.name);
    },
  };
}
