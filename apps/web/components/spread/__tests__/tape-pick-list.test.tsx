/**
 * Coverage test for the tape pick list — Wave 5 (floral washi).
 *
 * Guards the exact failure mode the brief named: a variant added to
 * `SPREAD_TAPE_VARIANTS` (the list `seededPick` draws from in
 * `PairComposition`) with no matching `TAPE_ASSETS` entry renders no
 * strip at all, silently — `Taped.tsx` is `{asset && <img .../>}`, no
 * asset means no error, just a photograph with no tape on it. Renders
 * the real `<Taped>` component with `react-dom/server` (the same
 * pure-Node technique `board-geometry.test.ts` uses; there is no
 * jsdom in this project) and asserts an `<img>` is actually present
 * for every variant Spread.tsx can pick — a registry gap fails this
 * test instead of failing silently on a rendered page.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Taped } from "@/components/materials";

import { SPREAD_TAPE_VARIANTS } from "../Spread";

describe("SPREAD_TAPE_VARIANTS — every entry resolves to a registered asset", () => {
  it.each(SPREAD_TAPE_VARIANTS)("%s renders a strip, not a silent no-op", (variant) => {
    const html = renderToStaticMarkup(
      <Taped variant={variant} placement="top">
        <div>child</div>
      </Taped>,
    );
    expect(html).toContain("<img");
  });

  it("is the intentional Wave 5 four-variant set, not an accidental change", () => {
    expect(SPREAD_TAPE_VARIANTS).toEqual([
      "washi-ochre-dots",
      "washi-terracotta",
      "floral-pressed",
      "floral-blue",
    ]);
  });
});
