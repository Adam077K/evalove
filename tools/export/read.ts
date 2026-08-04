/**
 * read.ts — own read-only Supabase client for the archive export
 *
 * DELIBERATE ARCH §6.3 VIOLATION — do not "fix" this.
 *
 * This file imports @supabase/supabase-js directly rather than routing through
 * apps/web/lib/data/*. The rule being broken is real (lib/data/* is the one
 * approved surface for database access in the running app). The break is
 * intentional:
 *
 *   An exit coupled to the application's data layer is not an exit.
 *
 * If lib/data/* is refactored, broken, or unavailable — precisely the
 * conditions under which a backup is most needed — this tool must still run.
 * The whole point of the export is that it works when the app is gone. Routing
 * through lib/data/* would make the exit contingent on the thing it is
 * supposed to survive.
 *
 * apps/web/lib/schema.ts IS imported: it is a declaration of what the SQL
 * owns (relation names, storage path constants). It has no runtime deps and
 * no side effects. It is safe to import from a standalone Node script.
 *
 * Runtime env vars — the app's names are tried first, so a working
 * apps/web/.env.local is sufficient with no extra setup:
 *   NEXT_PUBLIC_SUPABASE_URL    preferred (app name) — or: SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   preferred (app name) — or: SUPABASE_SERVICE_KEY
 *
 * This module is read-only by contract. It never writes, updates, or deletes
 * any row. Never call `.insert()`, `.update()`, `.delete()`, `.upsert()`, or
 * any storage mutation on the client returned here.
 */

import { createClient } from "@supabase/supabase-js";
import { RELATIONS, MEDIA_BUCKET } from "../../apps/web/lib/schema.ts";

// ---------------------------------------------------------------------------
// Types — the rows we care about
// ---------------------------------------------------------------------------

export interface DbMember {
  id: string;
  slug: "eva" | "adam";
  display_name: string;
  home_timezone: string;
  created_at: string;
}

export interface DbPhoto {
  id: string;
  kind: "daily" | "book";
  author_member_id: string;
  shared_day: string; // 'YYYY-MM-DD'
  shared_day_tz: string;
  taken_at: string | null;
  caption: string | null;
  storage_path_display: string;
  storage_path_thumb: string;
  storage_path_original: string | null;
  original_location: "none" | "supabase" | "r2" | "purged";
  checksum_sha256: string;
  created_at: string;
  deleted_at: string | null;
  purged_at: string | null;
}

export interface DbVaultItem {
  id: string;
  author_member_id: string;
  shared_day: string;
  shared_day_tz: string;
  taken_at: string | null;
  caption: string | null;
  storage_path_display: string;
  checksum_sha256: string;
  created_at: string;
  deleted_at: string | null;
  purged_at: string | null;
}

