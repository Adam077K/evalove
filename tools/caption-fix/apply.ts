#!/usr/bin/env node
/**
 * apply.ts — correct the live captions the 2026-08-08 audit flagged as
 * machine-shaped (an ingest catalogue's internal note, rendered as if a
 * person had written it). See `candidates.ts` for the full roster and the
 * evidence behind each row, and `apps/web/lib/caption-law.ts` for the
 * guard this tool checks every row against before staging or writing
 * anything.
 *
 * DRY-RUN BY DEFAULT. Nothing touches Supabase, and no credentials are even
 * required, unless `--commit` is passed. The dry run needs no network call
 * at all — `candidates.ts` already carries what SHOULD be live, so the plan
 * prints from source control alone; `--commit` is the only path that reads
 * or writes the database, and it re-checks each row's live state before
 * writing.
 *
 * IDEMPOTENT AND CONSERVATIVE. `--commit` writes a row ONLY when the live
 * caption still matches `currentCaption` exactly. If the live caption
 * already equals `proposedCaption`, the row is skipped as already correct.
 * If the live caption is neither of those — something else changed it since
 * this roster was written — the row is skipped as a MISMATCH and reported,
 * never silently overwritten.
 *
 * NEVER RUN BY AN AGENT AGAINST THE LIVE DATABASE. This tool is built so
 * the founder can run `--commit` himself, in his own terminal, with his own
 * credentials — same rule `tools/authorship-fix/apply.ts` states for the
 * same reason, and the same boundary an earlier agent's own permission
 * system already enforced by refusing a live write on this exact task.
 *
 * Usage (from tools/):
 *   pnpm caption:fix                    dry run — prints the plan, writes nothing
 *   pnpm caption:fix -- --commit        actually writes the corrections
 */

import { CAPTION_CORRECTIONS_2026_08_08 } from "./candidates.ts";
import { buildCaptionPlan, validateRoster } from "./resolve.ts";
import type { PlannedCaptionChange } from "./resolve.ts";
import {
  createCaptionFixClient,
  fetchPhotosForCaptionFix,
  updatePhotoCaption,
} from "./db.ts";

interface CliArgs {
  commit: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let commit = false;
  for (const arg of args) {
    if (arg === "--commit") commit = true;
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }
  return { commit };
}

function printPlanLine(p: PlannedCaptionChange): void {
  const newValue = p.proposedCaption === null ? "(no caption)" : `"${p.proposedCaption}"`;
  console.log(`  ${p.file}`);
  console.log(`    old: "${p.currentCaption}"`);
  console.log(`    new: ${newValue}`);
  console.log(`    why: ${p.reason}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  console.log(`Mode: ${args.commit ? "COMMIT (writes to Supabase)" : "DRY RUN (writes nothing)"}`);

  // The roster's own internal consistency, checked BEFORE anything is
  // printed or touched — a bad row in candidates.ts fails loudly here, not
  // silently at commit time.
  const problems = validateRoster(CAPTION_CORRECTIONS_2026_08_08);
  if (problems.length > 0) {
    console.error("\nBLOCKED: candidates.ts failed its own sanity check:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const plan = buildCaptionPlan(CAPTION_CORRECTIONS_2026_08_08);

  console.log(`\n${plan.length} caption correction(s) staged from candidates.ts:\n`);
  for (const p of plan) printPlanLine(p);

  if (!args.commit) {
    console.log("\nDry run — nothing was written. Re-run with --commit to write these.");
    return;
  }

  console.log("\nResolving staged files against live photo rows...");
  const db = createCaptionFixClient();
  const photos = await fetchPhotosForCaptionFix(db);
  const photoByChecksum = new Map(photos.map((p) => [p.checksum_sha256, p]));

  let written = 0;
  let alreadyCorrect = 0;
  let unresolved = 0;
  let mismatched = 0;

  for (const change of plan) {
    const match = photoByChecksum.get(change.checksumSha256);
    if (!match) {
      console.log(`  UNRESOLVED (no matching live photo): ${change.file}`);
      unresolved++;
      continue;
    }
    if (match.caption === change.proposedCaption) {
      console.log(`  ALREADY CORRECT: ${change.file} (photo ${match.id})`);
      alreadyCorrect++;
      continue;
    }
    if (match.caption !== change.currentCaption) {
      console.log(
        `  MISMATCH, SKIPPED (live caption differs from what this roster expected): ` +
          `${change.file} (photo ${match.id})`,
      );
      console.log(`    expected old: "${change.currentCaption}"`);
      console.log(`    actually live: ${match.caption === null ? "(no caption)" : `"${match.caption}"`}`);
      console.log(`    Not overwritten — update candidates.ts by hand if this is still correct to apply.`);
      mismatched++;
      continue;
    }
    await updatePhotoCaption(db, match.id, change.proposedCaption);
    console.log(
      `  WRITTEN: ${change.file} -> ${
        change.proposedCaption === null ? "(no caption)" : `"${change.proposedCaption}"`
      } (photo ${match.id})`,
    );
    written++;
  }

  console.log("\n--- Commit summary ---");
  console.log(`Written: ${written}`);
  console.log(`Already correct (idempotent skip): ${alreadyCorrect}`);
  console.log(`Unresolved (no matching live photo): ${unresolved}`);
  console.log(`Mismatched (live caption changed since roster was written, skipped): ${mismatched}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nCAPTION-FIX FAILED: ${message}`);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
