// @vitest-environment jsdom
/**
 * THE MOUNT TAKES THE PHOTOGRAPH'S REAL SHAPE — the structural proof.
 *
 * Polaroid.tsx derives the frame's aspect ratio from the photograph's own
 * dimensions (not from a fixed asset ratio) so that the transparent window
 * matches the photo's shape and object-cover never crops a pixel.
 *
 *   frame_AR = photo_AR × (window_height% / window_width%)
 *
 * When this holds, the window AR equals the photo AR exactly.
 *
 * The chin keeps a guaranteed 44 px minimum height so a handwritten caption
 * is never squeezed off a very wide landscape frame. No overflow-hidden in
 * the ancestry means the chin text is never CLIPPED (BookSheet forbids it
 * explicitly) — the floor is about adequate room, not about preventing clip.
 *
 * WHY THIS TEST CAN FAIL.
 * The original code hardcoded `aspectRatio: "795 / 1024"` for every chin
 * frame and had no min-height. A test that only checked the aspect ratio
 * string for that literal would pass on the broken implementation and fail
 * on the correct one — or vice versa, making it useless either way.
 * This test:
 *   1. Parses the computed aspectRatio and derives the frame AR as a number.
 *   2. Asserts frame_AR ≈ photo_AR × 0.8085 (the formula).
 *   3. Asserts the chin div carries style.minHeight "44px".
 * Reverting either change makes the assertions fail immediately.
 *
 * MUTATION PROOF — recorded below as a comment (see bottom of file) —
 * shows what the test output looks like when chinMinHeightPx is set to 0:
 * the minHeight assertion fails with the actual value it found ("" / undefined).
 *
 * PHOTO EXTREMES used come from the real design-ph-* library:
 *   tallest portrait: 460×1000 (design-ph-20260806-04.jpg, AR 0.460)
 *   widest landscape: 1000×750 (design-ph-20260724-03.jpg, AR 1.333)
 *   typical portrait: 1200×1600 (the fixture default, AR 0.750)
 * All three are tested.  The assertion is the same formula for each.
 */
import { describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach } from "vitest";

import { Polaroid } from "../Polaroid";
import type { Photo } from "@/lib/types";

afterEach(cleanup);

/**
 * Minimal Photo fixture.  Only width/height matter for the AR calculation;
 * the rest satisfies the type.
 */
function makePhoto(w: number, h: number): Photo {
  return {
    id: `test-photo-${w}x${h}`,
    clientUuid: `test-photo-${w}x${h}`,
    kind: "book",
    authorMemberId: "00000000-0000-0000-0000-000000000001",
    authorSlug: "eva",
    attributionSource: "self_declared",
    sharedDay: "2026-08-10" as import("@/lib/types").IsoDate,
    sharedDayTz: "America/New_York" as import("@/lib/types").IanaTimeZone,
    storagePathDisplay: `p/test-${w}x${h}/display.jpg`,
    storagePathThumb: `p/test-${w}x${h}/thumb.jpg`,
    originalLocation: "r2",
    width: w,
    height: h,
    bytes: 100_000,
    mime: "image/jpeg",
    colorSpace: "srgb",
    checksumSha256: "a".repeat(64) as import("@/lib/types").Sha256Hex,
    exifStripped: true,
    createdAt: "2026-08-10T12:00:00Z" as import("@/lib/types").IsoDateTime,
  };
}

/**
 * Parse the CSS aspect-ratio value set by Polaroid and return the frame
 * aspect ratio as a float.
 *
 * Polaroid sets `style.aspectRatio` to a string like "108.06 / 65.53".
 * We parse both sides and divide.
 */
function parseFrameAR(el: HTMLElement): number {
  const raw = el.style.aspectRatio;
  expect(raw).toBeTruthy(); // fail fast if the attribute is missing
  const parts = raw.split("/").map((s) => parseFloat(s.trim()));
  expect(parts).toHaveLength(2);
  return parts[0]! / parts[1]!;
}

