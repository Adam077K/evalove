/**
 * verdicts.ts — the authorship-pass's verdicts.tsv, mapped through a
 * founder-fixed identity mapping to eva / adam / unsigned.
 *
 * DECISION 1 — the identity mapping (verbatim, founder, 2026-08-07):
 *   Eva  = "person_b" — young woman, brown hair with lighter balayage,
 *          hazel/green eyes, often pink tops, rings and bracelets on both
 *          wrists.
 *   Adam = "person_a" — young man, dark curly/wavy hair, light hazel-green
 *          eyes, often a white polo with a small embroidered pony logo.
 *
 * DECISION 2 — unsigned, not guessed (verbatim, founder, 2026-08-07): "Let
 *   the Book hold them unsigned — treat these as shared, not authored; they
 *   belong to the day rather than to a person." This covers every
 *   `cannot_tell` row AND every `third_party` row (a passer-by took the
 *   photo) — 28 of the founder's first 51 real photographs.
 *
 * Both decisions are fixed inputs to this module, not something it
 * re-derives. If a later authorship pass ever renames or reorders its own
 * `shooter` labels, `parseVerdictsTsv` below refuses to guess at the new
 * label rather than silently mapping it wrong — see its own comment.
 */

import { readFileSync } from "node:fs";

/** What the authorship pass actually recorded, before the founder's mapping
    (DECISION 1) is applied. */
export type VerdictShooter = "person_a" | "person_b" | "cannot_tell" | "third_party";

export interface Verdict {
  file: string;
  shooter: VerdictShooter;
  /** Diagnostic only — carried through, never used to decide anything here. */
  confidence: string;
  /** Diagnostic only — carried through, never used to decide anything here. */
  evidence: string;
}

/**
 * The founder's fixed mapping (DECISION 1 and DECISION 2, both verbatim
 * above). This is a constant, not a computation, on purpose: it is a
 * statement of who two specific labels refer to, and there is no algorithm
 * that could re-derive it correctly.
 */
const SHOOTER_TO_AUTHOR: Record<VerdictShooter, "eva" | "adam" | "unsigned"> = {
  person_a: "adam",
  person_b: "eva",
  cannot_tell: "unsigned",
  third_party: "unsigned",
};

/** The founder's fixed mapping, applied to one verdict. */
export function authorFromVerdict(verdict: Verdict): "eva" | "adam" | "unsigned" {
  return SHOOTER_TO_AUTHOR[verdict.shooter];
}

/**
 * Parse a verdicts.tsv into a map keyed by filename.
 *
 * Columns (header row, tab-separated): `file`, `shooter`, `confidence`,
 * `evidence`. Throws on a `shooter` value this module does not recognise —
 * silently treating an unrecognised label as "no verdict" would leave a real
 * photograph unresolved with no visible reason, and silently guessing a
 * mapping for it would be exactly the kind of invented attribution this
 * whole feature exists to refuse.
 */
export function parseVerdictsTsv(content: string): Map<string, Verdict> {
  const byFile = new Map<string, Verdict>();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#")) continue;
    const cols = line.split("\t");
    const file = cols[0];
    if (!file || file === "file") continue; // header row

    const shooter = cols[1];
    if (
      shooter !== "person_a" &&
      shooter !== "person_b" &&
      shooter !== "cannot_tell" &&
      shooter !== "third_party"
    ) {
      throw new Error(
        `verdicts.tsv: row "${file}" has shooter "${String(shooter)}", which is not one of ` +
          "person_a / person_b / cannot_tell / third_party — the founder's mapping " +
          "(verdicts.ts, SHOOTER_TO_AUTHOR) does not cover it. Add it there deliberately " +
          "before this file can resolve this row; do not guess.",
      );
    }

    byFile.set(file, {
      file,
      shooter,
      confidence: cols[2] ?? "",
      evidence: cols[3] ?? "",
    });
  }
  return byFile;
}

/** Read and parse a verdicts.tsv from disk. Throws ENOENT if it is missing —
    callers that want a missing file to mean "no verdicts" should catch that
    themselves; see `load.ts`'s own handling. */
export function loadVerdicts(path: string): Map<string, Verdict> {
  return parseVerdictsTsv(readFileSync(path, "utf8"));
}
