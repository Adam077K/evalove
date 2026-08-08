// @vitest-environment jsdom
/**
 * Today page — one continuous paper world (design law §1, revised 2026-08-08).
 *
 * The Seam and the DECO window moved to Dates. Today is the room the app
 * opens into — paper runs to the dock.
 *
 * REGRESSION GUARD: overflow-x-clip contains the photograph mount's
 * ml-12 -mr-12 bleed (TodayPair.tsx lines 217 and 307). A defect shipped
 * where this clip was lost, causing 66px horizontal scroll at 393px. The
 * commit that restored it: fix(ui): correct Seam order on Dates and Today
 * pb reservation. This test guards against silent re-addition of that defect.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Today page", () => {
  it("Today's root Paper carries overflow-x-clip for photograph bleed containment", () => {
    // TodayPage is an async server component that hits the data layer
    // (liveTodayObject, liveWhatCameBack), so it cannot be rendered in jsdom.
    // Instead, verify the source code contains the required constraint.
    // When TodayPage becomes testable (async lifted), this should be replaced
    // with a render-based assertion.

    const pageSource = readFileSync(
      join(__dirname, "../page.tsx"),
      "utf-8"
    );

    // Assert that the Paper component on this route carries overflow-x-clip.
    // The class must be present to contain the photograph mount's ml-12 -mr-12
    // bleed (TodayPair.tsx lines 217 and 307). Without it, the page scrolls
    // horizontally by ~66px at 393px viewport width.
    expect(pageSource).toContain('className="overflow-x-clip');

    // Assert the comment is still there explaining why (so a future refactor
    // does not accidentally remove the clip thinking it is dead code).
    expect(pageSource).toContain("overflow-x-clip");
    expect(pageSource).toContain("contains the photograph mount");
  });
});
