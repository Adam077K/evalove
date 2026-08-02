import { defineConfig, devices } from "@playwright/test";

/**
 * Layout regressions are geometry, and geometry has to be measured on a
 * real engine — a screenshot only proves what one person looked at once.
 * These run against `next dev` on a port of their own so they never
 * collide with a server the founder already has open.
 *
 * The four sizes are not arbitrary. 390x844 is the iPhone the app is
 * designed for; 390x1164 is the same width with the content shorter than
 * the screen, which is the case a bottom reservation cannot cover on its
 * own; 430x932 is the largest phone with a home indicator; 1280x900 is
 * the desktop column, where the dock is narrower than the content and
 * overlaps it only in the middle.
 *
 * `vitest.config.ts` excludes `e2e/**` — these do not run under `vitest`.
 */
const PORT = 4319;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Entrance animations translate cards for ~400ms. Measuring geometry
    // mid-cascade measures the animation, not the layout.
    reducedMotion: "reduce",
  },
  projects: [
    { name: "390x844", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "390x1164", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 1164 } } },
    { name: "430x932", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 } } },
    { name: "1280x900", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/home`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
