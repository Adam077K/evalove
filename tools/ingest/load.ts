#!/usr/bin/env node
/**
 * load.ts — Eva & Adam photo ingest, step 6: the database loader
 *
 * Reads manifest.json + authorship.tsv and inserts rows via the EXISTING data
 * layer — `commitPhoto` from `apps/web/lib/data/photos.ts`, unmodified — not a
 * second write path. See gateway.ts and db.ts for how a standalone script
 * reaches that function without booting the whole app's environment.
 *
 * DRY-RUN BY DEFAULT. Nothing touches Supabase, and no credentials are even
 * required, unless `--commit` is passed explicitly.
 *
 * Usage (from tools/):
 *   pnpm ingest:load                    dry run — prints the plan, writes nothing
 *   pnpm ingest:load -- --commit        actually uploads + inserts
 *   pnpm ingest:load -- --commit --source <dir>   (needed for the original upload)
 *
 * WHAT THIS DOES AND DOES NOT COMMIT:
 *
 *   - Only IMAGE items with a founder-confirmed author (authorship.tsv's
 *     `author_correction` column — a guess alone is never enough, see
 *     manifest.ts) are eligible.
 *   - `kind: "book"` is used for every row, never `"daily"`. `"daily"` means
 *     "the one shared card for this day" and `commitPhoto` retires the
 *     author's PRIOR live daily whenever a new one commits for the same day
 *     (`supersedePriorDaily`) — inserting a backlog of many photos per day as
 *     `"daily"` would each retire the one before it, soft-deleting all but the
 *     last photo of every multi-photo day. `"book"` skips that entirely.
 *   - VIDEO items (3 of them) are NOT committed. `photos.mime` is
 *     `"image/jpeg"` only in the current schema — there is no video kind, no
 *     video mime, and no column for a poster frame relationship. Forcing a
 *     video into the photos table would mean inventing schema, which this
 *     tool does not do; it is reported as a gap requiring a decision instead.
 *   - `shared_day` is NOT derived from "now" (the moment this script runs).
 *     `commitPhoto` derives it from `deps.now()` — injectable specifically for
 *     this kind of backfill (its own doc comment: "Injected so an issuance
 *     test can predict the paths"). This loader injects
 *     `startOfLocalDay(item.isoDate, author.home_timezone) + 12h` per photo,
 *     so the row files under the filename-derived date the founder named it
 *     with, in the author's own zone — not under today's date. `lib/shared-day`
 *     itself is untouched; only its exported, tested functions are called.
 *   - Idempotent by `client_uuid`, deterministically derived from the source
 *     filename (`deriveClientUuid`) — the SAME key on every rerun. Before
 *     doing any work for an item, the loader checks
 *     `gateway.findPhotoByClientUuid`; if a row is already there, nothing is
 *     re-uploaded and nothing is re-inserted.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { commitPhoto } from "@/lib/data/photos.ts";
import type { CommitPhotoInput, PhotoDeps } from "@/lib/data/photos.ts";
import { photoDisplayPath, photoOriginalPath, photoThumbPath } from "@/lib/schema.ts";
import { startOfLocalDay, isMemberSlug } from "@/lib/shared-day/index.ts";
import type { MemberSlug } from "@/lib/types.ts";

import { parseFilename } from "./filename.ts";
import { parseAuthorshipTsv } from "./manifest.ts";
import type { Manifest, ManifestItem } from "./manifest.ts";
import { createIngestClient, uploadObject } from "./db.ts";
import { ingestGateway } from "./gateway.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_OUT = resolve(HERE, "output");
const DEFAULT_SOURCE = resolve(HERE, "../../Eva-app-images");

interface CliArgs {
  manifestPath: string;
  authorshipPath: string;
  source: string;
  commit: boolean;
  limit: number | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let outDir = DEFAULT_OUT;
  let source = DEFAULT_SOURCE;
  let commit = false;
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--commit") commit = true;
    else if (arg === "--out") outDir = resolve(args[++i] ?? "");
    else if (arg === "--source") source = resolve(args[++i] ?? "");
    else if (arg === "--limit") limit = Number(args[++i]);
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return {
    manifestPath: join(outDir, "manifest.json"),
    authorshipPath: join(outDir, "authorship.tsv"),
    source,
    commit,
    limit,
  };
}

/** A valid-shaped, deterministic UUID from a stable string — same input, same output, every run. */
function uuidFromHash(salt: string, input: string): string {
  const hex = createHash("sha256").update(`${salt}:${input}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function deriveClientUuid(file: string): string {
  return uuidFromHash("eva-adam-photo-ingest/client-uuid", file);
}

function derivePhotoId(file: string): string {
  return uuidFromHash("eva-adam-photo-ingest/photo-id", file);
}

const SOURCE_MIME: Record<string, string> = {
  heic: "image/heic",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

type Plan =
  | { action: "commit"; item: ManifestItem; author: MemberSlug }
  | { action: "skip"; item: ManifestItem; reason: string };

function buildPlan(
  items: ManifestItem[],
  authorship: Map<string, { author: "eva" | "adam" | null }>,
): Plan[] {
  return items.map((item) => {
    if (item.kind === "video") {
      return {
        action: "skip",
        item,
        reason:
          "video — apps/web photos.mime is \"image/jpeg\" only; no schema support for video yet (needs a CTO/schema decision, not something this loader invents)",
      };
    }
    if (!item.derivatives.display) {
      return { action: "skip", item, reason: "no display derivative in manifest" };
    }
    const correction = authorship.get(item.file);
    if (!correction || !correction.author) {
      return {
        action: "skip",
        item,
        reason: "no founder-confirmed author in authorship.tsv (author_correction blank)",
      };
    }
    return { action: "commit", item, author: correction.author };
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  console.log(`Manifest: ${args.manifestPath}`);
  console.log(`Authorship: ${args.authorshipPath}`);
  console.log(`Mode: ${args.commit ? "COMMIT (writes to Supabase)" : "DRY RUN (writes nothing)"}`);

  const manifest = JSON.parse(readFileSync(args.manifestPath, "utf8")) as Manifest;
  const authorship = parseAuthorshipTsv(readFileSync(args.authorshipPath, "utf8"));

  let items = manifest.items;
  if (args.limit !== null) items = items.slice(0, args.limit);

  const plan = buildPlan(items, authorship);
  const toCommit = plan.filter((p): p is Extract<Plan, { action: "commit" }> => p.action === "commit");
  const toSkip = plan.filter((p): p is Extract<Plan, { action: "skip" }> => p.action === "skip");

  console.log(`\n${toCommit.length} item(s) eligible to commit, ${toSkip.length} would be skipped:`);
  const skipReasons = new Map<string, number>();
  for (const p of toSkip) {
    skipReasons.set(p.reason, (skipReasons.get(p.reason) ?? 0) + 1);
  }
  for (const [reason, count] of skipReasons) {
    console.log(`  ${count}x — ${reason}`);
  }

  if (!args.commit) {
    console.log("\nDry run — nothing was written. Eligible items:");
    for (const p of toCommit) {
      console.log(`  would commit: ${p.item.file} (${p.item.isoDate}, author=${p.author})`);
    }
    console.log("\nRun again with --commit to actually write these.");
    return;
  }

  console.log(`\nCommitting ${toCommit.length} item(s)...`);

  const db = createIngestClient();
  const gateway = ingestGateway(db);
  const members = await gateway.listMembers();
  const memberBySlug = new Map(members.map((m) => [m.slug, m]));

  let committed = 0;
  let alreadyPresent = 0;
  let failed = 0;

  for (const p of toCommit) {
    const { item, author } = p;
    const clientUuid = deriveClientUuid(item.file);

    try {
      const existing = await gateway.findPhotoByClientUuid(clientUuid);
      if (existing) {
        console.log(`  SKIP (already committed): ${item.file}`);
        alreadyPresent++;
        continue;
      }

      const member = memberBySlug.get(author);
      if (!member || !isMemberSlug(author)) {
        throw new Error(`unknown author slug "${author}" — not in the roster`);
      }

      const photoId = derivePhotoId(item.file);
      const display = item.derivatives.display!;
      const thumb = item.derivatives.thumb!;

      const displayBytes = readFileSync(display.path);
      const thumbBytes = readFileSync(thumb.path);

      await uploadObject(db, photoDisplayPath(photoId), displayBytes, "image/jpeg");
      await uploadObject(db, photoThumbPath(photoId), thumbBytes, "image/jpeg");

      // The true original — untouched, still carrying whatever EXIF/GPS it
      // had — uploaded to the PRIVATE original path so commitPhoto's
      // `original_location: "supabase"` claim is true rather than a lie about
      // bytes that were never written. Never served to a browser: `readPhotoBytes`
      // only ever serves the display/thumb variants (apps/web/lib/data/photos.ts).
      const parsed = parseFilename(item.file);
      const originalPath = join(args.source, item.file);
      const originalBytes = readFileSync(originalPath);
      const originalMime = SOURCE_MIME[parsed.extension] ?? "application/octet-stream";
      await uploadObject(db, photoOriginalPath(photoId), originalBytes, originalMime);

      // shared_day comes from THIS instant, in the author's own zone — noon
      // local, safely clear of any DST boundary — never from "now". See the
      // file header for why this matters and why it is safe to do this way.
      const createdAt = new Date(
        startOfLocalDay(item.isoDate, member.home_timezone).getTime() + 12 * 60 * 60 * 1000,
      );

      const deps: PhotoDeps = {
        gateway,
        now: () => createdAt,
        newId: () => crypto.randomUUID(),
      };

      const input: CommitPhotoInput = {
        clientUuid,
        photoId,
        kind: "book",
        author,
        width: display.width,
        height: display.height,
        bytes: display.bytes,
        colorSpace: "srgb",
        checksumSha256: display.checksumSha256,
      };
      if (item.captionSeed) input.caption = item.captionSeed;

      const result = await commitPhoto(deps, input, { authenticated: false });
      console.log(
        `  ${result.created ? "COMMITTED" : "ALREADY PRESENT"}: ${item.file} -> photo ${result.photo.id} (${item.isoDate}, ${author})`,
      );
      committed += result.created ? 1 : 0;
      alreadyPresent += result.created ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAILED: ${item.file} — ${message}`);
      failed++;
    }
  }

  console.log("\n--- Load summary ---");
  console.log(`Committed: ${committed}`);
  console.log(`Already present (idempotent skip): ${alreadyPresent}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped by plan: ${toSkip.length}`);

  if (failed > 0) process.exitCode = 1;
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nLOAD FAILED: ${message}`);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
