/**
 * Tests for the Book's proportion invariant — proportion spec §5.2:
 * "render leafCount 0, 6, 1095 — board offsetWidth/offsetHeight must
 * be 0.768 ± 0.005 in all three. This is the gate the current build
 * fails."
 *
 * vitest here runs with `environment: "node"` (see vitest.config.ts) —
 * there is no jsdom in this project, and jsdom does not compute real
 * layout even where it is installed elsewhere (offsetWidth/Height are
 * always 0 without a layout engine). That gate can only be run for
 * real in a browser — which is why the CEO ruled browser verification
 * a trunk-level, not per-branch, step (DECISIONS 313fdc0).
 *
 * What IS a pure, dependency-free test in this environment:
 * server-rendering the actual component with `react-dom/server` (pure
 * Node, no DOM needed) and reading the width/height it emits as
 * inline style. This exercises the real component function with
 * varying `leafCount` — the same class of regression the bug was
 * (board width computed as a flex remainder of the fore-edge) — and
 * would fail exactly the way the old build did if BOARD_WIDTH_PX or
 * BOARD_HEIGHT_PX ever again became a function of `leafCount` or of a
 * sibling element's size.
 */

import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { BOARD_HEIGHT_PX, BOARD_RATIO, BOARD_WIDTH_PX, BookCover, foreEdgePx } from "../BookCover";

/** Pulls the board's rendered width/height (CSS px) out of the
    server-rendered markup. CoverBoard is the only element in
    BookCover's tree whose inline style carries both `width` and
    `height` together — ForeEdge only ever sets `width`, and the
    ribbon's width/height are HTML attributes, not style. */
function renderedBoardSize(leafCount: number): { width: number; height: number } {
  const html = renderToStaticMarkup(
    createElement(BookCover, { leafCount, begun: "2026-08-02" }),
  );
  const match = html.match(/style="[^"]*width:(\d+(?:\.\d+)?)px[^"]*height:(\d+(?:\.\d+)?)px/);
  if (!match) {
    throw new Error("BookCover's board did not render an explicit width+height style");
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

describe("board geometry — the invariant the bug broke", () => {
  it("BOARD_WIDTH_PX × BOARD_HEIGHT_PX is Crown Quarto, 189:246 ≈ 0.7683", () => {
    expect(BOARD_WIDTH_PX).toBe(280);
    expect(BOARD_RATIO).toBeCloseTo(0.7683, 4);
    expect(BOARD_WIDTH_PX / BOARD_HEIGHT_PX).toBeCloseTo(0.768, 3);
  });

  it.each([0, 6, 1095])(
    "renders the board at the fixed size regardless of leafCount (%i leaves)",
    (leafCount) => {
      const { width, height } = renderedBoardSize(leafCount);
      expect(width).toBe(BOARD_WIDTH_PX);
      expect(height).toBe(BOARD_HEIGHT_PX);
    },
  );

  it("board ratio stays within 0.768 ± 0.005 at leafCount 0, 6, and 1095", () => {
    for (const leafCount of [0, 6, 1095]) {
      const { width, height } = renderedBoardSize(leafCount);
      expect(width / height).toBeGreaterThanOrEqual(0.768 - 0.005);
      expect(width / height).toBeLessThanOrEqual(0.768 + 0.005);
    }
  });

  it("the fore-edge growing does not change the board's own dimensions", () => {
    // A thin book (day one) and a very thick one (1095 leaves, well
    // past the fore-edge ceiling) must render an IDENTICAL board —
    // this is the exact regression: board = 406 - foreEdge.
    const thin = renderedBoardSize(0);
    const thick = renderedBoardSize(1095);
    expect(thin).toEqual(thick);
  });
});

describe("foreEdgePx — the fore-edge curve", () => {
  it("floors at 12px on day one (no leaves)", () => {
    expect(foreEdgePx(0)).toBe(12);
  });

  it("is 26px at 6 leaves (today's archive, per the proportion spec)", () => {
    expect(foreEdgePx(6)).toBe(26);
  });

  it("reaches the 60px ceiling by 1095 leaves and does not exceed it", () => {
    expect(foreEdgePx(1095)).toBe(60);
  });

  it("never exceeds the 60px ceiling, arbitrarily far out", () => {
    expect(foreEdgePx(10_000)).toBe(60);
    expect(foreEdgePx(1_000_000)).toBe(60);
  });

  it("is monotonically non-decreasing", () => {
    const samples = [0, 1, 6, 30, 100, 365, 949, 1095, 5000];
    const widths = samples.map(foreEdgePx);
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]!).toBeGreaterThanOrEqual(widths[i - 1]!);
    }
  });
});
