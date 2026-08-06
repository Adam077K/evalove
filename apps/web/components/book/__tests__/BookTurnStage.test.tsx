// @vitest-environment jsdom
/**
 * Structural + interaction tests for the spine-hinged turn
 * (turn.ts's pure math is covered separately in turn.test.ts).
 *
 * `matchMedia` is mocked exactly as Dock.test.tsx does — jsdom does
 * not implement it — and reduced-motion is toggled per test via that
 * mock's `matches`, matching useBookTurn.ts's own `reducedMotion()`
 * check.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import { BookTurnControls, BookTurnStage } from "../BookTurnStage";
import { useBookTurn } from "../useBookTurn";

afterEach(cleanup);

let reduced = false;

beforeEach(() => {
  reduced = false;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("reduce") ? reduced : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

/** A minimal harness wiring useBookTurn to both exports, the same
    way BookObject.tsx and DaysTurner.tsx do — lets tests reach real
    leaf DOM nodes via data-leaf-index. `clock`, when given, replaces
    useBookTurn's default `Date.now` (see UseBookTurnOptions) so
    velocity-dependent tests can drive elapsed time deterministically
    without mocking the process-global `Date` — that mock isn't
    scoped to this file and can bleed into whatever else is running
    concurrently in the same worker. */
function Harness({ count, clock }: { count: number; clock?: () => number }) {
  const turn = useBookTurn(count, clock ? { now: clock } : undefined);
  const leaves = Array.from({ length: count }, (_, i) =>
    createElement("p", { key: i, "data-testid": `front-${i}` }, `leaf ${i}`),
  );
  return createElement(
    "div",
    null,
    createElement(BookTurnStage, { ariaLabel: "The pages", turn, leaves }),
    createElement(BookTurnControls, { turn }),
  );
}

/** A manually-advanced clock for the drag tests below — call
    `clock.set(ms)` between fireEvent calls to control elapsed time. */
function makeClock(start = 0) {
  let t = start;
  const now = () => t;
  return { now, set: (ms: number) => (t = ms) };
}

function leafWrapper(index: number): HTMLElement {
  const el = document.querySelector(`[data-leaf-index="${index}"]`);
  if (!el) throw new Error(`leaf ${index} not found`);
  return el as HTMLElement;
}

function flipOf(wrapper: HTMLElement): HTMLElement {
  return wrapper.firstElementChild as HTMLElement;
}

describe("BookTurnStage — structure", () => {
  it("renders one stacked wrapper per leaf, all in the same grid cell", () => {
    render(createElement(Harness, { count: 3 }));
    for (let i = 0; i < 3; i++) {
      expect(leafWrapper(i).style.gridArea).toBe("1 / 1");
    }
  });

  it("gives every leaf a front face and a back face, both backface-hidden", () => {
    render(createElement(Harness, { count: 1 }));
    const flip = flipOf(leafWrapper(0));
    expect(flip.children.length).toBe(2);
    const [front, back] = Array.from(flip.children) as HTMLElement[];
    expect(front!.style.backfaceVisibility).toBe("hidden");
    expect(back!.style.backfaceVisibility).toBe("hidden");
  });

  it("the flip wrapper and front face both claim height: 100% — a leaf shorter than the tallest one must still fill the stack, not let the leaf behind it show through the gap", () => {
    render(createElement(Harness, { count: 2 }));
    const flip = flipOf(leafWrapper(0));
    expect(flip.style.height).toBe("100%");
    const front = flip.children[0] as HTMLElement;
    expect(front.style.height).toBe("100%");
  });

  it("the back face is plain bone paper, baked at rotateY(180deg) — the endpaper treatment, not a new asset", () => {
    render(createElement(Harness, { count: 1 }));
    const flip = flipOf(leafWrapper(0));
    const back = flip.children[1] as HTMLElement;
    expect(back.style.transform).toBe("rotateY(180deg)");
    expect(back.style.backgroundImage).toContain("paper-bone-v2.png");
  });

  it("the hinge sits at the left edge, matching turn.ts's convention", () => {
    render(createElement(Harness, { count: 2 }));
    expect(flipOf(leafWrapper(0)).style.transformOrigin).toBe("left center");
  });

  it("the resting leaf (index 0, current) has no rotation and the highest z-index", () => {
    render(createElement(Harness, { count: 3 }));
    const flip0 = flipOf(leafWrapper(0));
    expect(flip0.style.transform).toContain("rotateY(0deg)");
    const z = [0, 1, 2].map((i) => Number(leafWrapper(i).style.zIndex));
    expect(z[0]).toBeGreaterThan(z[1]!);
    expect(z[1]).toBeGreaterThan(z[2]!);
  });
});

