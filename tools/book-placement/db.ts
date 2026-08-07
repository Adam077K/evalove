/**
 * db.ts — own Supabase client for the book placement tool
 *
 * DELIBERATE ARCH §6.3 EXCEPTION — same shape as `tools/export/read.ts`
 * (present on this branch) and `tools/ingest/db.ts` (not present on this
 * branch, but makes the identical call on `feat/photo-ingest`): a
 * standalone backfill script needs its own client so it can run without
 * booting the whole app's environment validation — `apps/web/lib/env.ts`
 * checks every credential the running app needs at module load, not just
 * the two this tool needs.
 *
 * UNLIKE `tools/export/read.ts`, this file DOES write — but only ever an
 * INSERT into `book_entries`, never an update or a delete, and never
 * anything against `photos`. It does not go through
 * `apps/web/lib/data/gateway.ts`'s `DataGateway`: that interface has no
 * `book_entries` insert method today. The only writer imagined for that
 * table so far is the — currently unbuilt — hand-composition feature's
 * "first lay-down" (`docs/04-features/specs/making-metaphor.md` §8:
 * "composition is DERIVED, not stored... the transition is the first
 * lay-down"). Adding a general insert method to the app's core data
 * boundary is an architectural decision that belongs to whoever builds
 * that feature and gets it reviewed as such — not something a one-time
 * backfill tool should reach for on its own. This file is scoped exactly
 * as narrowly as `tools/export/read.ts`'s read-only exception, for one
 * additional narrow write.
 *
 * Runtime env vars — the app's names are tried first, so a working
 * `apps/web/.env.local` is sufficient with no extra setup:
 *   NEXT_PUBLIC_SUPABASE_URL    preferred (app name) — or: SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   preferred (app name) — or: SUPABASE_SERVICE_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { RELATIONS } from "../../apps/web/lib/schema.ts";

export type PlacementSupabaseClient = SupabaseClient<any, any, any>;

export function createPlacementClient(): PlacementSupabaseClient {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SERVICE_KEY"];

  if (!url || url.trim() === "") {
    throw new Error(
      "Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set. " +
        "The placement tool cannot reach Supabase without one.",
    );
  }
  if (!key || key.trim() === "") {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SERVICE_KEY is set. " +
        "The placement tool cannot authenticate with Supabase without one.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/* ------------------------------------------------------------------ *
 * Reads — matching a manifest file to a live photo row, and finding what
 * is already placed (the idempotency check).
 * ------------------------------------------------------------------ */

export interface DbPhotoForMatch {
  id: string;
  checksum_sha256: string;
}

/**
 * Every live `kind = "book"` photo's id and checksum — enough to match a
 * `source-items.json` entry to the real row it became, without pulling
 * full photo rows this tool never needs (dimensions, storage paths,
 * captions — `place.ts` writes none of those).
 */
export async function fetchBookPhotosForMatch(
  db: PlacementSupabaseClient,
): Promise<DbPhotoForMatch[]> {
  const { data, error } = await db
    .from(RELATIONS.photos)
    .select("id, checksum_sha256")
    .eq("kind", "book")
    .is("deleted_at", null)
    .is("purged_at", null);
  if (error) throw new Error(`fetchBookPhotosForMatch: ${error.message}`);
  return (data ?? []) as DbPhotoForMatch[];
}

/**
 * Every photo id already backing a live `book_entries` row.
 *
 * This IS the idempotency boundary: `place.ts` skips any photo already in
 * this set rather than inserting a second row for it, so running the tool
 * twice against the same database places nothing twice. It is an
 * application-level check, not a database-level upsert, because
 * `book_entries_photo_idx` is a PARTIAL unique index
 * (`where deleted_at is null and photo_id is not null`) —
 * `supabase-js`'s `.upsert({ onConflict })` cannot express a partial
 * index's predicate, so a raw upsert against this column would fail to
 * infer the arbiter and error on every insert, not just genuine repeats.
 * A one-writer, one-time backfill script does not need the database to
 * also enforce this; it needs to ask first, which this function is for.
 */
export async function fetchExistingBookEntryPhotoIds(
  db: PlacementSupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await db
    .from(RELATIONS.bookEntries)
    .select("photo_id")
    .is("deleted_at", null)
    .not("photo_id", "is", null);
  if (error) throw new Error(`fetchExistingBookEntryPhotoIds: ${error.message}`);
  return new Set((data ?? []).map((row) => (row as { photo_id: string }).photo_id));
}

/* ------------------------------------------------------------------ *
 * The one write.
 * ------------------------------------------------------------------ */

export interface BookEntryInsert {
  photoId: string;
  position: number;
}

/**
 * Insert one `book_entries` row pointing at a photo.
 *
 * `date_id` stays null (this tool places photographs, never a finished
 * date's artifact — the migration's XOR constraint would reject a row that
 * set both anyway). `caption` and `date_label` stay null: the underlying
 * photograph already carries its own caption
 * (`captionSeed`, set by `tools/ingest/load.ts` at commit time), and
 * `Spread.tsx`'s single-photo composition already falls back to it. This
 * tool is a quiet, deterministic placement pass, not a hand — it writes no
 * text that would read as if a person wrote it, per §4's "type directly on
 * paper" and the register table's rule that only Eva's or Adam's own hand
 * (or the app's own Fraunces voice) ever appears as authored text.
 */
export async function insertBookEntry(
  db: PlacementSupabaseClient,
  entry: BookEntryInsert,
): Promise<{ id: string }> {
  const { data, error } = await db
    .from(RELATIONS.bookEntries)
    .insert({
      photo_id: entry.photoId,
      date_id: null,
      position: entry.position,
      caption: null,
      date_label: null,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(`insertBookEntry(photo=${entry.photoId}): ${error.message}`);
  }
  return data as { id: string };
}
