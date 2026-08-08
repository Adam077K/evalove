/**
 * resolve.ts — turns the committed roster (`candidates.ts`) into a plan,
 * and separately validates the roster against `lib/caption-law.ts` so a
 * bad row can never be staged in the first place.
 *
 * Pure. No filesystem, no network, no clock — same shape
 * `tools/authorship-fix/resolve.ts` keeps its planning logic in.
 */

import { isMachineShapedCaption } from "@/lib/caption-law.ts";
import type { CaptionCandidate } from "./candidates.ts";

export interface PlannedCaptionChange {
  file: string;
  checksumSha256: string;
  currentCaption: string;
  proposedCaption: string | null;
  reason: string;
}

/**
 * Every candidate becomes exactly one planned change, in roster order.
 * There is no "open question, no default" state here the way
 * authorship-fix has one — a row only belongs in this roster once it has
 * been hand-judged (see candidates.ts's own header), so every row IS a
 * staged change.
 */
export function buildCaptionPlan(
  roster: readonly CaptionCandidate[],
): PlannedCaptionChange[] {
  return roster.map((c) => ({
    file: c.file,
    checksumSha256: c.checksumSha256,
    currentCaption: c.currentCaption,
    proposedCaption: c.proposedCaption,
    reason: c.reason,
  }));
}

/**
 * Sanity-checks the roster itself, independent of any live database state:
 *
 *   1. Every `currentCaption` actually reads as machine-shaped — a row that
 *      does not match the guard has no business in this "corrections"
 *      roster (it may just be an ordinary caption someone mis-flagged).
 *   2. No `proposedCaption` is ITSELF machine-shaped — this tool must never
 *      replace one bad caption with another.
 *
 * `apply.ts` runs this before printing anything, so a mistake in
 * `candidates.ts` fails loudly before it ever reaches the database, not
 * silently at commit time.
 */
export function validateRoster(roster: readonly CaptionCandidate[]): string[] {
  const problems: string[] = [];
  for (const c of roster) {
    if (!isMachineShapedCaption(c.currentCaption)) {
      problems.push(
        `${c.file}: currentCaption does not read as machine-shaped — ` +
          `"${c.currentCaption}" — this roster is for corrections only`,
      );
    }
    if (c.proposedCaption !== null && isMachineShapedCaption(c.proposedCaption)) {
      problems.push(
        `${c.file}: proposedCaption ITSELF reads as machine-shaped — ` +
          `"${c.proposedCaption}" — refusing to replace one bad caption with another`,
      );
    }
  }
  return problems;
}