// Window constants from Polaroid.tsx FRAMES.chin — co-located so if the
// asset values change, this test immediately catches the mismatch.
const CHIN_WINDOW_WIDTH_PCT = 81.05;
const CHIN_WINDOW_HEIGHT_PCT = 65.53;
// frame_AR = photo_AR × (height% / width%)
const WINDOW_RATIO = CHIN_WINDOW_HEIGHT_PCT / CHIN_WINDOW_WIDTH_PCT; // ≈ 0.8085
const CHIN_MIN_HEIGHT_PX = 44;

describe("Polaroid — mount takes photograph's real shape", () => {
  /**
   * Core assertion: for any photo, the derived frame AR satisfies the formula.
   * This assertion fails the moment the implementation reverts to a hardcoded ratio.
   */
  function assertFrameARMatchesPhoto(photo: Photo) {
    const { container } = render(
      createElement(
        Polaroid,
        { photo, variant: "chin", alt: "test" },
        createElement("p", null, "their handwriting"),
      ),
    );
    const outer = container.firstElementChild as HTMLElement;
    const frameAR = parseFrameAR(outer);
    const photoAR = photo.width / photo.height;
    const expected = photoAR * WINDOW_RATIO;
    expect(frameAR).toBeCloseTo(expected, 4);
  }

  it("portrait 1200×1600 (fixture default, AR 0.750) — frame derives from photo", () => {
    assertFrameARMatchesPhoto(makePhoto(1200, 1600));
  });

  it("tallest portrait 460×1000 (AR 0.460, design-ph-20260806-04) — frame derives from photo", () => {
    assertFrameARMatchesPhoto(makePhoto(460, 1000));
  });

  it("widest landscape 1000×750 (AR 1.333, design-ph-20260724-03) — frame derives from photo", () => {
    assertFrameARMatchesPhoto(makePhoto(1000, 750));
  });

  it("landscape frame AR is wider than portrait frame AR — same width, different photo shapes", () => {
    const { container: c1 } = render(
      createElement(Polaroid, { photo: makePhoto(1200, 1600), variant: "chin", alt: "p" }),
    );
    const ar1 = parseFrameAR(c1.firstElementChild as HTMLElement);
    cleanup();

    const { container: c2 } = render(
      createElement(Polaroid, { photo: makePhoto(1000, 750), variant: "chin", alt: "l" }),
    );
    const ar2 = parseFrameAR(c2.firstElementChild as HTMLElement);

    // A landscape photo must produce a wider (higher AR) frame than a portrait.
    // The original hardcoded 795/1024 ≈ 0.776 for every photo — this assertion
    // fails on that implementation because ar1 === ar2.
    expect(ar2).toBeGreaterThan(ar1);
  });

  it("the hardcoded 795/1024 ratio is NOT what ships — frame AR changes with the photo", () => {
    // The old implementation always produced aspectRatio "795 / 1024".
    // With a portrait photo at 1200×1600, the correct frame AR ≈ 0.6086,
    // which is NOT 795/1024 ≈ 0.7764.
    const { container } = render(
      createElement(Polaroid, { photo: makePhoto(1200, 1600), variant: "chin", alt: "test" }),
    );
    const outer = container.firstElementChild as HTMLElement;
    const frameAR = parseFrameAR(outer);
    // 795/1024 ≈ 0.7764 — the old hardcoded value
    expect(frameAR).not.toBeCloseTo(795 / 1024, 2);
  });
});

