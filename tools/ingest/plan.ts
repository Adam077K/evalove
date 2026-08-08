/**
 * plan.ts — resolving each manifest item to an author (or a skip), before
 * anything touches storage or the database.
 *
 * Deliberately dependency-light: this module imports only `manifest.ts` and
 * `verdicts.ts` — no `db.ts`, no `gateway.ts`, no `@supabase/supabase-js`, no
 * `commitPhoto`. That is what lets the test suite import it directly without
 * pulling in a Supabase client that needs `tools/` to have had its own `pnpm
 * install` run (see `db.ts`'s header) — the same reason `load.ts` itself was
 * never imported by a test before this file existed. Kept separate from
 * `load.ts` on purpose; `load.ts` imports `buildPlan`/`resolveAuthor` from
 * here rather than defining them inline.
 */

import type { AuthorshipCorrection, ManifestItem } from "./manifest.ts";
import { authorFromVerdict } from "./verdicts.ts";
import type { Verdict } from "./verdicts.ts";

/** What this loader ultimately resolves each eligible file to. `"unsigned"`
    is a real, deliberate outcome (migration 12) — not an unresolved state;
    an unresolved file never reaches "commit" at all (see `resolveAuthor`). */
export type ResolvedAuthor = "eva" | "adam" | "unsigned";

export type Plan =
  | {
      action: "commit";
      item: ManifestItem;
      author: ResolvedAuthor;
      /** Where the resolution came from — surfaced in the dry-run log so a
          reviewer can tell an automatic result from a hand override at a
          glance, without opening two files side by side. */
      source: "manual_override" | "verdicts_pass";
    }
  | { action: "skip"; item: ManifestItem; reason: string };

/**
 * Resolve one file's author. `authorship.tsv`'s `author_correction` — the
 * founder's manual override — wins whenever it is non-blank; otherwise the
 * authorship-pass verdict, mapped through the founder's fixed identity
 * mapping (`verdicts.ts`), decides. A file with neither returns `null` and
 * is skipped, same as an all-blank authorship.tsv always meant before this
 * change.
 */
export function resolveAuthor(
  file: string,
  authorship: Map<string, AuthorshipCorrection>,
  verdicts: Map<string, Verdict>,
): { author: ResolvedAuthor; source: "manual_override" | "verdicts_pass" } | null {
  const override = authorship.get(file)?.author;
  if (override !== undefined && override !== null) {
    return { author: override, source: "manual_override" };
  }
  const verdict = verdicts.get(file);
  if (verdict !== undefined) {
    return { author: authorFromVerdict(verdict), source: "verdicts_pass" };
  }
  return null;
}

export function buildPlan(
  items: ManifestItem[],
  authorship: Map<string, AuthorshipCorrection>,
  verdicts: Map<string, Verdict>,
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
    const resolved = resolveAuthor(item.file, authorship, verdicts);
    if (resolved === null) {
      return {
        action: "skip",
        item,
        reason: "no verdicts-pass row and no manual override for this file",
      };
    }
    return { action: "commit", item, author: resolved.author, source: resolved.source };
  });
}
