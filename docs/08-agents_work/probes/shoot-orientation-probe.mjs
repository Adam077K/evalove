// Playwright lives in apps/web, this script lives in docs/. ESM resolves from
// the importing file, so resolve it explicitly and the script runs from anywhere.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve as presolve } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));
const req = createRequire(presolve(HERE, "../../../apps/web/package.json"));
const { chromium } = req("@playwright/test");

const OUT = "/Users/adamks/VibeCoding/evalove/.worktrees/board-probe/docs/08-agents_work/probes/shots";
const BASE = "http://127.0.0.1:4599/design-probe-orient.html";

const PANELS = [
  ["asbuilt", "PROBE-0-table-as-approved.png"],
  ["tableB", "PROBE-1-table-landscape-height-auto.png"],
  ["tableA", "PROBE-2-table-crop-to-portrait-well.png"],
  ["tableD", "PROBE-3-table-the-plate.png"],
  ["day31", "PROBE-4-31-july-all-landscape.png"],
  ["deck", "PROBE-5-deck-landscape-cropped.png"],
  ["deckfit", "PROBE-6-deck-landscape-native.png"],
  ["book", "PROBE-7-book-portrait-in-landscape-mount.png"],
  ["bookfit", "PROBE-8-book-mount-takes-photograph.png"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

let failed = false;
for (const [p, file] of PANELS) {
  await page.goto(`${BASE}?p=${p}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__READY === true, null, { timeout: 15000 });
  // Fonts settle, GSAP-free so no motion to wait on.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const bad = await page.evaluate(() => window.__BAD);
  const count = await page.evaluate(() => window.__COUNT);
  const shaped = await page.evaluate(() => window.__SHAPED);
  // Second, independent check, run from the harness rather than the page, so
  // a bug in the page's own detector cannot pass this silently. It repeats
  // both tests: nothing blank, and nothing whose declared shape is not the
  // shape the browser painted.
  const measured = await page.$$eval("img[data-shape]", (els) =>
    els.map((e) => ({
      src: e.getAttribute("src"),
      want: e.getAttribute("data-shape"),
      got: e.naturalWidth > e.naturalHeight ? "land" : "port",
      nw: e.naturalWidth,
      nh: e.naturalHeight,
    })),
  );
  const blank = await page.$$eval("img", (els) =>
    els.filter((e) => e.naturalWidth === 0).map((e) => e.getAttribute("src")),
  );
  const mismatched = measured.filter((m) => m.nw === 0 || m.want !== m.got);
  if (bad.length || blank.length || mismatched.length) {
    failed = true;
    console.log(`  !! ${p}: page said ${JSON.stringify(bad)}`);
    console.log(`     harness blank ${JSON.stringify(blank)} mismatched ${JSON.stringify(mismatched)}`);
  }
  // A panel that declares no shapes has not been checked by the shape test.
  // Say so rather than let a silent zero read as a pass.
  if (shaped === 0) console.log(`  !! ${p}: no photograph declared a shape - shape test did not run`);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(`${p.padEnd(9)} -> ${file}  imgs=${count} shape-checked=${shaped} blank=${blank.length}`);
}

await browser.close();
console.log(failed ? "\nBROKEN IMAGES PRESENT — do not judge these shots" : "\nall images loaded");
