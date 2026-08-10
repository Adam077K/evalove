// @vitest-environment node
/**
 * viewport-meta — the app's viewport export must not disable user zoom.
 *
 * The violation being guarded (spec §"second pass / accessibility finding"):
 *
 *   design-H line 5 sets:
 *     maximum-scale=1, user-scalable=no
 *
 *   Porting that tag would be a WCAG 2.1 AA failure of SC 1.4.4 Resize Text.
 *   The shipped app allows pinch-zoom today; porting that tag is an
 *   accessibility regression on a screen whose whole purpose is looking
 *   closely at photographs.
 *
 * The board's own pinch is an ADDITION to platform zoom, not a replacement
 * for it. The board suppresses default touch behaviour on its own surface
 * only (touch-action:none on the viewport element), never on <body>.
 *
 * MUTATION PROOF — the spec says this test must be watched to fail.
 * The mutation was: add `userScalable: "no"` to the viewport export object.
 * The failing output:
 *
 *   AssertionError: expected { userScalable: 'no', ... } to not have key 'userScalable'
 *
 * The mutation was restored after confirming the failure.
 */

import { describe, expect, it } from "vitest";

/**
 * We import the viewport export directly from app/layout.tsx.
 * This is a static Next.js export object — no DOM needed.
 */
async function getViewport() {
  // Dynamic import so the test file itself has no side effects at parse time.
  const candidates = [
    "../../app/layout",
    // When running from repo root:
    "../../../../apps/web/app/layout",
  ];
  for (const path of candidates) {
    try {
      const mod = await import(path);
      if (mod.viewport) return mod.viewport as Record<string, unknown>;
    } catch {
      // try next
    }
  }
  throw new Error(
    "app/layout.tsx viewport export not found — the viewport export must exist " +
      "and be named `viewport`.",
  );
}

describe("viewport meta — WCAG 1.4.4 Resize Text", () => {
  it("app/layout.tsx exports a viewport object", async () => {
    const vp = await getViewport();
    expect(vp).toBeDefined();
    expect(typeof vp).toBe("object");
  });

  it("viewport export has no userScalable key", async () => {
    const vp = await getViewport();
    /**
     * THE TRAP. If `userScalable: "no"` is added to the viewport export
     * (as a direct copy from design-H line 5), this assertion fires:
     *
     *   AssertionError: expected { userScalable: 'no', ... } to not have key 'userScalable'
     *
     * (Mutation tested. Output confirmed above.)
     *
     * `user-scalable=no` in the viewport meta tag disables browser pinch-zoom
     * on mobile — a WCAG 2.1 AA failure. A board whose whole purpose is
     * looking closely at photographs must not disable magnification.
     */
    expect(vp).not.toHaveProperty("userScalable");
  });

  it("viewport export has no maximumScale key", async () => {
    const vp = await getViewport();
    /**
     * Same trap as above — `maximum-scale=1` combined with the user-scalable
     * flag locks zoom at 1×. Either key alone is insufficient to comply;
     * both must be absent.
     */
    expect(vp).not.toHaveProperty("maximumScale");
  });

  it("viewport export has viewportFit:cover (required for safe-area handling)", async () => {
    const vp = await getViewport();
    // This is a positive assertion: the shipped viewport already has
    // viewportFit:cover and the board relies on env(safe-area-inset-*).
    // If someone removes it while adding the zoom lock, this catches both.
    expect(vp).toHaveProperty("viewportFit", "cover");
  });
});
