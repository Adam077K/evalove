#!/usr/bin/env node
/**
 * place.ts — Eva & Adam book placement, step 2 of the archive-into-the-Book
 * pipeline (step 1 is `tools/ingest/load.ts`, on `feat/photo-ingest`).
 *
 * Turns the 51 catalogued archive items (`source.ts`/`source-items.json`)
 * into `book_entries` rows — one row per photograph, one page per row (see
 * `plan.ts`'s header for why that is the correct, schema-honouring shape).
 * Matches each planned page to its real `photos` row by
 * `checksum_sha256`, the same value `tools/ingest/load.ts` writes at
 * commit time.
 *
 * DRY-RUN BY DEFAULT. Nothing touches Supabase, and no credentials are
 * even required, unless `--commit` is passed explicitly.
 *
 * Usage (from tools/):
 *   pnpm book:place                 dry run — prints the plan, writes nothing
 *   pnpm book:place -- --commit     actually inserts book_entries rows
 *
 * WHAT THIS DOES AND DOES NOT COMMIT:
 *
 *   - Only IMAGE items that already have a matching live `photos` row
 *     (`kind = "book"`, matched by checksum) get a `book_entries` row.
 *     `tools/ingest/load.ts` only commits a photo once its founder-
 *     confirmed author is filled in (`authorship.tsv`'s `author_correction`
 *     column) — as of this tool's writing every row of that file is still
 *     blank, so a run against a fresh database will legitimately resolve
 *     zero photos and place zero pages. That is not a bug in this tool;
 *     it is upstream state this tool reports rather than works around.
 *   - VIDEO items are reported, never placed — see `plan.ts`'s
 *     `VIDEO_SKIP_REASON`. Not a curation choice; a schema gap.
 *   - Idempotent: a photo already backing a live `book_entries` row is
 *     skipped, not duplicated, on every rerun (`fetchExistingBookEntryPhotoIds`
 *     in `db.ts`).
 */

import { loadSourceItems } from "./source.ts";
import { planPlacement, type SkippedItem } from "./plan.ts";
import {
  createPlacementClient,
  fetchBookPhotosForMatch,
  fetchExistingBookEntryPhotoIds,
  insertBookEntry,
} from "./db.ts";

interface CliArgs {
  commit: boolean;
  sourcePath: string | undefined;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let commit = false;
  let sourcePath: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--commit") commit = true;
    else if (arg === "--source") sourcePath = args[++i];
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }
  return { commit, sourcePath };
}

function printSkipSummary(skipped: readonly SkippedItem[]): void {
  const byReason = new Map<string, number>();
  for (const s of skipped) byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
  for (const [reason, count] of byReason) {
    console.log(`  ${count}x — ${reason}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  console.log(`Mode: ${args.commit ? "COMMIT (writes to Supabase)" : "DRY RUN (writes nothing)"}`);

  const items = args.sourcePath ? loadSourceItems(args.sourcePath) : loadSourceItems();
  const { pages, skipped } = planPlacement(items);

  console.log(`\n${items.length} source item(s): ${pages.length} planned page(s), ${skipped.length} cannot get a page yet:`);
  printSkipSummary(skipped);

  if (!args.commit) {
    console.log("\nDry run — nothing was written. Planned pages, oldest first:");
    for (const page of pages) {
      console.log(`  ${page.isoDate}  pos ${page.position}  ${page.file}`);
    }
    console.log("\nRun again with --commit to actually write these (once matching photo rows exist).");
    return;
  }

  console.log("\nResolving planned pages against live photo rows...");
  const db = createPlacementClient();
  const [bookPhotos, alreadyPlaced] = await Promise.all([
    fetchBookPhotosForMatch(db),
    fetchExistingBookEntryPhotoIds(db),
  ]);
  const photoByChecksum = new Map(bookPhotos.map((p) => [p.checksum_sha256, p]));

  let placed = 0;
  let alreadyPresent = 0;
  let unresolved = 0;

  for (const page of pages) {
    const match = page.checksumSha256 ? photoByChecksum.get(page.checksumSha256) : undefined;
    if (!match) {
      console.log(`  UNRESOLVED (no matching live photo yet): ${page.file}`);
      unresolved++;
      continue;
    }
    if (alreadyPlaced.has(match.id)) {
      console.log(`  ALREADY PLACED: ${page.file} -> book_entries for photo ${match.id}`);
      alreadyPresent++;
      continue;
    }
    const entry = await insertBookEntry(db, { photoId: match.id, position: page.position });
    console.log(`  PLACED: ${page.file} -> book_entries ${entry.id} (photo ${match.id})`);
    placed++;
  }

  console.log("\n--- Placement summary ---");
  console.log(`Placed: ${placed}`);
  console.log(`Already present (idempotent skip): ${alreadyPresent}`);
  console.log(`Unresolved (no matching photo row yet): ${unresolved}`);
  console.log(`Reported, not placeable (video): ${skipped.length}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nPLACEMENT FAILED: ${message}`);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
