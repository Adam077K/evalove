// @vitest-environment node
/**
 * board-arrival — the board surface must open at exactly x:-40, y:0, scale:1.
 *
 * The design law (design-H:1548):
 *   gsap.set(srf, { x: -40, y: 0, scale: 1 })
 *
 * This is a COMPOSITION, not a computation. The arrival shows the torn scrap
 * (SUNDAY / NEW YORK / 3:41 PM), the cue "seven hours ahead, further down",
 * and today's two photographs. The founder approved this specific first view.
 *
 * The defect this test guards against (found 2026-08-10):
 *   The board opened at matrix(1,0,0,1,-209.288,-374.349) — 374px down the
 *   table. The composed first impression was scrolled past before the founder
 *   ever saw it. Root cause: gsap.set was called BEFORE Draggable.create;
 *   Draggable's applyBounds() runs during initialization and overrides any
 *   position set before creation. Fix: set arrival AFTER Draggable.create,
 *   then call panRef.current.update() to sync internal tracking.
 *
 * WHY READ SOURCE RATHER THAN RENDER. GSAP is async (dynamic import) and
 * requires a real browser to apply transforms. Mocking it fully enough to
 * verify the final element position requires more test infra than this
 * codebase currently has. Reading source text and asserting the EXACT VALUES
 * of the exported constants — plus verifying the gsap.set call uses those
 * constants rather than literals — traps any change to the arrival position
 * at the canonical source of truth.
 *
 * MUTATION PROOF — the spec says this test must be watched to fail.
 *
 * Mutation 1: change `BOARD_ARRIVAL_X = -40` to `BOARD_ARRIVAL_X = 0`.
 * The failing output:
 *
 *   AssertionError: expected 0 to be -40 // Object.is equality
 *   at board-arrival.test.ts — "BOARD_ARRIVAL_X is exactly -40 (design-H:1548)"
 *
 * Mutation 2: change `gsap.set(srf, { x: BOARD_ARRIVAL_X, ... })` so that
 * x is a literal `-40` not the named constant. The second test fails:
 *
 *   AssertionError: gsap.set call uses a literal instead of BOARD_ARRIVAL_X —
 *   the constant can be changed without updating the call site
 *
 * Both mutations were restored after confirming failure.
 *
 * ORDERING TRAP — the third test verifies that the gsap.set call appears
 * AFTER panRef.current is assigned. Moving it before Draggable.create
 * reproduces the original defect. That mutation's failure:
 *
 *   AssertionError: gsap.set(srf, {...BOARD_ARRIVAL...}) must appear after
 *   'panRef.current = panInstances[0]' — placing it before Draggable.create
 *   allows applyBounds() to override the arrival position
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BOARD_ARRIVAL_X,
  BOARD_ARRIVAL_Y,
  BOARD_ARRIVAL_SCALE,
} from "../usePanZoom";

/** Read usePanZoom.ts from the correct path relative to cwd. */
function readUsePanZoomSource(): string {
  const candidates = [
    "components/board/usePanZoom.ts",
    "apps/web/components/board/usePanZoom.ts",
  ];
  for (const rel of candidates) {
    try {
      return readFileSync(resolve(process.cwd(), rel), "utf8");
    } catch {
      // try next
    }
  }
  throw new Error(
    `usePanZoom.ts not found from ${process.cwd()} — candidates: ${candidates.join(", ")}`,
  );
}

describe("board arrival position — design-H:1548", () => {
  /**
   * THE PRIMARY TRAP. Asserts the exported constants have the exact values.
   * If someone changes BOARD_ARRIVAL_X to a centering calculation, they must
   * also change the constant — and this test fires immediately.
   *
   *   AssertionError: expected 0 to be -40 // Object.is equality
   */
  it("BOARD_ARRIVAL_X is exactly -40 (design-H:1548)", () => {
    expect(BOARD_ARRIVAL_X).toBe(-40);
  });

  it("BOARD_ARRIVAL_Y is exactly 0 (design-H:1548)", () => {
    expect(BOARD_ARRIVAL_Y).toBe(0);
  });

  it("BOARD_ARRIVAL_SCALE is exactly 1 (design-H:1548)", () => {
    expect(BOARD_ARRIVAL_SCALE).toBe(1);
  });

  /**
   * THE CALL-SITE TRAP. Verifies that the gsap.set call uses the named
   * constants, not inline literals. If someone replaces BOARD_ARRIVAL_X
   * with a literal or a calculation at the call site, this fires:
   *
   *   AssertionError: gsap.set call uses a literal instead of BOARD_ARRIVAL_X
   */
  it("gsap.set uses BOARD_ARRIVAL_X and BOARD_ARRIVAL_Y (not inline literals)", () => {
    const src = readUsePanZoomSource();

    // Strip block comments so the assertion only matches live code
    const stripped = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");

    expect(
      stripped,
      "gsap.set call uses a literal instead of BOARD_ARRIVAL_X — " +
        "the constant can be changed without updating the call site",
    ).toMatch(/gsap\.set\s*\(\s*srf\s*,\s*\{[^}]*x\s*:\s*BOARD_ARRIVAL_X/);

    expect(
      stripped,
      "gsap.set call uses a literal instead of BOARD_ARRIVAL_Y — " +
        "the constant can be changed without updating the call site",
    ).toMatch(/gsap\.set\s*\(\s*srf\s*,\s*\{[^}]*y\s*:\s*BOARD_ARRIVAL_Y/);
  });

  /**
   * THE ORDERING TRAP. Verifies that gsap.set with the arrival position appears
   * AFTER panRef.current is assigned. Placing it before Draggable.create allows
   * applyBounds() to override the position during Draggable initialization.
   *
   * This is the root cause of the original defect (2026-08-10).
   *
   *   AssertionError: gsap.set must appear after 'panRef.current = panInstances[0]'
   */
  it("gsap.set(arrival) appears after panRef.current assignment (ordering is load-bearing)", () => {
    const src = readUsePanZoomSource();

    // Strip line comments so we only match live code lines
    const stripped = src.replace(/\/\/.*/g, "");

    const panRefAssignIdx = stripped.indexOf("panRef.current = panInstances[0]");
    const gsapSetArrivalIdx = stripped.search(
      /gsap\.set\s*\(\s*srf\s*,\s*\{[^}]*BOARD_ARRIVAL_X/,
    );

    expect(
      panRefAssignIdx,
      "panRef.current = panInstances[0] not found in usePanZoom.ts — source parsing failed",
    ).toBeGreaterThan(-1);

    expect(
      gsapSetArrivalIdx,
      "gsap.set(srf, { x: BOARD_ARRIVAL_X, ... }) not found in usePanZoom.ts — " +
        "check that the call uses named constants",
    ).toBeGreaterThan(-1);

    expect(
      gsapSetArrivalIdx,
      "gsap.set(srf, {...BOARD_ARRIVAL...}) must appear AFTER 'panRef.current = panInstances[0]' " +
        "— placing it before Draggable.create allows applyBounds() to override the arrival position " +
        "(original defect: board arrived at matrix(1,0,0,1,-209.288,-374.349) instead of x:-40,y:0)",
    ).toBeGreaterThan(panRefAssignIdx);
  });
});
