import { chromium } from "@playwright/test";

const OUT = "/Users/adamks/VibeCoding/evalove";
const BASE = "http://127.0.0.1:4599/design-probe-orient.html";

const PANELS = [
  ["a", "PROBE-1-crop-to-portrait.png"],
  ["b", "PROBE-2-object-takes-shape.png"],
  ["d", "PROBE-3-the-plate.png"],
  ["deck", "PROBE-4-deck-landscape-cropped.png"],
  ["deckfit", "PROBE-5-deck-landscape-native.png"],
  ["book", "PROBE-6-book-portrait-cropped.png"],
  ["bookfit", "PROBE-7-book-mount-fits.png"],
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
  // Second, independent check: measure every img from the harness side too,
  // so a bug in the page's own detector cannot pass this silently.
  const measured = await page.$$eval("img", (els) =>
    els.map((e) => ({ src: e.getAttribute("src"), nw: e.naturalWidth, rw: Math.round(e.getBoundingClientRect().width) })),
  );
  const broken = measured.filter((m) => m.nw === 0);
  if (bad.length || broken.length) {
    failed = true;
    console.log(`  !! ${p}: page reported ${JSON.stringify(bad)}, harness found ${JSON.stringify(broken)}`);
  }
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(`${p.padEnd(8)} -> ${file}  imgs=${count} broken=${broken.length}`);
}

await browser.close();
console.log(failed ? "\nBROKEN IMAGES PRESENT — do not judge these shots" : "\nall images loaded");
