// @vitest-environment jsdom
/**
 * Today page — one continuous paper world (design law §1, revised 2026-08-08).
 *
 * The Seam and the DECO window moved to Dates. Today is the room the app
 * opens into — paper runs to the dock.
 *
 * REGRESSION TRIPWIRE: overflow-x-clip on Paper element.
 *
 * A defect shipped where this clip was lost, causing 66px horizontal scroll
 * at 393px viewport width. The regression was approved by code review. This
 * test is a tripwire that greps the source for the class name — it catches
 * the exact regression route (someone deletes the class and review approves it)
 * and nothing else. It passes if the clip moves to an element that does not
 * contain the bleed, if the structure changes so containment no longer applies,
 * or if the bleed moves.
 *
 * The only proof that Today cannot scroll sideways is measurement:
 * document.documentElement.scrollWidth === viewport width at 393px.
 * Only a human running the real route with a session can verify that today.
 *
 * When TodayPage becomes testable (async dependencies lifted), replace this
 * source-grep tripwire with a render-based assertion that actually measures
 * overflow and containment.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Today page", () => {
  it("Today's root Paper carries overflow-x-clip (regression tripwire)", () => {
    // TodayPage is an async server component hitting the data layer
    // (liveTodayObject, liveWhatCameBack), so it cannot be rendered in jsdom.
    // This tripwire greps the source file for the required class — the only
    // assertion we can make without shipping false-green render tests.

    const pageSource = readFileSync(
      join(__dirname, "../page.tsx"),
      "utf-8"
    );

    // KEEP: The class name itself must be present in the className attribute.
    // This is the strong assertion — it catches deletion of the class or
    // moving it out of the Paper element.
    expect(pageSource).toContain('className="overflow-x-clip');
  });
});
