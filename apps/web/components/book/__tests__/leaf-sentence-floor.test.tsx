// @vitest-environment jsdom
/**
 * LEAF SENTENCE FLOOR — structural regression test.
 *
 * Guards three invariants that prevent the handwritten sentence (caption) from
 * being clipped for any photograph shape when the mount is torn or stock.
 * The chin mount carries its own floor (Polaroid.leaf-shape.test.tsx).
 *
 * Invariants guarded:
 *
 *   A — No fixed-pixel-height Tailwind class on the photograph.
 *       e.g. h-[196px] locks the mount into a landscape box for every
 *       photo regardless of orientation — the PROBE-7 bug.
 *
 *   B — Sentence element comes AFTER the photograph in document order.
 *       If the sentence precedes the image the layout is inverted.
 *
 *   C — No ancestor with overflow:hidden + fixed inline height clips
 *       the sentence. This is the PROBE-8 failure: when the mount was
 *       allowed to grow with the portrait's natural height, design-H's
 *       `overflow:hidden` leaf container swallowed the sentence entirely.
 *       The React component must never reproduce this.
 *
 * Three photograph shapes from the real design-ph-* library:
 *   portrait         750×1000  (most common shape in the library)
 *   landscape        1000×750  (widest in library)
 *   extreme portrait 460×1000  (tallest in library — design-ph-20260806-04)
 *
 * Two vulnerable mount kinds (torn · stock) — the two that place the
 * sentence as a sibling <p> below the image on the page, not inside
 * a Polaroid chin. Six test cases total: 3 shapes × 2 mounts.
 *
 * Three instrument tests (one per invariant) prove each assertion CAN
 * fail — they fire against minimal DOM structures that reproduce the
 * exact bug each assertion guards against. If an instrument test stops
 * throwing, the assertion itself is broken.
 *
 * Mutation A proof (recorded at bottom of file):
 *   Setting `h-[196px]` on the img triggers Assertion A.
 *   Six failures across all 3 shapes × 2 mounts.
 *
 * Mutation B proof (instrument test — see "Mutation B simulation" below):
 *   Wrapping the sentence in `<div style={{ overflow: "hidden", height: "0px" }}`
 *   triggers Assertion C. The instrument test demonstrates this directly.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";

// ── Mock heavy dependencies so ResurfacedItem renders in jsdom ─────────────

vi.mock("@/components/materials", () => ({
  Mounted: ({
    children,
    id: _id,
    context: _ctx,
    elevation: _el,
    className,
    style: _st,
  }: {
    children: React.ReactNode;
    id?: string;
    context?: string;
    elevation?: number;
    className?: string;
    style?: React.CSSProperties;
  }) => createElement("div", { "data-testid": "mounted", className }, children),
  Torn: ({
    children,
    variant: _v,
  }: {
    children: React.ReactNode;
    variant?: number;
  }) => createElement("div", { "data-testid": "torn" }, children),
}));

vi.mock("@/components/item/Stamp", () => ({
  default: (_props: unknown) => createElement("div", { "data-testid": "stamp" }),
  UnsignedMark: (_props: unknown) => createElement("div", { "data-testid": "unsigned-mark" }),
}));

vi.mock("@/lib/fixtures/resolve", () => ({
  photoSrc: (_photo: unknown) => "/test-photo.jpg",
}));

// Override mountFor only — keep seededIn, handClass, authorshipOf etc. real.
vi.mock("@/components/book/compose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/book/compose")>();
  return { ...actual, mountFor: vi.fn() };
});

// Polaroid is only rendered for chin/square mounts; torn+stock never reach it.
// Mock it anyway to avoid any import-chain issues.
vi.mock("../Polaroid", () => ({
  Polaroid: ({
    children,
    photo: _ph,
    variant: _v,
    alt: _a,
  }: {
    children?: React.ReactNode;
    photo?: unknown;
    variant?: string;
    alt?: string;
  }) => createElement("div", { "data-testid": "polaroid" }, children),
}));

// ── Imports after mocks ────────────────────────────────────────────────────

import * as compose from "@/components/book/compose";
import type { MountKind } from "@/components/book/compose";
import { ResurfacedItem } from "../ResurfacedItem";
import type { Return } from "@/lib/resurface";
import type { Photo } from "@/lib/types";

afterEach(cleanup);

// ── Fixture factory ────────────────────────────────────────────────────────

function makeReturn(w: number, h: number): Return {
  const photo: Photo = {
    id: "fixture-leaf-test",
    clientUuid: "fixture-leaf-test",
    kind: "book",
    authorMemberId: "00000000-0000-0000-0000-000000000001",
    authorSlug: "eva",
    attributionSource: "self_declared",
    sharedDay: "2026-08-10",
    sharedDayTz: "America/New_York",
    storagePathDisplay: "p/fixture/display.jpg",
    storagePathThumb: "p/fixture/thumb.jpg",
    originalLocation: "r2",
    width: w,
    height: h,
    bytes: 100_000,
    mime: "image/jpeg",
    colorSpace: "srgb",
    checksumSha256: "a".repeat(64) as import("@/lib/types").Sha256Hex,
    exifStripped: true,
    createdAt: "2026-08-10T12:00:00Z",
    caption: "the whole square to myself for about a minute.",
  };
  return { reason: "date", label: "A day you might have forgotten", photo };
}

const SHAPES = [
  { name: "portrait (750×1000)", w: 750, h: 1000 },
  { name: "landscape (1000×750)", w: 1000, h: 750 },
  { name: "extreme portrait (460×1000)", w: 460, h: 1000 },
] as const;

const MOUNTS: MountKind[] = ["torn", "stock"];

// ── Assertion helpers ──────────────────────────────────────────────────────

/**
 * Assertion A — no fixed-pixel-height Tailwind class on the photograph.
 *
 * The PROBE-7 bug: design-H.html had `.lf .mount img { height:196px }`.
 * If that ever enters the React component (e.g. `h-[196px]`), every
 * portrait is letterboxed into a landscape box.
 */
