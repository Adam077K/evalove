import { test, expect } from "@playwright/test";

/**
 * The dock is fixed and the pages scroll underneath it. Two things must
 * be true, and they are true for different reasons.
 *
 *   REST   At a resting scroll position — the end of a page that scrolls,
 *          or anywhere on a page that does not — no text may sit under
 *          the dock. If it is under there at rest, it is under there for
 *          good: there is no scroll left to recover it.
 *
 *   FOCUS  Whatever the browser scrolls to, it must not park under the
 *          dock. This is the assertion the previous fix could not make.
 *          A `padding-bottom` on the column is document geometry: it
 *          lengthens the page, buying clearance at exactly one scroll
 *          offset. The browser's own scrolls — focus, `scrollIntoView`,
 *          hash targets, Safari lifting an input above the keyboard —
 *          align to the *scrollport*, whose bottom edge is the viewport's
 *          bottom edge, under the glass. Only `scroll-padding-bottom` on
 *          the scroll container moves that edge.
 *
 * What is deliberately NOT asserted: text passing under the dock while
 * the page is mid-scroll. The dock is glass and content showing through
 * it is the design. That is only acceptable because REST guarantees the
 * content can always be scrolled clear again.
 *
 * Measurement is on text nodes via Range rects, not element boxes: a
 * card's box may legitimately extend under the dock (its padding is what
 * the reserve is made of) while every glyph in it stays clear.
 */

const ROUTES = ["/today", "/book", "/dates", "/send", "/echo", "/pocket"] as const;

type Hit = { text: string; top: number; bottom: number };

/**
 * Runs in the page. Returns every visible text node whose rendered rect
 * intersects the dock pill, plus enough geometry to tell a page that
 * scrolls from one that does not.
 */
function measure(scopeToActiveElement: boolean) {
  const nav = document.querySelector('nav[aria-label="Main"]');
  if (!nav || !nav.firstElementChild) throw new Error("dock not found");
  const dock = nav.firstElementChild.getBoundingClientRect();

  const root = scopeToActiveElement
    ? ((document.activeElement as Element | null) ?? document.body)
    : document.body;

  const hits: Hit[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const value = node.nodeValue;
    if (!value || !value.trim()) continue;
    if (nav.contains(node)) continue;

    const el = node.parentElement;
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;

    // sr-only text is clipped to a 1px box and never painted.
    const box = el.getBoundingClientRect();
    if (box.width <= 1 && box.height <= 1) continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) {
      if (!r.width || !r.height) continue;
      const overlapY = Math.min(r.bottom, dock.bottom) - Math.max(r.top, dock.top);
      const overlapX = Math.min(r.right, dock.right) - Math.max(r.left, dock.left);
      if (overlapY > 0.5 && overlapX > 0.5) {
        hits.push({ text: value.trim().slice(0, 60), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) });
        break;
      }
    }
  }

  const se = document.scrollingElement!;
  return {
    hits,
    dockTop: +dock.top.toFixed(1),
    scrollHeight: se.scrollHeight,
    clientHeight: se.clientHeight,
    overflows: se.scrollHeight > se.clientHeight + 1,
  };
}

const describeHits = (hits: Hit[]) =>
  hits.map((h) => `  "${h.text}" @ y ${h.top}–${h.bottom}`).join("\n");

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

for (const route of ROUTES) {
  test.describe(route, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator('nav[aria-label="Main"]')).toBeVisible();
    });

    test("REST — no text under the dock at the resting scroll position", async ({ page }) => {
      await page.evaluate(() => document.scrollingElement!.scrollTo(0, 1e6));
      await page.waitForTimeout(150);

      const r = await page.evaluate(measure, false);
      const state = r.overflows
        ? `scrolled to the end (${r.scrollHeight}px of content in ${r.clientHeight}px)`
        : `content shorter than the viewport (${r.scrollHeight}px in ${r.clientHeight}px, nothing to scroll)`;

      expect(
        r.hits,
        `${route} — ${state}: ${r.hits.length} text node(s) under the dock (dock top ${r.dockTop})\n${describeHits(r.hits)}`,
      ).toEqual([]);
    });

    test("FOCUS — the browser never parks a focused element under the dock", async ({ page }) => {
      const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, FOCUSABLE);
      expect(count, `${route} has no focusable elements to walk`).toBeGreaterThan(0);

      const parked: string[] = [];

      for (let i = 0; i < count; i++) {
        const result = await page.evaluate(
          ([sel, idx]) => {
            const el = document.querySelectorAll(sel as string)[idx as number] as HTMLElement | undefined;
            const nav = document.querySelector('nav[aria-label="Main"]')!;
            if (!el || nav.contains(el)) return null;
            // No preventScroll: we want exactly the scroll the browser
            // chooses on focus, which is the behaviour under test.
            el.focus();
            return { label: (el.getAttribute("aria-label") || el.textContent || "?").trim().slice(0, 50) };
          },
          [FOCUSABLE, i] as const,
        );
        if (!result) continue;

        await page.waitForTimeout(30);
        const r = await page.evaluate(measure, true);
        const boxUnderDock = await page.evaluate(() => {
          const el = document.activeElement;
          const nav = document.querySelector('nav[aria-label="Main"]')!;
          if (!el || el === document.body) return false;
          const a = el.getBoundingClientRect();
          const d = nav.firstElementChild!.getBoundingClientRect();
          return (
            Math.min(a.bottom, d.bottom) - Math.max(a.top, d.top) > 0.5 &&
            Math.min(a.right, d.right) - Math.max(a.left, d.left) > 0.5
          );
        });

        if (r.hits.length || boxUnderDock) {
          parked.push(
            `focusing "${result.label}" left it under the dock (dock top ${r.dockTop})` +
              (r.hits.length ? `\n${describeHits(r.hits)}` : ""),
          );
        }
      }

      expect(parked, `${route} — ${parked.length} of ${count} focusables parked under the dock:\n${parked.join("\n")}`).toEqual([]);
    });
  });
}
