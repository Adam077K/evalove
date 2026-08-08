/**
 * resolve.ts — merges the committed roster (`candidates.ts`) with the
 * founder's optional overrides into one deterministic plan.
 *
 * Pure. No filesystem, no network, no clock — same roster and overrides in,
 * byte-identical plan out, same shape `tools/book-placement/plan.ts` and
 * `tools/ingest/plan.ts` both keep their planning logic in.
 *
 * THE ONE RULE THIS FILE ENFORCES: an `openQuestion` candidate with no
 * override gets NO staged change. `apply.ts` never invents an author for a
 * photograph the authorship pass could not resolve and the catalogue shows
 * both of them in — that decision is the founder's, made explicit through
 * an override, never defaulted.
 */

import type { AuthorshipCandidate, ResolvedAuthor } from "./candidates.ts";

/** `"leave"` is a valid override value distinct from omitting the file
    entirely — it lets the founder explicitly confirm "no, leave this one
    unsigned" for a candidate, visible in the plan as a deliberate decision
    rather than as silence that might just mean "the overrides file forgot
    this row." */
export type OverrideValue = ResolvedAuthor | "leave";

export type PlanSource =
  | "override"
  | "open-question-no-default"
  | "already-resolved-no-op";

export interface PlannedAction {
  file: string;
  checksumSha256: string;
  /** What the roster says should already be live. */
  currentAuthor: ResolvedAuthor;
  /** `null` — nothing is staged for this file. Non-null — this is the
      author `apply.ts` will write when run with `--commit`. */
  targetAuthor: ResolvedAuthor | null;
  source: PlanSource;
  reason: string;
}

/**
 * Parse an overrides TSV: `file<TAB>author`, header optional, blank lines
 * and `#` comments skipped. `author` must be `eva`, `adam`, `unsigned` or
 * `leave` — anything else throws rather than silently doing nothing, the
 * same "loud, specific failure" choice `tools/ingest/verdicts.ts` makes for
 * an unrecognised shooter label.
 */
export function parseOverridesTsv(content: string): Map<string, OverrideValue> {
  const out = new Map<string, OverrideValue>();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [rawFile, rawAuthor] = line.split("\t");
    const file = rawFile?.trim();
    if (!file || file === "file") continue; // header row
    const author = (rawAuthor ?? "").trim();
    if (author === "") continue; // a row with no value is a no-op, not an error
    if (author !== "eva" && author !== "adam" && author !== "unsigned" && author !== "leave") {
      throw new Error(
        `overrides file: row "${file}" has author "${author}", which is not one of ` +
          "eva / adam / unsigned / leave. Fix the row before this file can be used — " +
          "do not guess.",
      );
    }
    out.set(file, author);
  }
  return out;
}

export function resolvePlan(
  roster: readonly AuthorshipCandidate[],
  overrides: ReadonlyMap<string, OverrideValue>,
): PlannedAction[] {
  return roster.map((c) => {
    const override = overrides.get(c.file);

    if (override !== undefined) {
      const targetAuthor = override === "leave" ? null : override;
      return {
        file: c.file,
        checksumSha256: c.checksumSha256,
        currentAuthor: c.currentAuthor,
        targetAuthor,
        source: "override",
        reason:
          override === "leave"
            ? `founder override: explicitly leave as ${c.currentAuthor}`
            : `founder override: set to ${override}`,
      };
    }

    if (c.openQuestion) {
      return {
        file: c.file,
        checksumSha256: c.checksumSha256,
        currentAuthor: c.currentAuthor,
        targetAuthor: null,
        source: "open-question-no-default",
        reason: c.reason,
      };
    }

    return {
      file: c.file,
      checksumSha256: c.checksumSha256,
      currentAuthor: c.currentAuthor,
      targetAuthor: null,
      source: "already-resolved-no-op",
      reason: "already resolved by the authorship pass; no change requested",
    };
  });
}

/** The subset of a plan that actually changes something. Everything else in
    the plan is context, printed but never written. */
export function stagedChanges(plan: readonly PlannedAction[]): PlannedAction[] {
  return plan.filter((p) => p.targetAuthor !== null);
}
