// @vitest-environment jsdom
/**
 * LEAF SENTENCE FLOOR — structural regression test.
 *
 * Guards two invariants that prevent the handwritten sentence (caption) from
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
 * Three photograph shapes from the real design-ph-* library:
 *   portrait         750×1000  (most common shape in the library)
 *   landscape        1000×750  (widest in library)
 *   extreme portrait 460×1000  (tallest in library — design-ph-20260806-04)
 *
 * Two vulnerable mount kinds (torn · stock) — the two that place the
 * sentence as a sibling <p> below the image on the page, not inside
 * a Polaroid chin. Six test cases total: 3 shapes × 2 mounts.
 *
 * Two instrument tests (one per invariant) prove each assertion CAN
 * fail — they fire against minimal DOM structures that reproduce the
 * exact bug each assertion guards against. If an instrument test stops
 * throwing, the assertion itself is broken.
 *
 * Mutation A proof (recorded at bottom of file):
 *   Setting `h-[196px]` on the img triggers Assertion A.
 *   Six failures across all 3 shapes × 2 mounts.
 *
 * NOTE: Assertion C (overflow:hidden ancestor check) was removed after
 * verification that it cannot catch the PROBE-8 regression in practice.
 * See the comment block replacing assertNoClippingAncestor for details.
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
 * Assertion C was removed after verification that it cannot catch the PROBE-8
 * regression in practice. The regression occurs when an ancestor element
 * combines `overflow:hidden` (or `overflow:clip`) with a fixed height, causing
 * content to be clipped. This guard was designed to catch such patterns by
 * checking both:
 *
 *   1. Inline styles: `style={{overflow: "hidden", height: "4px"}}`
 *   2. Tailwind classes: `overflow-hidden h-[4px]` or similar
 *
 * However, the pattern-matching approach is fundamentally insufficient because:
 * - jsdom does not resolve CSS stylesheets or evaluate computed styles
 * - Tailwind height classes form an unbounded set: h-0, h-1, h-4, h-full,
 *   h-screen, max-h-*, size-*, responsive variants, and inherited heights
 * - Any pattern-based check will have gaps that look like coverage
 *
 * The CEO verified this twice by mutating ResurfacedItem.tsx line 130,
 * changing `className={leftward ? "-ml-2" : "-mr-2"}` to
 * `className={leftward ? "-ml-2 overflow-hidden h-[4px]" : "-mr-2 overflow-hidden h-[4px]"}`.
 * All tests passed despite the regression being present.
 *
 * The correct home for this check is a real-browser assertion that reads
 * `getComputedStyle` on every ancestor of the sentence element and verifies
 * neither overflow:hidden nor overflow:clip is set. This requires Playwright
 * or similar browser automation with access to computed styles — not jsdom.
 *
 * Until such a check exists, the sentence visibility floor is solely guarded
 * by Assertions A and B, and by manual visual inspection during development.
 */

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
});

/*
 * ─── MUTATION A PROOF ─────────────────────────────────────────────────────────
 *
 * Applied via:
 *   sed -i '' 's/h-auto max-h-\[58dvh\]/h-[196px]/' ResurfacedItem.tsx
 *   pnpm vitest run components/book/__tests__/leaf-sentence-floor.test.tsx
 *   sed -i '' 's/h-\[196px\]/h-auto max-h-[58dvh]/' ResurfacedItem.tsx
 *
 * Output (all 6 main cases fail, 2 instrument tests still pass):
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
 *   Test Files  1 failed (1) · Tests  6 failed | 2 passed (8)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
