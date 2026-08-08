/**
 * db.ts — own Supabase client for the caption-fix tool.
 *
 * DELIBERATE ARCH §6.3 EXCEPTION — same shape as
 * `tools/authorship-fix/db.ts`, `tools/book-placement/db.ts` and
 * `tools/ingest/db.ts`: a standalone one-purpose script needs its own
 * client so it can run without booting the whole app's environment
 * validation (`apps/web/lib/env.ts` checks every credential the running
 * app needs, not just the two this tool needs).
 *
 * The one write this file can make is `photos.caption`, and only that
 * column, on a row already matched by checksum, and only for a file this
 * tool's own roster (`candidates.ts`) names — `apply.ts` calls it ONLY
 * inside `--commit`. No agent working on this codebase runs this tool with
 * `--commit`; the founder runs it himself, in his own terminal, with his
 * own credentials — same rule `tools/authorship-fix/apply.ts`'s header
 * states for the same reason.
 *
 * Runtime env vars — the app's names are tried first, so a working
 * `apps/web/.env.local` is sufficient with no extra setup:
 *   NEXT_PUBLIC_SUPABASE_URL    preferred (app name) — or: SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   preferred (app name) — or: SUPABASE_SERVICE_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { RELATIONS } from "@/lib/schema.ts";

export type CaptionFixSupabaseClient = SupabaseClient<any, any, any>;

export function createCaptionFixClient(): CaptionFixSupabaseClient {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SERVICE_KEY"];

  if (!url || url.trim() === "") {
    throw new Error(
      "Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set. " +
        "The caption-fix tool cannot reach Supabase without one.",
    );
  }
  if (!key || key.trim() === "") {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SERVICE_KEY is set. " +
        "The caption-fix tool cannot authenticate with Supabase without one.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export interface DbPhotoForCaptionFix {
  id: string;
  checksum_sha256: string;
  caption: string | null;
}

/** Every live, non-deleted, non-purged photo's id, checksum and current
    caption — the same checksum join `tools/authorship-fix/db.ts` uses to
    match a catalogued file to the live row it became. */
export async function fetchPhotosForCaptionFix(
  db: CaptionFixSupabaseClient,
): Promise<DbPhotoForCaptionFix[]> {
  const { data, error } = await db
    .from(RELATIONS.photos)
    .select("id, checksum_sha256, caption")
    .is("deleted_at", null)
    .is("purged_at", null);
  if (error) throw new Error(`fetchPhotosForCaptionFix: ${error.message}`);
  return (data ?? []) as DbPhotoForCaptionFix[];
}

/* ------------------------------------------------------------------ *
 * The one write.
 * ------------------------------------------------------------------ */

/**
 * Set (or clear) exactly one photo's caption. `caption: null` clears it —
 * an uncaptioned photo, not a placeholder string. Nothing else on the row
 * is touched: not `author_member_id`, not `shared_day`/`shared_day_tz`/
 * `created_at` (migration 08's trigger only re-validates those three on an
 * update that touches one of them, so this write cannot trip it), not any
 * storage path.
 */
export async function updatePhotoCaption(
  db: CaptionFixSupabaseClient,
  photoId: string,
  caption: string | null,
): Promise<void> {
  const { error } = await db
    .from(RELATIONS.photos)
    .update({ caption })
    .eq("id", photoId);
  if (error) {
    throw new Error(`updatePhotoCaption(photo=${photoId}): ${error.message}`);
  }
}