describe("BookTurnStage — the WCAG 2.5.7 path (buttons, no drag)", () => {
  it("Previous is disabled on the first leaf; Next is disabled on the last", () => {
    render(createElement(Harness, { count: 2 }));
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(false);
  });

  it("clicking Next settles leaf 0 toward turned-away (172deg) with a transition, not an instant jump", () => {
    render(createElement(Harness, { count: 2 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    const flip0 = flipOf(leafWrapper(0));
    expect(flip0.style.transform).toContain("172deg");
    expect(leafWrapper(0).style.transition).not.toBe("none");
  });

  it("finishes the turn on transitionend, and only then flips the disabled buttons", () => {
    render(createElement(Harness, { count: 2 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    fireEvent.transitionEnd(leafWrapper(0), { propertyName: "transform" });
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
    // The now-current leaf (index 1) rests unrotated on top.
    expect(flipOf(leafWrapper(1)).style.transform).toContain("rotateY(0deg)");
  });

  it("a filter transitionend on the same leaf does not double-finish the turn", () => {
    render(createElement(Harness, { count: 3 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    fireEvent.transitionEnd(leafWrapper(0), { propertyName: "filter" });
    // Still mid-settle: Next should still be reachable (not yet on the
    // second leaf's own bounds) and the transform hasn't been
    // finalized into a new resting frame.
    fireEvent.transitionEnd(leafWrapper(0), { propertyName: "transform" });
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(false);
  });

  it("reduced motion commits Next instantly — no transition, no pending settle", () => {
    reduced = true;
    render(createElement(Harness, { count: 2 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(leafWrapper(0).style.transition).toBe("none");
    expect(leafWrapper(1).style.transition).toBe("none");
    expect(flipOf(leafWrapper(1)).style.transform).toContain("rotateY(0deg)");
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("BookTurnStage — the drag gesture", () => {
  it("tracks the pointer 1:1 with no transition while live", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200 });
    clock.set(50);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 90 }); // -110px, past threshold
    const flip0 = flipOf(leafWrapper(0));
    expect(leafWrapper(0).style.transition).toBe("none");
    // -110 / 220 = 0.5 progress — well past 0, well short of 172deg.
    expect(flip0.style.transform).toMatch(/rotateY\(([1-9]\d?(\.\d+)?)deg\)/);
  });

  it("a movement under the drag threshold is a tap on the page, not a turn", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200 });
    clock.set(10);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 197 }); // 3px
    expect(flipOf(leafWrapper(0)).style.transform).toContain("rotateY(0deg)");
  });

  it("releasing past the commit threshold settles toward the next leaf", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300 });
    clock.set(400);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 50 }); // -250px ≈ progress 1
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 50 });
    expect(flipOf(leafWrapper(0)).style.transform).toContain("172deg");
    fireEvent.transitionEnd(leafWrapper(0), { propertyName: "transform" });
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  });

  it("releasing short of the threshold, slowly, springs back instead of committing", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300 });
    // -40px over 400ms: progress 40/220 ≈ 0.18, velocity 0.1px/ms — under both thresholds.
    clock.set(400);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 260 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 260 });
    fireEvent.transitionEnd(leafWrapper(0), { propertyName: "transform" });
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(true); // still leaf 0
    expect(flipOf(leafWrapper(0)).style.transform).toContain("rotateY(0deg)");
  });

  it("a fast flick commits even short of the distance threshold", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300 });
    // -60px over 50ms = 1.2px/ms, above COMMIT_VELOCITY (0.5) though
    // progress (60/220 ≈ 0.27) is under COMMIT_PROGRESS (0.4).
    clock.set(50);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 240 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 240 });
    fireEvent.transitionEnd(leafWrapper(0), { propertyName: "transform" });
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  });

  it("dragging forward past the last leaf rubber-bands and never commits", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 1, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300 });
    clock.set(400);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 40 }); // would be progress ~1 unbounded
    const flip0 = flipOf(leafWrapper(0));
    const match = /rotateY\(([\d.]+)deg\)/.exec(flip0.style.transform);
    const angle = match ? Number(match[1]) : 0;
    expect(angle).toBeLessThan(172 * 0.3); // damped well short of the full arc
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 40 });
    // A single-leaf book has no Next/Prev at all — nothing to commit to.
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(true);
  });
});
