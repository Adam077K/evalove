/**
 * Screenshot harness for the leaf-shape probe.
 *
 *   node docs/08-agents_work/probes/serve-leaf-probe.mjs &
 *   node docs/08-agents_work/probes/shoot-leaf-probe.mjs
 *
 * Four panels:
 *   before    — portrait in the 266×196 landscape mount (PROBE-7 regression)
 *   after     — portrait in the flex mount (sentence floor intact)
 *   landscape — landscape photo in the flex mount
 *   extreme   — narrow portrait (460:1000) in the flex mount
 *
 * Shots are written to docs/08-agents_work/probes/shots/leaf-shape-*.png.
 * Each at 393×852 px, 3× device scale factor (1179×2556 file).
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve as presolve } from "node:path";
import { mkdirSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const req = createRequire(presolve(HERE, "../../../apps/web/package.json"));
const { chromium } = req("@playwright/test");

const OUT = presolve(HERE, "shots");
mkdirSync(OUT, { recursive: true });

const BASE = "http://127.0.0.1:4601/leaf-shape-probe.html";

const PANELS = [
  ["before",    "leaf-shape-BEFORE-portrait-in-landscape-mount.png"],
  ["after",     "leaf-shape-AFTER-portrait-in-flex-mount.png"],
  ["landscape", "leaf-shape-AFTER-landscape-in-flex-mount.png"],
  ["extreme",   "leaf-shape-AFTER-extreme-portrait-in-flex-mount.png"],
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
const LIE = process.argv.includes("--lie");

for (const [p, file] of PANELS) {
  await page.goto(`${BASE}?p=${p}${LIE ? "&lie=1" : ""}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__READY === true, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const bad = await page.evaluate(() => window.__BAD);
  const count = await page.evaluate(() => window.__COUNT);
  const shaped = await page.evaluate(() => window.__SHAPED);

  const blank = await page.$$eval("img", (els) =>
    els.filter((e) => e.naturalWidth === 0).map((e) => e.getAttribute("src")),
  );

  if (bad.length || blank.length) {
    failed = true;
    console.log(`  !! ${p}: page said ${JSON.stringify(bad)}`);
    console.log(`     harness blank ${JSON.stringify(blank)}`);
  }
  if (shaped === 0) {
    console.log(`  !! ${p}: no photograph declared a shape — shape test did not run`);
  }

  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(`${p.padEnd(10)} -> ${file}  imgs=${count} shape-checked=${shaped}`);
}

await browser.close();
console.log(failed ? "\nBROKEN IMAGES — do not judge these shots" : "\nall images loaded");
