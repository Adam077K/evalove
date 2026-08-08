#!/usr/bin/env node
/**
 * load.ts — Eva & Adam photo ingest, step 6: the database loader
 *
 * Reads manifest.json + verdicts.tsv (+ an optional authorship.tsv override)
 * and inserts rows via the EXISTING data layer — `commitPhoto` from
 * `apps/web/lib/data/photos.ts`, unmodified — not a second write path. See
 * gateway.ts and db.ts for how a standalone script reaches that function
 * without booting the whole app's environment.
 *
 * DRY-RUN BY DEFAULT. Nothing touches Supabase, and no credentials are even
 * required, unless `--commit` is passed explicitly.
 *
 * Usage (from tools/):
 *   pnpm ingest:load                    dry run — prints the plan, writes nothing
 *   pnpm ingest:load -- --commit        actually uploads + inserts
 *   pnpm ingest:load -- --commit --source <dir>   (needed for the original upload)
 *   pnpm ingest:load -- --verdicts <path>          override the default verdicts.tsv location
 *
 * WHO GETS AN AUTHOR, AND HOW (2026-08-07 founder decision — see verdicts.ts
 * for the mapping, quoted verbatim there):
 *
 *   Every eligible row gets an author automatically, from the authorship-pass
 *   verdicts (default `/tmp/authorship-pass/verdicts.tsv`, `--verdicts` to
 *   point elsewhere): `person_a` -> adam, `person_b` -> eva, `cannot_tell` and
 *   `third_party` -> UNSIGNED (migration 12: `author_member_id is null`, not a
 *   guess). The founder does not need to hand-fill authorship.tsv for this to
 *   work — it stays purely a MANUAL OVERRIDE sheet: a non-blank
 *   `author_correction` there (now accepting `eva`, `adam` OR `unsigned`) wins
 *   over the automatic verdicts-derived result for that one file. A file with
 *   neither a verdict nor a manual override is skipped, unresolved, same as
 *   before.
 *
 * WHAT ELSE THIS DOES AND DOES NOT COMMIT:
 *
 *   - `kind: "book"` is used for every row, never `"daily"`. `"daily"` means
 *     "the one shared card for this day, posted BY a person" and
 *     `commitPhoto` now refuses a `kind: "daily"` commit with no author
 *     outright — an unsigned row can only ever be `"book"`, and this loader
 *     never asks for anything else.
 *   - VIDEO items (3 of them) are NOT committed. `photos.mime` is
 *     `"image/jpeg"` only in the current schema — there is no video kind, no
 *     video mime, and no column for a poster frame relationship. Forcing a
 *     video into the photos table would mean inventing schema, which this
 *     tool does not do; it is reported as a gap requiring a decision instead.
 *   - `shared_day` is NOT derived from "now" (the moment this script runs).
 *     `commitPhoto` derives it from `deps.now()` — injectable specifically for
 *     this kind of backfill (its own doc comment: "Injected so an issuance
 *     test can predict the paths"). This loader injects
 *     `startOfLocalDay(item.isoDate, zone) + 12h` per photo, so the row files
 *     under the filename-derived date the founder named it with — not under
 *     today's date. For a signed item `zone` is the author's own home zone;
 *     for an unsigned item there is no author to read one from, so this calls
 *     the SAME `resolveTz(undefined, undefined)` that `commitPhoto` itself
 *     falls back to internally for an unsigned commit, rather than inventing
 *     a second fallback that could disagree with the first and trip
 *     migration 08's shared-day trigger. `lib/shared-day` itself is
 *     untouched; only its exported, tested functions are called.
 *   - Idempotent by `client_uuid`, deterministically derived from the source
 *     filename (`deriveClientUuid`) — the SAME key on every rerun. Before
 *     doing any work for an item, the loader checks
 *     `gateway.findPhotoByClientUuid`; if a row is already there, nothing is
 *     re-uploaded and nothing is re-inserted.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { commitPhoto } from "@/lib/data/photos.ts";
import type { CommitPhotoInput, PhotoDeps } from "@/lib/data/photos.ts";
import { photoDisplayPath, photoOriginalPath, photoThumbPath } from "@/lib/schema.ts";
import { startOfLocalDay, isMemberSlug, resolveTz } from "@/lib/shared-day/index.ts";
import { isMachineShapedCaption } from "@/lib/caption-law.ts";

import { parseFilename } from "./filename.ts";
import { parseAuthorshipTsv } from "./manifest.ts";
import type { AuthorshipCorrection, Manifest } from "./manifest.ts";
import { parseVerdictsTsv } from "./verdicts.ts";
import type { Verdict } from "./verdicts.ts";
import { buildPlan } from "./plan.ts";
import type { Plan } from "./plan.ts";
import { createIngestClient, uploadObject } from "./db.ts";
import { ingestGateway } from "./gateway.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_OUT = resolve(HERE, "output");
const DEFAULT_SOURCE = resolve(HERE, "../../Eva-app-images");
/** Where the authorship pass leaves its verdicts. `--verdicts` overrides. */
const DEFAULT_VERDICTS = "/tmp/authorship-pass/verdicts.tsv";