export interface DbBookEntry {
  id: string;
  photo_id: string | null;
  date_id: string | null;
  position: number;
  caption: string | null;
  date_label: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface DbDate {
  id: string;
  kind: string;
  status: string;
  started_by: string;
  config: unknown;
  created_at: string;
  finished_at: string | null;
}

export interface DbDateTurn {
  id: string;
  date_id: string;
  member_id: string;
  seq: number;
  turn_kind: "turn" | "guess" | "reveal";
  body: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export function createExportClient(): ReturnType<typeof createClient> {
  // Accept the app's .env.local names first so Eva can run this tool without
  // any additional setup beyond copying .env.local into her environment.
  // The bare names (SUPABASE_URL, SUPABASE_SERVICE_KEY) remain as fallbacks
  // for standalone / CI use where the Next.js prefix is absent.
  const url =
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    process.env["SUPABASE_SERVICE_KEY"];

  if (!url || url.trim() === "") {
    throw new Error(
      "Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set. " +
        "Export cannot read from the database.",
    );
  }
  if (!key || key.trim() === "") {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SERVICE_KEY is set. " +
        "Export cannot authenticate with Supabase.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Read functions — all read-only, no mutations
// ---------------------------------------------------------------------------

export async function fetchMembers(
  db: ReturnType<typeof createClient>,
): Promise<DbMember[]> {
  const { data, error } = await db
    .from(RELATIONS.members)
    .select("id, slug, display_name, home_timezone, created_at")
    .order("created_at");

  if (error) {
    throw new Error(`fetchMembers failed: ${error.message}`);
  }
  return (data ?? []) as DbMember[];
}

/** Returns all non-deleted, non-purged photos. Soft-deleted rows are skipped. */
export async function fetchPhotos(
  db: ReturnType<typeof createClient>,
): Promise<DbPhoto[]> {
  const { data, error } = await db
    .from(RELATIONS.photos)
    .select(
      "id, kind, author_member_id, shared_day, shared_day_tz, taken_at, caption, " +
        "storage_path_display, storage_path_thumb, storage_path_original, original_location, " +
        "checksum_sha256, created_at, deleted_at, purged_at",
    )
    .is("deleted_at", null)
    .order("shared_day")
    .order("created_at");

  if (error) {
    throw new Error(`fetchPhotos failed: ${error.message}`);
  }
  return (data ?? []) as DbPhoto[];
}

/** Vault items — only fetched when --include-vault is passed. */
export async function fetchVaultItems(
  db: ReturnType<typeof createClient>,
): Promise<DbVaultItem[]> {
  const { data, error } = await db
    .from(RELATIONS.vaultItems)
    .select(
      "id, author_member_id, shared_day, shared_day_tz, taken_at, caption, " +
        "storage_path_display, checksum_sha256, created_at, deleted_at, purged_at",
    )
    .is("deleted_at", null)
    .order("shared_day")
    .order("created_at");

  if (error) {
    throw new Error(`fetchVaultItems failed: ${error.message}`);
  }
  return (data ?? []) as DbVaultItem[];
}

/** Book entries that have not been removed from the book. */
export async function fetchBookEntries(
  db: ReturnType<typeof createClient>,
): Promise<DbBookEntry[]> {
  const { data, error } = await db
    .from(RELATIONS.bookEntries)
    .select(
      "id, photo_id, date_id, position, caption, date_label, created_at, deleted_at",
    )
    .is("deleted_at", null)
    .order("position");

  if (error) {
    throw new Error(`fetchBookEntries failed: ${error.message}`);
  }
  return (data ?? []) as DbBookEntry[];
}

/** All dates (date sessions), regardless of status. */
export async function fetchDates(
  db: ReturnType<typeof createClient>,
): Promise<DbDate[]> {
  const { data, error } = await db
    .from(RELATIONS.dates)
    .select("id, kind, status, started_by, config, created_at, finished_at")
    .order("created_at");

  if (error) {
    throw new Error(`fetchDates failed: ${error.message}`);
  }
  return (data ?? []) as DbDate[];
}

/** All turns across all dates, ordered chronologically within each date. */
export async function fetchDateTurns(
  db: ReturnType<typeof createClient>,
): Promise<DbDateTurn[]> {
  const { data, error } = await db
    .from(RELATIONS.dateTurns)
    .select("id, date_id, member_id, seq, turn_kind, body, created_at")
    .order("date_id")
    .order("seq");

  if (error) {
    throw new Error(`fetchDateTurns failed: ${error.message}`);
  }
  return (data ?? []) as DbDateTurn[];
}

/**
 * Download the bytes of a storage object.
 * Returns null if the object does not exist (bytes gone, purged, etc.).
 */
export async function downloadStorageObject(
  db: ReturnType<typeof createClient>,
  storagePath: string,
): Promise<Buffer | null> {
  const { data, error } = await db.storage
    .from(MEDIA_BUCKET)
    .download(storagePath);

  if (error || !data) {
    // Storage does not return typed "not found" — any error means unavailable.
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