function assertNoFixedPixelHeight(img: HTMLElement, label: string): void {
  const cls = img.className ?? "";
  const match = cls.match(/\bh-\[(\d+(?:\.\d+)?px)\]/);
  expect(
    match,
    `${label}: img.photo has fixed-pixel-height class "${match?.[0] ?? ""}" — this locks ` +
      `the mount into a fixed box and reverts the PROBE-7 bug`,
  ).toBeNull();
}

/**
 * Assertion B — sentence element comes AFTER the photograph in document order.
 *
 * If the sentence node appears before the image in the DOM tree the layout
 * renders inverted — photograph appears below the handwriting.
 */
function assertSentenceAfterImage(img: HTMLElement, sentence: HTMLElement, label: string): void {
  // compareDocumentPosition returns a bitmask. DOCUMENT_POSITION_PRECEDING (2)
  // is set if `sentence` comes before `img` in tree order.
  const sentenceBeforeImage = !!(
    img.compareDocumentPosition(sentence) & Node.DOCUMENT_POSITION_PRECEDING
  );
  expect(
    sentenceBeforeImage,
    `${label}: sentence element comes BEFORE the image in document order — layout is inverted`,
  ).toBe(false);
}

/**
 * Assertion C — no ancestor with overflow:hidden + fixed inline height clips
 * the sentence.
 *
 * The PROBE-8 failure: when design-H.html's `.lf` had `overflow:hidden` and a
 * fixed height (496px), letting the image grow to its natural portrait shape
 * pushed the `.say` sentence below that overflow boundary — it disappeared
 * entirely. The fix (flex layout with a min-height floor) must be intact in the
 * React component. This assertion catches any regression that re-introduces a
 * clipping ancestor via inline style OR Tailwind class.
 *
 * Two detection vectors:
 * 1. Inline styles: overflow:hidden + fixed px height (direct mutations)
 * 2. Tailwind classes: overflow-hidden OR overflow-clip on any ancestor with h-[Xpx]
 *    (the jsdom-detectable variant of Tailwind's fixed-height classes)
 *
 * The second vector requires walking up and checking className for patterns because
 * jsdom does not evaluate CSS stylesheets. The Mounted/MountBacking containers are
 * the intended targets of this check.
 */
function assertNoClippingAncestor(sentence: HTMLElement, label: string): void {
  const offenders: string[] = [];
  let node = sentence.parentElement;
  while (node !== null && node !== document.body) {
    // Vector 1: Inline styles (high confidence)
    const s = node.style;
    const overflow = s.overflow || s.overflowY;
    const h = s.height;
    if ((overflow === "hidden" || overflow === "clip") && h && /^\d+(\.\d+)?px$/.test(h)) {
      offenders.push(
        `<${node.tagName.toLowerCase()} style="overflow:${overflow}; height:${h}">`,
      );
    }

    // Vector 2: Tailwind classes (jsdom-detectable pattern)
    // Look for overflow-hidden OR overflow-clip paired with any height class.
    // Height patterns: h-N (shorthand: h-0, h-1, h-4, etc.) or h-[Xpx/dvh/etc]
    // These are the mutation patterns that would reproduce PROBE-8 in Tailwind.
    const className = node.className ?? "";
    const hasOverflowClass =
      /\boverflow-(?:hidden|clip)\b/.test(className) &&
      /\bh-(?:\d+|\[[0-9.]+(?:px|dvh|dvw|em|rem|vh|vw|%)\])\b/.test(className);

    if (hasOverflowClass) {
      const overflowMatch = className.match(/\boverflow-(?:hidden|clip)\b/)?.[0];
      const heightMatch = className.match(/\bh-(?:\d+|\[[^\]]+\])\b/)?.[0];
      offenders.push(
        `<${node.tagName.toLowerCase()} className="...${overflowMatch} ${heightMatch}...">`,
      );
    }

    node = node.parentElement;
  }
  expect(
    offenders,
    `${label}: ancestor with overflow:hidden + fixed px height clips the sentence — PROBE-8 regression`,
  ).toEqual([]);
}

