/**
 * db.ts — own Supabase client for the 24 July authorship-fix tool.
 *
 * DELIBERATE ARCH §6.3 EXCEPTION — same shape as `tools/book-placement/db.ts`
 * and `tools/ingest/db.ts`: a standalone one-purpose script needs its own
 * client so it can run without booting the whole app's environment
 * validation (`apps/web/lib/env.ts` checks every credential the running app
 * needs, not just the two this tool needs).
 *
 * UNLIKE `tools/book-placement/db.ts` (INSERT only) this file DOES an
 * UPDATE — but only ever `photos.author_member_id`, on rows already
 * resolved by checksum, never anything else on the row and never any other
 * table. `apply.ts` calls this ONLY inside `--commit`, and only for a file
 * whose action `resolve.ts` actually staged — never for an `openQuestion`
 * candidate the founder has not overridden.
 *
 * Runtime env vars — the app's names are tried first, so a working
 * `apps/web/.env.local` is sufficient with no extra setup:
 *   NEXT_PUBLIC_SUPABASE_URL    preferred (app name) — or: SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   preferred (app name) — or: SUPABASE_SERVICE_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { RELATIONS } from "../../apps/web/lib/schema.ts";

export type AuthorshipSupabaseClient = SupabaseClient<any, any, any>;

export function createAuthorshipClient(): AuthorshipSupabaseClient {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SERVICE_KEY"];

  if (!url || url.trim() === "") {
    throw new Error(
      "Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set. " +
        "The authorship-fix tool cannot reach Supabase without one.",
    );
  }
  if (!key || key.trim() === "") {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SERVICE_KEY is set. " +
        "The authorship-fix tool cannot authenticate with Supabase without one.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export interface DbPhotoForAuthorship {
  id: string;
  checksum_sha256: string;
  author_member_id: string | null;
}

/**
 * Every live `kind = "book"` photo's id, checksum and current author — the
 * same checksum join `tools/book-placement/db.ts` uses to match a
 * committed-in-source-control file to the real row it became.
 */
export async function fetchBookPhotosForAuthorship(
  db: AuthorshipSupabaseClient,
): Promise<DbPhotoForAuthorship[]> {
  const { data, error } = await db
    .from(RELATIONS.photos)
    .select("id, checksum_sha256, author_member_id")
    .eq("kind", "book")
    .is("deleted_at", null)
    .is("purged_at", null);
  if (error) throw new Error(`fetchBookPhotosForAuthorship: ${error.message}`);
  return (data ?? []) as DbPhotoForAuthorship[];
}

/** `{ eva: <member id>, adam: <member id> }` — resolved once, from the
    two-row roster, never hardcoded (member ids differ between a local and
    the hosted project). */
export async function fetchMemberIdBySlug(
  db: AuthorshipSupabaseClient,
): Promise<Map<"eva" | "adam", string>> {
  const { data, error } = await db.from(RELATIONS.members).select("id, slug");
  if (error) throw new Error(`fetchMemberIdBySlug: ${error.message}`);
  const out = new Map<"eva" | "adam", string>();
  for (const row of (data ?? []) as { id: string; slug: string }[]) {
    if (row.slug === "eva" || row.slug === "adam") out.set(row.slug, row.id);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The one write.
 * ------------------------------------------------------------------ */

/**
 * Set (or clear) exactly one photo's author. `authorMemberId: null` writes
 * an explicit unsigned state (migration 12) — never a placeholder member,
 * never a guess. Nothing else on the row is touched: not `caption`, not
 * `shared_day`/`shared_day_tz`/`created_at` (migration 08's trigger only
 * re-validates those three on an update that touches one of them — see its
 * own comment — so this write cannot trip it), not any storage path.
 */
export async function updatePhotoAuthor(
  db: AuthorshipSupabaseClient,
  photoId: string,
  authorMemberId: string | null,
): Promise<void> {
  const { error } = await db
    .from(RELATIONS.photos)
    .update({ author_member_id: authorMemberId })
    .eq("id", photoId);
  if (error) {
    throw new Error(`updatePhotoAuthor(photo=${photoId}): ${error.message}`);
  }
}
