/**
 * Measure masthead line count and glyph width at the required viewport widths.
 * Uses the `page` fixture so the session cookie from the storageState is
 * automatically applied. Viewport is resized per iteration.
 *
 * Verifies that the edge-to-edge masthead on /book is one line at every
 * mobile width the app supports. Delete after verification pass.
 */
import { test, expect } from "@playwright/test";

const WIDTHS = [320, 360, 375, 390, 393, 412, 430] as const;

test("masthead is one line at 320–430px", async ({ page }) => {
  const results: { width: number; fontSize: number; glyph: number; measure: number; lines: number }[] = [];

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 852 });
    await page.goto("/book", { waitUntil: "networkidle" });

    const data = await page.evaluate(() => {
      const h1 = document.querySelector("h1.type-masthead") as HTMLElement | null;
      if (!h1) return null;
      const cs = getComputedStyle(h1);
      const fontSize = parseFloat(cs.fontSize);
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.1;
      const elHeight = h1.getBoundingClientRect().height;
      const lines = Math.round(elHeight / lineHeight);

      // Range rects give actual painted glyph extent
      const range = document.createRange();
      range.selectNodeContents(h1);
      const rects = Array.from(range.getClientRects());
      const maxGlyph = rects.reduce((m, r) => Math.max(m, r.width), 0);

      const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const measure = window.innerWidth - 1.25 * remPx * 2;

      return {
        fontSize: +fontSize.toFixed(2),
        lineHeight: +lineHeight.toFixed(2),
        lines,
        maxGlyph: +maxGlyph.toFixed(1),
        measure: +measure.toFixed(1),
      };
    });

    expect(data, `h1.type-masthead not found at ${width}px`).not.toBeNull();

    console.log(
      `${width}px — font:${data!.fontSize} lineH:${data!.lineHeight} ` +
      `glyph:${data!.maxGlyph} measure:${data!.measure} lines:${data!.lines}`,
    );

    results.push({ width, ...data! });
  }

  // All widths must be one line
  for (const r of results) {
    expect(
      r.lines,
      `Masthead wraps at ${r.width}px: font=${r.fontSize} glyph=${r.maxGlyph} measure=${r.measure}`,
    ).toBe(1);
  }

  // At 393 the override must be active — font must be > 3.5rem (56px)
  const at393 = results.find(r => r.width === 393)!;
  expect(
    at393.fontSize,
    "At 393px the custom clamp override is not active (font is at default 15vw)",
  ).toBeGreaterThan(56);
});