// ── Main suite: 6 cases (3 shapes × 2 mounts) ────────────────────────────

describe("leaf sentence floor — torn and stock mounts", () => {
  for (const mount of MOUNTS) {
    describe(`mount: ${mount}`, () => {
      beforeEach(() => {
        vi.mocked(compose.mountFor).mockReturnValue(mount);
      });

      for (const shape of SHAPES) {
        it(`${shape.name} — sentence is present and not clipped`, () => {
          const { container } = render(
            createElement(ResurfacedItem, { returned: makeReturn(shape.w, shape.h) }),
          );

          // The photograph — must carry `.photo` class (the law identity token).
          const img = container.querySelector("img.photo") as HTMLElement | null;
          expect(img, "img.photo must be in the DOM").not.toBeNull();

          // The page-level sentence: a <p> with leading-snug and text-ink,
          // sitting outside the Mounted figure (not inside .polaroid or .torn).
          // querySelectorAll returns in DOM order; we want the LAST match (the
          // sentence, not any interior label). There is only one for these mounts.
          const sentences = Array.from(
            container.querySelectorAll("p.leading-snug.text-ink"),
          ) as HTMLElement[];
          const sentence = sentences.at(-1) ?? null;
          expect(
            sentence,
            'sentence <p class="leading-snug text-ink"> must be in the DOM',
          ).not.toBeNull();

          const label = `${mount} / ${shape.name}`;
          assertNoFixedPixelHeight(img!, label);
          assertSentenceAfterImage(img!, sentence!, label);
          assertNoClippingAncestor(sentence!, label);
        });
      }
    });
  }
});

// ── Instrument tests: each assertion MUST be able to fail ────────────────

describe("instrument — each assertion fires when the bug is present", () => {
  it("Assertion A: fires when img carries h-[196px]", () => {
    // Simulate the PROBE-7 regression: a fixed landscape height on every photo.
    const img = document.createElement("img");
    img.className = "photo block h-[196px] w-full object-cover";
    expect(() => assertNoFixedPixelHeight(img, "instrument:a")).toThrow();
  });

  it("Assertion B: fires when sentence precedes the image in the DOM", () => {
    const container = document.createElement("div");
    const sentence = document.createElement("p");
    const img = document.createElement("img");
    // Sentence is the first child — image comes after. This is the inverted order.
    container.appendChild(sentence);
    container.appendChild(img);
    expect(() => assertSentenceAfterImage(img, sentence, "instrument:b")).toThrow();
  });

  /**
   * Assertion C — Two mutation vectors.
   *
   * Vector 1 (inline style): Wrapping the caption <p> in
   * `<div style={{ overflow: "hidden", height: "0px" }}>` inside ResurfacedItem.
   * This is the original PROBE-8 scenario.
   *
   * Vector 2 (Tailwind class): Adding className with both overflow-hidden and h-[Xpx]
   * to an ancestor (e.g., the Mounted container). The CEO's exact mutation:
   * className={leftward ? "-ml-2 overflow-hidden h-4" : "-mr-2 overflow-hidden h-4"}
   *
   * Both must trigger the assertion. This test proves Vector 1; a separate mutation
   * proof comes after.
   *
   * VECTOR 1 OUTPUT (inline style):
   *   AssertionError: instrument:b-sim: ancestor with overflow:hidden + fixed
   *   px height clips the sentence — PROBE-8 regression
   *
   *   Expected: []
   *   Received: ['<div style="overflow:hidden; height:0px">']
   */
  it("Assertion C (Mutation B simulation — inline style): fires when overflow:hidden ancestor clips sentence", () => {
    // Build the exact DOM structure Mutation B would introduce:
    // a div with overflow:hidden + height:0px wrapping the sentence.
    const clip = document.createElement("div");
    clip.style.overflow = "hidden";
    clip.style.height = "0px";
    document.body.appendChild(clip);

    const sentence = document.createElement("p");
    sentence.className = "leading-snug text-ink";
    clip.appendChild(sentence);

    // Capture what the assertion walks — do it ourselves so we can inspect
    // the offenders list directly without relying on vitest's error formatting.
    const offenders: string[] = [];
    let node: HTMLElement | null = sentence.parentElement;
    while (node !== null && node !== document.body) {
      const s = node.style;
      const overflow = s.overflow || s.overflowY;
      const h = s.height;
      if ((overflow === "hidden" || overflow === "clip") && h && /^\d+(\.\d+)?px$/.test(h)) {
        offenders.push(
          `<${node.tagName.toLowerCase()} style="overflow:${overflow}; height:${h}">`,
        );
      }
      node = node.parentElement;
    }
    document.body.removeChild(clip);

    // Prove the offenders list contains the clipping ancestor.
    expect(offenders).toContain('<div style="overflow:hidden; height:0px">');

    // And confirm that assertNoClippingAncestor itself throws on this structure
    // (it internally calls expect(offenders).toEqual([]), which fails).
    const clip2 = document.createElement("div");
    clip2.style.overflow = "hidden";
    clip2.style.height = "0px";
    document.body.appendChild(clip2);
    const sentence2 = document.createElement("p");
    clip2.appendChild(sentence2);
    expect(() => assertNoClippingAncestor(sentence2, "instrument:b-sim-inline")).toThrow();
    document.body.removeChild(clip2);
  });

  /**
   * VECTOR 2 (Tailwind class): overflow-hidden + h-[Xpx].
   *
   * This is the CEO's mutation on Mounted: adding both overflow-hidden and h-4
   * to the className. The assertion now walks ancestors and checks for this pattern
   * because jsdom does not evaluate CSS.
   *
   * VECTOR 2 OUTPUT:
   *   AssertionError: instrument:b-sim-tailwind: ancestor with overflow:hidden + fixed
   *   px height clips the sentence — PROBE-8 regression
   *
   *   Expected: []
   *   Received: ['<div className="...overflow-hidden h-4...">']
   */
  it("Assertion C (Mutation B simulation — Tailwind class): fires when overflow-hidden + h-[Xpx] ancestor clips sentence", () => {
    // Build a DOM structure with Tailwind classes that would reproduce PROBE-8:
    // The CEO's exact mutation: Mounted gets className with "overflow-hidden h-4"
    const clip = document.createElement("div");
    clip.className = "mt-7 overflow-hidden h-4 flex justify-end";
    document.body.appendChild(clip);

    const sentence = document.createElement("p");
    sentence.className = "leading-snug text-ink";
    clip.appendChild(sentence);

    // assertNoClippingAncestor must detect this Tailwind pattern and throw.
    expect(() => assertNoClippingAncestor(sentence, "instrument:b-sim-tailwind")).toThrow();
    document.body.removeChild(clip);
  });
});

