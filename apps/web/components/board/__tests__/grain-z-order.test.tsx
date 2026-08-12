// @vitest-environment jsdom
/**
 * grain-z-order — grain paints below every object.
 *
 * The design law (spec §0.3, §T1 constraint 5):
 *   ".grain is z-index:2 with mix-blend-mode:overlay; objects are
 *    z-index:10+, so grain paints UNDER every photograph. Move it
 *    above one and it becomes an illegal photo treatment that is
 *    invisible in a diff."
 *
 * This file asserts that contract by reading the CSS class name from
 * board.css and comparing the z-index values declared in it.
 *
 * MUTATION PROOF — the spec says: "Write a test that asserts the grain
 * paints below the lowest object's, then mutate the z-index, watch the
 * test fail, restore, and paste the failing output."
 *
 * The mutation was: change .board-grain { z-index: 2 } to z-index: 99.
 * The failing output:
 *
 *   AssertionError: expected 99 to be less than 10
 *
 * The test was restored after confirming the failure.
 *
 * WHY READ CSS RATHER THAN RENDER. jsdom does not cascade stylesheets
 * from imported CSS files (CSS modules / PostCSS are not processed).
 * Reading the source text and parsing the z-index values is the only
 * reliable method that produces a genuine failing test — a DOM query
 * for `getComputedStyle` would always return "" in jsdom without real
 * stylesheet injection.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/** Read board.css from the correct path relative to cwd (repo root or apps/web). */
function readBoardCss(): string {
  const candidates = [
    "components/board/board.css",
    "apps/web/components/board/board.css",
  ];
  for (const rel of candidates) {
    try {
      return readFileSync(resolve(process.cwd(), rel), "utf8");
    } catch {
      // try next
    }
  }
  throw new Error(
    `board.css not found from ${process.cwd()} — candidates: ${candidates.join(", ")}`,
  );
}

/**
 * Extract the z-index value from a named CSS class block.
 * Returns null when the class or property is absent.
 * Strip comments before matching to avoid false positives.
 */
function zIndexOf(css: string, className: string): number | null {
  // Strip block comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // Match the class block (handles multiple selectors and nested content)
  const classRe = new RegExp(
    `\\.${className}\\s*\\{([^}]*)\\}`,
    "m",
  );
  const block = classRe.exec(stripped)?.[1];
  if (!block) return null;
  const match = /z-index\s*:\s*(\d+)/.exec(block);
  return match ? parseInt(match[1]!, 10) : null;
}

describe("board z-index contract", () => {
  const CSS = readBoardCss();

  it("reads a non-null z-index for .board-grain (the instrument is live)", () => {
    const z = zIndexOf(CSS, "board-grain");
    expect(
      z,
      ".board-grain must declare an explicit z-index — the contract cannot be enforced without it",
    ).not.toBeNull();
  });

  it("reads a non-null z-index for .board-obj (the instrument is live)", () => {
    const z = zIndexOf(CSS, "board-obj");
    expect(
      z,
      ".board-obj must declare an explicit z-index — the contract cannot be enforced without it",
    ).not.toBeNull();
  });

  it("grain z-index is below the lowest object z-index", () => {
    const grainZ = zIndexOf(CSS, "board-grain");
    const objZ = zIndexOf(CSS, "board-obj");

    // Both values are asserted non-null above; the type-narrowing cast is safe.
    expect(grainZ).not.toBeNull();
    expect(objZ).not.toBeNull();

    /**
     * THE TRAP. If .board-grain's z-index is raised above .board-obj, this
     * assertion fires:
     *
     *   AssertionError: expected 99 to be less than 10
     *
     * (Mutation tested with z-index:99 on .board-grain. Output confirmed.)
     *
     * A reviewer who searches for "mix-blend-mode" in a diff will not see
     * this failure — it only manifests in a running browser where the grain
     * composites over the photographs. This test is the diff's blind spot.
     */
    expect(grainZ!).toBeLessThan(objZ!);
  });

  it("grain z-index is specifically 2 and object z-index is specifically 10", () => {
    // Exact values, not just relative order — a z-index:5 grain above z-index:4
    // objects would pass the previous test and still be wrong.
    expect(zIndexOf(CSS, "board-grain")).toBe(2);
    expect(zIndexOf(CSS, "board-obj")).toBe(10);
  });
});
