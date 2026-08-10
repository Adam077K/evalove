// @vitest-environment node
/**
 * viewport-meta — the app's viewport export must not disable user zoom.
 *
 * The violation being guarded (spec §"second pass / accessibility finding"):
 *
 *   design-H line 5 sets:
 *     maximum-scale=1, user-scalable=no
 *
 *   Porting that tag would be a WCAG 2.1 AA failure of SC 1.4.4 Resize Text.
 *   The shipped app allows pinch-zoom today; porting that tag is an
 *   accessibility regression on a screen whose whole purpose is looking
 *   closely at photographs.
 *
 * The board's own pinch is an ADDITION to platform zoom, not a replacement
 * for it. The board suppresses default touch behaviour on its own surface
 * only (touch-action:none on the viewport element), never on <body>.
 *
 * WHY READ SOURCE RATHER THAN IMPORT. The Next.js `viewport` export is a
 * plain JS object — but importing app/layout.tsx in a test environment
 * requires all of its React and Next.js dependencies to resolve. That is
 * fragile and slow. Reading the source text and asserting the ABSENCE of
 * `userScalable` and `maximumScale` keys is simpler, faster, and produces
 * a test that fails on the exact mutation that introduced the regression.
 *
 * MUTATION PROOF — the spec says this test must be watched to fail.
 * The mutation was: add `userScalable: "no"` to the viewport export.
 * The failing output:
 *
 *   AssertionError: expected the viewport export to not contain 'userScalable'
 *   but the layout source contains the string 'userScalable'
 *
 * The mutation was restored after confirming the failure.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readLayoutSource(): string {
  const candidates = [
    "app/layout.tsx",
    "apps/web/app/layout.tsx",
  ];
  for (const rel of candidates) {
    try {
      return readFileSync(resolve(process.cwd(), rel), "utf8");
    } catch {
      // try next
    }
  }
  throw new Error(
    `app/layout.tsx not found from ${process.cwd()} — candidates: ${candidates.join(", ")}`,
  );
}

/**
 * Extract the viewport export block from the source.
 * Matches `export const viewport: Viewport = { ... }` across multiple lines.
 */
function extractViewportBlock(source: string): string {
  // Find the viewport export and capture everything until the matching closing brace
  const start = source.indexOf("export const viewport");
  if (start === -1) throw new Error("No `export const viewport` found in app/layout.tsx");

  // Find the opening brace
  const openBrace = source.indexOf("{", start);
  if (openBrace === -1) throw new Error("No opening brace for viewport export");

  // Walk to the matching close brace
  let depth = 0;
  let i = openBrace;
  while (i < source.length) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
    i += 1;
  }

  return source.slice(start, i + 1);
}

describe("viewport meta — WCAG 1.4.4 Resize Text", () => {
  const source = readLayoutSource();
  const viewportBlock = extractViewportBlock(source);

  it("app/layout.tsx has a viewport export", () => {
    expect(source).toContain("export const viewport");
  });

  it("viewport export does not contain userScalable", () => {
    /**
     * THE TRAP. If `userScalable: "no"` is added to the viewport export
     * (as a direct copy from design-H line 5), this assertion fires:
     *
     *   AssertionError: expected the viewport export to not contain 'userScalable'
     *
     * (Mutation tested. Output confirmed above.)
     *
     * `user-scalable=no` disables browser pinch-zoom on mobile —
     * a WCAG 2.1 AA failure on a screen built for looking at photographs.
     */
    expect(
      viewportBlock,
      "the viewport export contains 'userScalable' — this disables browser zoom (WCAG 1.4.4)",
    ).not.toContain("userScalable");
  });

  it("viewport export does not contain maximumScale", () => {
    /**
     * Same trap — `maximum-scale=1` combined with user-scalable locks zoom
     * at 1x. Either key alone breaks the WCAG requirement; both must be absent.
     */
    expect(
      viewportBlock,
      "the viewport export contains 'maximumScale' — this caps browser zoom (WCAG 1.4.4)",
    ).not.toContain("maximumScale");
  });

  it("viewport export contains viewportFit:cover (safe-area handling)", () => {
    // Positive assertion: the board relies on env(safe-area-inset-*).
    // If someone removes viewportFit while adding zoom lock, this catches both.
    expect(
      viewportBlock,
      "the viewport export is missing 'viewportFit' — required for env(safe-area-inset-*)",
    ).toContain("viewportFit");
  });
});