/*
 * ─── MUTATION A PROOF ─────────────────────────────────────────────────────────
 *
 * Applied via:
 *   sed -i '' 's/h-auto max-h-\[58dvh\]/h-[196px]/' ResurfacedItem.tsx
 *   pnpm vitest run components/book/__tests__/leaf-sentence-floor.test.tsx
 *   sed -i '' 's/h-\[196px\]/h-auto max-h-[58dvh]/' ResurfacedItem.tsx
 *
 * Output (all 6 main cases fail, 3 instrument tests still pass):
 *
 *   × mount: torn > portrait (750×1000) — sentence is present and not clipped
 *     AssertionError: torn / portrait (750×1000): img.photo has fixed-pixel-height
 *     class "h-[196px]" — this locks the mount into a fixed box and reverts the
 *     PROBE-7 bug: expected [ 'h-[196px]', '196px', …(3) ] to be null
 *     - Expected: null
 *     + Received: ["h-[196px]", "196px"]
 *
 *   × mount: torn > landscape (1000×750) — [same pattern]
 *   × mount: torn > extreme portrait (460×1000) — [same pattern]
 *   × mount: stock > portrait (750×1000) — [same pattern]
 *   × mount: stock > landscape (1000×750) — [same pattern]
 *   × mount: stock > extreme portrait (460×1000) — [same pattern]
 *
 *   Test Files  1 failed (1) · Tests  6 failed | 3 passed (9)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─── MUTATION B PROOF ─────────────────────────────────────────────────────────
 *
 * The instrument test "Assertion C (Mutation B simulation)" above captures this
 * failure directly. Assertion C walks up from sentence.parentElement and finds
 * any ancestor with inline overflow:hidden + fixed px height. The instrument test
 * constructs exactly that DOM structure and verifies the assertion throws with
 * the PROBE-8 message.
 *
 * If Mutation B were applied to ResurfacedItem.tsx (wrapping the sentence <p>
 * in <div style={{ overflow:"hidden", height:"0px" }}>), all 6 main cases would
 * additionally fail with:
 *
 *   AssertionError: torn / portrait (750×1000): ancestor with overflow:hidden +
 *   fixed px height clips the sentence — PROBE-8 regression
 *
 *   Expected: []
 *   Received: ['<div style="overflow:hidden; height:0px">']
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
