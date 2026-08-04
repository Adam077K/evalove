/**
 * The lock icon must be below the fold at scrollY=0 in every archive state.
 *
 * Background: with a 1200×900 photograph the lock row used to land inside
 * the dock band on first paint. The three-ways-in section now carries
 * margin-top: calc(3.5rem + var(--dock-footprint)) so the lock icon is
 * below the fold in every archive state.
 *
 * The worst-case photos are 1200×900 with one-line captions (seed-eva-2,
 * seed-adam-1) — the caption line-count matters because type-quote wraps
 * differently across the 11 archive items. The round that introduced the
 * 3.5rem base (replacing 2.5rem) was driven by these two photos placing
 * the icon top at y 844.7 — a 7.3px visible arc — before the fix.
 *
 * Verified at both worst-case fixtures before commit:
 *   seed-eva-2  (1200×900, "Roosevelt Island tram, the loud sunset")
 *               link top y 840.7, icon top y 860.7 ✓  (8.7px below fold)
 *   seed-adam-1 (1200×900, "Gordon beach before anyone")
 *               link top y 840.7, icon top y 860.7 ✓  (8.7px below fold)
 *
 * Measurement is done at 393×852 because the critic's geometry numbers
 * (dock top y 770, icon y 844.7 → 860.7) were taken at that size.
 */

import { test, expect } from "@playwright/test";

/**
 * Geometry captured at scrollY=0.
 * Reports both the link-box top and the icon top (link top + py-5 top
 * padding = +20px), because the concern is the icon arc the eye sees.
 */
function measureLockAndDock() {
  const nav = document.querySelector('nav[aria-label="Main"]');
  if (!nav || !nav.firstElementChild) throw new Error("dock pill not found");
  const pill = nav.firstElementChild.getBoundingClientRect();

  const pocket = document.querySelector('a[aria-label="The pocket"]');
  if (!pocket) throw new Error("pocket link not found");
  const link = pocket.getBoundingClientRect();

  // py-5 = 1.25rem top padding above the icon.
  const py5 = parseFloat(getComputedStyle(pocket).paddingTop);
  const iconTop = link.top + py5;

  // img.photo is the resurfaced photograph in ResurfacedItem.tsx.
  const img = document.querySelector("img.photo") as HTMLImageElement | null;

  return {
    linkTop: +link.top.toFixed(1),
    iconTop: +iconTop.toFixed(1),
    pillTop: +pill.top.toFixed(1),
    pillBottom: +pill.bottom.toFixed(1),
    viewportHeight: window.innerHeight,
    photoRenderedHeight: img ? +img.getBoundingClientRect().height.toFixed(1) : null,
  };
}

test("lock icon is below the fold at scrollY=0", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/book", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(80);

  const g = await page.evaluate(measureLockAndDock);

  console.log(
    `393×852 scrollY=0 — link top y ${g.linkTop}, icon top y ${g.iconTop}, ` +
      `dock pill y ${g.pillTop}–${g.pillBottom}, ` +
      `viewport ${g.viewportHeight}, photo height ${g.photoRenderedHeight ?? "none"}`,
  );

  // The icon must be entirely below the fold: icon top >= viewportHeight.
  // Below the fold means it cannot overlap the dock pill and cannot read
  // as a clipped signpost on first paint (§2.1).
  expect(
    g.iconTop,
    `Lock icon top (y ${g.iconTop}) is above the fold (${g.viewportHeight}px) at scrollY=0 — ` +
      `photo height: ${g.photoRenderedHeight ?? "none"}, dock pill: y ${g.pillTop}–${g.pillBottom}`,
  ).toBeGreaterThanOrEqual(g.viewportHeight);
});