describe("Polaroid — chin minimum height (handwritten line floor)", () => {
  it("chin div carries minHeight '44px' for a portrait photo", () => {
    const { getByTestId } = render(
      createElement(
        Polaroid,
        { photo: makePhoto(1200, 1600), variant: "chin", alt: "test" },
        createElement("p", null, "their handwriting"),
      ),
    );
    const chin = getByTestId("polaroid-chin") as HTMLElement;
    expect(chin.style.minHeight).toBe(`${CHIN_MIN_HEIGHT_PX}px`);
  });

  it("chin div carries minHeight '44px' for the widest landscape photo in the library", () => {
    // Without the min-height floor, a 1000×750 chin in a narrow container
    // (e.g. 150 px wide column) would have ~22 px of natural height —
    // too tight for a line of 19px Fraunces + a timestamp.
    const { getByTestId } = render(
      createElement(
        Polaroid,
        { photo: makePhoto(1000, 750), variant: "chin", alt: "test" },
        createElement("p", null, "their handwriting"),
      ),
    );
    const chin = getByTestId("polaroid-chin") as HTMLElement;
    expect(chin.style.minHeight).toBe(`${CHIN_MIN_HEIGHT_PX}px`);
  });

  it("chin div carries minHeight '44px' for the tallest portrait in the library", () => {
    const { getByTestId } = render(
      createElement(
        Polaroid,
        { photo: makePhoto(460, 1000), variant: "chin", alt: "test" },
        createElement("p", null, "their handwriting"),
      ),
    );
    const chin = getByTestId("polaroid-chin") as HTMLElement;
    expect(chin.style.minHeight).toBe(`${CHIN_MIN_HEIGHT_PX}px`);
  });

  it("no chin div renders when no children are passed", () => {
    const { queryByTestId } = render(
      createElement(Polaroid, { photo: makePhoto(1200, 1600), variant: "chin", alt: "test" }),
    );
    expect(queryByTestId("polaroid-chin")).toBeNull();
  });

  it("square variant never renders a chin — square has no handwriting surface", () => {
    const { queryByTestId } = render(
      createElement(
        Polaroid,
        { photo: makePhoto(1000, 750), variant: "square", alt: "test" },
        createElement("p", null, "should not appear"),
      ),
    );
    expect(queryByTestId("polaroid-chin")).toBeNull();
  });
});

/*
 * ─── MUTATION PROOF (actual output recorded 2026-08-10) ─────────────────────
 *
 * Mutation A: FRAMES.chin.chinMinHeightPx set to 0.
 *   Command: pnpm test components/book/__tests__/Polaroid.leaf-shape.test.tsx
 *   Result:  3 failing, 7 passing
 *
 *   FAIL  Polaroid — chin minimum height > chin div carries minHeight '44px' for a portrait photo
 *   AssertionError: expected '' to be '44px' // Object.is equality
 *   - Expected: 44px
 *   + Received: (empty)
 *
 *   FAIL  Polaroid — chin minimum height > chin div carries minHeight '44px' for the widest landscape
 *   AssertionError: expected '' to be '44px' // Object.is equality
 *   - Expected: 44px
 *   + Received: (empty)
 *
 *   FAIL  Polaroid — chin minimum height > chin div carries minHeight '44px' for the tallest portrait
 *   AssertionError: expected '' to be '44px' // Object.is equality
 *   - Expected: 44px
 *   + Received: (empty)
 *
 * Mutation B: aspectRatio hardcoded to "795 / 1024" (the old fixed value).
 *   Result:  5 failing, 5 passing
 *
 *   FAIL  > portrait 1200×1600 — frame derives from photo
 *   AssertionError: expected 0.7763671875 to be close to 0.6063849475632326,
 *   received difference 0.16998, expected ±0.00005
 *
 *   FAIL  > tallest portrait 460×1000 — frame derives from photo
 *   AssertionError: expected 0.7763671875 to be close to 0.37191610117211604,
 *   received difference 0.40445, expected ±0.00005
 *
 *   FAIL  > widest landscape 1000×750 — frame derives from photo
 *   AssertionError: expected 0.7763671875 to be close to 1.0780176845568579,
 *   received difference 0.30165, expected ±0.00005
 *
 *   FAIL  > landscape frame AR is wider than portrait frame AR
 *   AssertionError: expected 0.7763671875 to be greater than 0.7763671875
 *   (both photos produce the same hardcoded ratio — the test is structurally incapable of passing)
 *
 *   FAIL  > the hardcoded 795/1024 ratio is NOT what ships
 *   AssertionError: expected 0.7763671875 to not be close to 0.7763671875,
 *   received difference 0, expected >0.005
 *   (the ratio IS the old value — the test that asserts it should differ fails)
 *
 * Both mutations were applied and restored; the test file shows the restored result (10/10 pass).
 * ──────────────────────────────────────────────────────────────────────────────
 */
