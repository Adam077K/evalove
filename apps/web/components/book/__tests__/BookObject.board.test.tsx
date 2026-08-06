// @vitest-environment jsdom
/**
 * The open book's back board — the cloth is a LAYER, not a wrapper.
 *
 * The general law ("no filter above a photograph, anywhere") is
 * enforced in components/__tests__/lamp-never-reaches-a-photograph.tsx.
 * This file guards the specific mechanism chosen here, because both
 * halves of it are easy to undo by accident:
 *
 *   1. `.under-lamp` belongs to a decorative sibling painted beneath
 *      the pages. Moving it back onto the board wrapper — the obvious
 *      "simplification", and what shipped — dims every photograph in
 *      the book at night.
 *   2. The wrapper must isolate. The filter used to create the board's
 *      stacking context for free; the turning leaves carry z-index
 *      1000+ (useBookTurn.zIndexFor), so without `isolation: isolate`
 *      they escape the board and paint over the swinging flap (z-20)
 *      and the close affordance (z-30) mid-turn.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PHOTOS } from "@/lib/fixtures/photos";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import type { BookLeaf } from "@/components/book/leaves";
import type { Return } from "@/lib/resurface";
import { BookObject } from "../BookObject";

afterEach(cleanup);

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

const RETURNED: Return = {
  reason: "date",
  label: "A year ago today",
  photo: PHOTOS["d0729-eva"],
};

const LEAVES: BookLeaf[] = [
  {
    day: SHARED_DAYS.find((d) => d.date === "2026-07-30")!,
    evaPhoto: PHOTOS["d0730-eva"],
    adamPhoto: PHOTOS["d0730-adam"],
  },
];

function openTheBook() {
  render(
    <BookObject returned={RETURNED} leaves={LEAVES} leafCount={6} begun="2026-08-02" />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open the book" }));
  return screen.getByRole("region", { name: "The book, open" });
}

/** The one element inside the open book carrying the lamp class. */
function clothLayer(): HTMLElement {
  const layers = document.querySelectorAll<HTMLElement>(".under-lamp");
  const cloth = Array.from(layers).find((el) =>
    el.style.backgroundImage.includes("book-cloth-olive"),
  );
  if (!cloth) throw new Error("the board's cloth layer is gone");
  return cloth;
}

describe("BookObject — the back board", () => {
  it("paints the cloth on a decorative sibling, not on an ancestor of the pages", () => {
    openTheBook();
    const cloth = clothLayer();
    expect(cloth.getAttribute("aria-hidden")).toBe("true");
    expect(cloth.className).toContain("absolute");

    const pages = screen.getByRole("group", { name: "The pages" });
    expect(cloth.contains(pages)).toBe(false);
    expect(cloth.parentElement!.contains(pages)).toBe(true);
  });

  it("keeps the board's own cast shadow and its LampShade inside the lamp, so the cloth dims exactly as before", () => {
    openTheBook();
    const cloth = clothLayer();
    expect(cloth.style.boxShadow).toContain("rgba(41,32,24,0.18)");
    // LampShade — the directional low-lamp gradient, ×--lamp-dim.
    const shade = cloth.querySelector<HTMLElement>("[aria-hidden='true']");
    expect(shade?.style.background).toContain("--lamp-dim");
  });

  it("isolates the board, so a turning leaf's z-index cannot escape over the flap", () => {
    openTheBook();
    const board = clothLayer().parentElement!;
    expect(board.style.isolation).toBe("isolate");
  });
});
