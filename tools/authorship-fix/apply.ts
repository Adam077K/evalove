#!/usr/bin/env node
/**
 * apply.ts — 24 July authorship: attribute the photographs "of us" that
 * currently sit unsigned, on the founder's explicit say-so, per file.
 *
 * WHAT THIS IS, IN ONE SENTENCE. The founder said "in the book put images
 * from the 24 in july of us to adam and eva." 18 of the day's 21
 * photographs already carry the author the authorship pass resolved
 * (`tools/ingest/verdicts.ts`'s founder-fixed mapping). The other 3 —
 * `24:7:26-4.JPG`, `24:7:26-18.JPG`, `24:7:26-10.HEIC` — are exactly "of
 * us" (both of them pictured together) AND the shooter is genuinely
 * unresolved (a stranger, or "can't tell which partner"). See
 * `candidates.ts` for the full roster and the evidence behind every row.
 *
 * WHY THIS TOOL DOES NOT PICK AN AUTHOR FOR THOSE 3 BY ITSELF. `photos`
 * has exactly one `author_member_id` — there is no schema support for "both
 * of them," and inventing a coin-flip default would be exactly the
 * "invented attribution" the founder's 2026-08-07 decision (migration 12)
 * exists to refuse: "let the Book hold them unsigned — treat these as
 * shared, not authored." For a photograph a THIRD PARTY took, "unsigned"
 * is arguably still the honest answer even under the "of us" request —
 * which is precisely why this tool asks rather than assumes. Supply an
 * `--overrides` file (see below) naming which of the 3 you want signed,
 * and to whom, or leave it out and nothing changes for them.
 *
 * DRY-RUN BY DEFAULT. Nothing touches Supabase, and no credentials are even
 * required, unless `--commit` is passed. The dry run needs no network call
 * at all — `candidates.ts` already carries what SHOULD be live, so the plan
 * prints from source control alone; `--commit` is the only path that reads
 * or writes the database, and it re-checks each row's live state before
 * writing (idempotent — a file already at its target author is skipped,
 * not re-written).
 *
 * IDEMPOTENT. Safe to run twice: `--commit` only writes a row whose live
 * `author_member_id` differs from the plan's target.
 *
 * NEVER RUN BY AN AGENT AGAINST THE LIVE DATABASE. This tool is built so
 * the founder can run `--commit` himself, in his own terminal, with his own
 * credentials — no agent working on this codebase runs it with `--commit`.
 *
 * Usage (from tools/):
 *   pnpm authorship:fix                                   dry run, no overrides
 *   pnpm authorship:fix -- --overrides <path>              dry run, with your choices
 *   pnpm authorship:fix -- --overrides <path> --commit     actually write them
 *
 * Overrides file — a TSV, one row per file you want to decide:
 *   # file                author (eva | adam | unsigned | leave)
 *   24:7:26-4.JPG          eva
 *   24:7:26-18.JPG         eva
 *   24:7:26-10.HEIC        leave
 * `leave` records an explicit "no, keep this one unsigned" (distinct from
 * omitting the row, which is silence, not a decision). Any of the other 18
 * already-resolved files may also be named here, to correct one by hand.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AUTHORSHIP_ROSTER_2026_07_24 } from "./candidates.ts";
import { parseOverridesTsv, resolvePlan, stagedChanges } from "./resolve.ts";
import type { OverrideValue, PlannedAction } from "./resolve.ts";
import type { ResolvedAuthor } from "./candidates.ts";
import {
  createAuthorshipClient,
  fetchBookPhotosForAuthorship,
  fetchMemberIdBySlug,
  updatePhotoAuthor,
} from "./db.ts";

interface CliArgs {
  commit: boolean;
  overridesPath: string | undefined;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let commit = false;
  let overridesPath: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--commit") commit = true;
    else if (arg === "--overrides") overridesPath = resolve(args[++i] ?? "");
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }
  return { commit, overridesPath };
}

function printRosterLine(a: PlannedAction): void {
  const staged = a.targetAuthor !== null ? `-> ${a.targetAuthor}` : "(no change)";
  console.log(`  ${a.file.padEnd(20)} currently ${a.currentAuthor.padEnd(9)} ${staged}`);
  console.log(`    ${a.reason}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  console.log(`Mode: ${args.commit ? "COMMIT (writes to Supabase)" : "DRY RUN (writes nothing)"}`);
  console.log(`Overrides: ${args.overridesPath ?? "(none supplied)"}`);

  const overrides: Map<string, OverrideValue> =
    args.overridesPath && existsSync(args.overridesPath)
      ? parseOverridesTsv(readFileSync(args.overridesPath, "utf8"))
      : new Map();
  if (args.overridesPath && !existsSync(args.overridesPath)) {
    console.log(`  (overrides file not found at ${args.overridesPath} — proceeding with none)`);
  }

  const plan = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, overrides);
  const alreadyResolved = plan.filter((p) => p.source === "already-resolved-no-op");
  const openQuestions = plan.filter((p) => p.source === "open-question-no-default");
  const overridden = plan.filter((p) => p.source === "override");

  console.log(`\n24 July 2026 — ${plan.length} photograph(s) in the archive.\n`);

  console.log(`Already resolved by the authorship pass, no change requested (${alreadyResolved.length}):`);
  for (const a of alreadyResolved) printRosterLine(a);

  console.log(`\nOPEN QUESTIONS — both of them pictured, shooter unresolved, currently unsigned (${openQuestions.length}):`);
  for (const a of openQuestions) printRosterLine(a);
  if (openQuestions.length > 0) {
    console.log(
      "\n  No change is staged for any of these unless you name it in an --overrides file.\n" +
        "  Example row: 24:7:26-4.JPG<TAB>eva   (or adam, or unsigned/leave to confirm no change)",
    );
  }

  if (overridden.length > 0) {
    console.log(`\nYour overrides (${overridden.length}):`);
    for (const a of overridden) printRosterLine(a);
  }

  const changes = stagedChanges(plan);
  console.log(`\n--- ${changes.length} change(s) staged ---`);

  if (changes.length === 0) {
    console.log("Nothing to write. Add an --overrides file to stage a change.");
    return;
  }

  if (!args.commit) {
    console.log("\nDry run — nothing was written. Re-run with --commit to write these.");
    return;
  }

  console.log("\nResolving staged files against live photo rows...");
  const db = createAuthorshipClient();
  const [bookPhotos, memberIds] = await Promise.all([
    fetchBookPhotosForAuthorship(db),
    fetchMemberIdBySlug(db),
  ]);
  const photoByChecksum = new Map(bookPhotos.map((p) => [p.checksum_sha256, p]));

  const toMemberId = (author: ResolvedAuthor): string | null => {
    if (author === "unsigned") return null;
    const id = memberIds.get(author);
    if (id === undefined) throw new Error(`no live member row for slug "${author}"`);
    return id;
  };

  let written = 0;
  let alreadyCorrect = 0;
  let unresolved = 0;

  for (const change of changes) {
    const match = photoByChecksum.get(change.checksumSha256);
    if (!match) {
      console.log(`  UNRESOLVED (no matching live photo): ${change.file}`);
      unresolved++;
      continue;
    }
    const targetMemberId = toMemberId(change.targetAuthor!);
    if (match.author_member_id === targetMemberId) {
      console.log(`  ALREADY CORRECT: ${change.file} (already ${change.targetAuthor})`);
      alreadyCorrect++;
      continue;
    }
    await updatePhotoAuthor(db, match.id, targetMemberId);
    console.log(`  WRITTEN: ${change.file} -> ${change.targetAuthor} (photo ${match.id})`);
    written++;
  }

  console.log("\n--- Commit summary ---");
  console.log(`Written: ${written}`);
  console.log(`Already correct (idempotent skip): ${alreadyCorrect}`);
  console.log(`Unresolved (no matching live photo yet): ${unresolved}`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nAUTHORSHIP-FIX FAILED: ${message}`);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
