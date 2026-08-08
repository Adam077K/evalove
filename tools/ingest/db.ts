/**
 * db.ts — own service-role Supabase client for the photo ingest loader.
 *
 * DELIBERATE ARCH §6.3 EXCEPTION — same one `tools/export/read.ts` documents,
 * applied to writes instead of reads. Do not "fix" this into an import of
 * `apps/web/lib/data/client.ts`.
 *
 * `apps/web/lib/data/client.ts` is guarded by `apps/web/lib/env.ts`, which
 * validates the WHOLE app's environment at module evaluation — session
 * secrets, the app password hash, the vault passphrase, everything — not just
 * the two Supabase values this tool needs. Reaching it from a standalone
 * script would mean a one-time bulk-load script cannot run without every
 * other credential the running app happens to require, for no reason related
 * to what this script does. `tools/export/read.ts` made the same call for
 * reads; this file makes it for writes.
 *
 * `apps/web/lib/schema.ts` IS imported (via the `@/` alias — see
 * tools/tsconfig.json's `paths`): it is a declaration of what the SQL owns
 * (relation names, storage path constants, the media bucket name), has no
 * runtime dependencies, and is safe to import from a standalone script.
 *
 * Runtime env vars — the app's names are tried first, so a working
 * apps/web/.env.local is sufficient with no extra setup:
 *   NEXT_PUBLIC_SUPABASE_URL    preferred (app name) — or: SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   preferred (app name) — or: SUPABASE_SERVICE_KEY
 *
 * UNLIKE read.ts, this client DOES write: it uploads derivative bytes to the
 * `media` bucket and inserts rows into `photos`. Every write path in this file
 * is invoked only through `load.ts`, which is dry-run by default and refuses
 * to touch the database without an explicit `--commit` flag.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/schema.ts";

/**
 * Loose-typed on purpose: this project has no generated `Database` type, and
 * without one supabase-js's default generic collapses `.upsert()`/`.insert()`/
 * `.update()`'s row-shape inference to `never` (harmless for `read.ts`'s
 * `.select()`-only calls in tools/export, but this file writes). An explicit
 * `any` here is the same trade `apps/web/lib/data/rows.ts` already makes with
 * `data as unknown as PhotoRow` on the way out — the row shape is asserted
 * against the schema-derived `PhotoRow`/`BookEntryRow` types at the call site
 * in gateway.ts, not left unchecked.
 */
export type IngestSupabaseClient = SupabaseClient<any, any, any>;

export function createIngestClient(): IngestSupabaseClient {
  const url =
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    process.env["SUPABASE_SERVICE_KEY"];

  if (!url || url.trim() === "") {
    throw new Error(
      "Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set. " +
        "The loader cannot reach Supabase without one.",
    );
  }
  if (!key || key.trim() === "") {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_SERVICE_KEY is set. " +
        "The loader cannot authenticate with Supabase without one.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Upload one derivative's bytes to the media bucket.
 *
 * `upsert: true` — an idempotent rerun that reaches this point again (because
 * a prior run uploaded bytes but crashed before the `photos` insert) should
 * overwrite the same bytes at the same path rather than error. The `photos`
 * row insert is the real idempotency boundary (`client_uuid`, unique); see
 * load.ts. A storage object with no row pointing at it is an ordinary,
 * harmless state in this system — `commitPhoto`'s own header explains why.
 */
export async function uploadObject(
  db: IngestSupabaseClient,
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await db.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) {
    throw new Error(`uploadObject(${path}) failed: ${error.message}`);
  }
}