interface CliArgs {
  manifestPath: string;
  authorshipPath: string;
  verdictsPath: string;
  source: string;
  commit: boolean;
  limit: number | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let outDir = DEFAULT_OUT;
  let source = DEFAULT_SOURCE;
  let verdictsPath = DEFAULT_VERDICTS;
  let commit = false;
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--commit") commit = true;
    else if (arg === "--out") outDir = resolve(args[++i] ?? "");
    else if (arg === "--source") source = resolve(args[++i] ?? "");
    else if (arg === "--verdicts") verdictsPath = resolve(args[++i] ?? "");
    else if (arg === "--limit") limit = Number(args[++i]);
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return {
    manifestPath: join(outDir, "manifest.json"),
    authorshipPath: join(outDir, "authorship.tsv"),
    verdictsPath,
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  console.log(`Manifest: ${args.manifestPath}`);
  console.log(`Verdicts: ${args.verdictsPath}`);
  console.log(`Authorship (manual override): ${args.authorshipPath}`);
  console.log(`Mode: ${args.commit ? "COMMIT (writes to Supabase)" : "DRY RUN (writes nothing)"}`);

  const manifest = JSON.parse(readFileSync(args.manifestPath, "utf8")) as Manifest;

  // Both sheets are optional now. Neither existing is not an error: an
  // absent authorship.tsv means "no manual overrides" (the founder should
  // not have to hand-fill it any more), and — separately — an absent
  // verdicts.tsv means every file falls back to "no verdict, no override",
  // i.e. everything is skipped, which is the same safe default this loader
  // has always had for an unresolved file.
  const authorship = existsSync(args.authorshipPath)
    ? parseAuthorshipTsv(readFileSync(args.authorshipPath, "utf8"))
    : new Map<string, AuthorshipCorrection>();
  const verdicts = existsSync(args.verdictsPath)
    ? parseVerdictsTsv(readFileSync(args.verdictsPath, "utf8"))
    : new Map<string, Verdict>();
  if (verdicts.size === 0) {
    console.log(
      `  (no verdicts found at ${args.verdictsPath} — every file will be skipped unless ` +
        "authorship.tsv overrides it directly)",
    );
  }

  let items = manifest.items;
  if (args.limit !== null) items = items.slice(0, args.limit);

  const plan = buildPlan(items, authorship, verdicts);
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

  // The author tally — eva / adam / unsigned — over everything eligible to
  // commit, regardless of dry-run or --commit. This is the number a founder
  // sign-off review reads before anything is written.
  const tally = { eva: 0, adam: 0, unsigned: 0 };
  for (const p of toCommit) tally[p.author]++;
  console.log(
    `\nAuthor tally over ${toCommit.length} eligible item(s): ` +
      `adam=${tally.adam} eva=${tally.eva} unsigned=${tally.unsigned}`,
  );

  if (!args.commit) {
    console.log("\nDry run — nothing was written. Eligible items:");
    for (const p of toCommit) {
      console.log(
        `  would commit: ${p.item.file} (${p.item.isoDate}, author=${p.author}, source=${p.source})`,
      );
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

      // `undefined` for an unsigned commit — `author_member_id is null`
      // (migration 12). No member to look up; nothing here invents one.
      const member = author === "unsigned" ? undefined : memberBySlug.get(author);
      if (author !== "unsigned" && (!member || !isMemberSlug(author))) {
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

      // shared_day comes from THIS instant, in an anchor zone — noon local,
      // safely clear of any DST boundary — never from "now". For a signed
      // item the anchor is the author's own home zone. For an unsigned item
      // there is no author to read one from, so this reaches for the exact
      // same fallback `commitPhoto` will independently apply inside itself
      // (`resolveTz(undefined, member?.home_timezone)` — its own doc comment:
      // "the zone the shared day opens in"). Deriving the SAME zone here that
      // commitPhoto derives there is what keeps `noon local` and the
      // trigger-checked `shared_day` in migration 08 agreeing; inventing a
      // second, different fallback in this file would risk the two
      // disagreeing on a date near a boundary.
      const zone = resolveTz(undefined, member?.home_timezone);
      const createdAt = new Date(
        startOfLocalDay(item.isoDate, zone).getTime() + 12 * 60 * 60 * 1000,
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
        // Omitted entirely for "unsigned" — CommitPhotoInput.author is
        // optional precisely so an ingest-only caller can commit a photo
        // with author_member_id null (migration 12). Every other caller in
        // this app (app/api/photos/route.ts) always supplies one.
        ...(author !== "unsigned" ? { author } : {}),
        width: display.width,
        height: display.height,
        bytes: display.bytes,
        colorSpace: "srgb",
        checksumSha256: display.checksumSha256,
      };
      // `prepare.ts`'s `resolveCaptionSeed` already filters a machine-shaped
      // catalogue caption_seed out of manifest.json before this ever runs —
      // this is a second, independent check on manifest.json itself (which
      // could be stale, or hand-edited, or built by an older prepare.ts),
      // so THIS loader never writes an internal note as a caption either
      // way. `commitPhoto` below would also refuse it (lib/caption-law.ts),
      // but refusing here means a bad caption costs the photo nothing —
      // the photo still commits, uncaptioned — instead of failing the whole
      // item the way an exception out of commitPhoto would.
      if (item.captionSeed && isMachineShapedCaption(item.captionSeed)) {
        console.warn(
          `  WARN: ${item.file}'s captionSeed reads as an internal/technical note, ` +
            `not a caption — committing without one: ${JSON.stringify(item.captionSeed)}`,
        );
      } else if (item.captionSeed) {
        input.caption = item.captionSeed;
      }

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

// Only run as the CLI entrypoint (`tsx ingest/load.ts`), never on import.
// This file is never imported by a test (the resolution logic tests exercise
// lives in `plan.ts`, which has no Supabase dependency — see its header) —
// but the guard is cheap insurance against exactly the failure mode that
// separation avoids: importing this module would otherwise immediately call
// `main()` against the importer's own `process.argv` and exit the process.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\nLOAD FAILED: ${message}`);
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  });
}
