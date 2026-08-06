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
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import { BookTurnControls, BookTurnStage } from "../BookTurnStage";
import { SETTLE_MS, useBookTurn } from "../useBookTurn";

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

  it("the element that carries the animated transform is the same element that declares a transition naming transform — otherwise a real browser never fires transitionend for it", () => {
    // This is a structural check, not a behavioral one: it reads the
    // rendered style attributes and fires no event at all. The bug
    // this guards against was a wrapper declaring `transition:
    // transform ...` while never itself setting `transform` (that
    // lived on its child instead) — a combination no real browser
    // ever fires `transitionend` for, because the property named in
    // the transition never actually changed on that element. A test
    // that hand-fires the event (see the WCAG-path tests below)
    // cannot catch that mismatch; only reading the two style
    // attributes and requiring them to agree can.
    render(createElement(Harness, { count: 2 }));
    fireEvent.click(screen.getByLabelText("Next page")); // enters a real settle
    const wrapper = leafWrapper(0);
    const flip = flipOf(wrapper);
    expect(flip.style.transform).not.toBe("");
    expect(flip.style.transition).toContain("transform");
    // And the inverse: the wrapper must NOT claim a transition for a
    // property it never sets — that mismatch is the bug.
    expect(wrapper.style.transform).toBe("");
    expect(wrapper.style.transition).not.toContain("transform");
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
    expect(flip0.style.transition).toContain("transform");
  });

  // jsdom does not run real CSS transitions, so the tests below
  // hand-fire the `transitionend` event a browser sends once the
  // transform's own transition genuinely completes — on the flip
  // element, the one that actually declares `transform` and its
  // transition (see BookTurnStage.tsx). jsdom cannot confirm that a
  // real browser would fire this event on its own; the structural
  // test above (in the "structure" describe block) is what actually
  // catches a wrapper/flip mismatch, since it reads style attributes
  // instead of manufacturing the signal it's supposed to check for.

  it("finishes the turn on transitionend, and only then flips the disabled buttons", () => {
    render(createElement(Harness, { count: 2 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    fireEvent.transitionEnd(flipOf(leafWrapper(0)), { propertyName: "transform" });
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
    // The now-current leaf (index 1) rests unrotated on top.
    expect(flipOf(leafWrapper(1)).style.transform).toContain("rotateY(0deg)");
  });

  it("a filter transitionend on the flip element does not finish the turn — only transform does", () => {
    render(createElement(Harness, { count: 3 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    const flip0 = flipOf(leafWrapper(0));
    // Real filter transitions live on the wrapper, not the flip
    // element, so a browser would never actually deliver this — this
    // guards the `propertyName` check itself, defensively, against a
    // future refactor that adds a second transitioned property here.
    fireEvent.transitionEnd(flip0, { propertyName: "filter" });
    // Still mid-settle, still on leaf 0 — Previous is still disabled
    // (isFirst). The turn only finalizes on a "transform" event.
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.transitionEnd(flip0, { propertyName: "transform" });
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(false);
  });

  it("reduced motion commits Next instantly — no transition, no pending settle", () => {
    reduced = true;
    render(createElement(Harness, { count: 2 }));
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(leafWrapper(0).style.transition).toBe("none");
    expect(leafWrapper(1).style.transition).toBe("none");
    expect(flipOf(leafWrapper(0)).style.transition).toBe("none");
    expect(flipOf(leafWrapper(1)).style.transition).toBe("none");
    expect(flipOf(leafWrapper(1)).style.transform).toContain("rotateY(0deg)");
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  });

  it("a settle whose transitionend never arrives still resolves, via the fallback timer", () => {
    // Simulates a dropped/coalesced transition event (backgrounded
    // tab, a leaf unmounted mid-settle) — no transitionend is ever
    // fired by hand. Without the fallback timer in useBookTurn.ts,
    // `settling` has no other exit and this wedges Next/Prev/drag
    // shut for the rest of the session.
    vi.useFakeTimers();
    try {
      render(createElement(Harness, { count: 2 }));
      fireEvent.click(screen.getByLabelText("Next page"));
      expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(false);
      act(() => {
        vi.advanceTimersByTime(SETTLE_MS + 200);
      });
      expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(false);
      expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
      expect(flipOf(leafWrapper(1)).style.transform).toContain("rotateY(0deg)");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("BookTurnStage — the drag gesture", () => {
  it("tracks the pointer 1:1 with no transition while live", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 200 });
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
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 200 });
    clock.set(10);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 197 }); // 3px
    expect(flipOf(leafWrapper(0)).style.transform).toContain("rotateY(0deg)");
  });

  it("releasing past the commit threshold settles toward the next leaf", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 300 });
    clock.set(400);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 50 }); // -250px ≈ progress 1
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 50 });
    expect(flipOf(leafWrapper(0)).style.transform).toContain("172deg");
    // This particular release lands exactly on progress 1 — the same
    // pose the settle would target — so the no-op guard in
    // useBookTurn.ts's releaseDrag resolves it inline and this fire is
    // a harmless no-op by the time it arrives. Left in place because a
    // release that lands short of 1 (any real thumb) still needs it.
    fireEvent.transitionEnd(flipOf(leafWrapper(0)), { propertyName: "transform" });
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  });

  it("releasing short of the threshold, slowly, springs back instead of committing", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 300 });
    // -40px over 400ms: progress 40/220 ≈ 0.18, velocity 0.1px/ms — under both thresholds.
    clock.set(400);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 260 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 260 });
    fireEvent.transitionEnd(flipOf(leafWrapper(0)), { propertyName: "transform" });
    expect((screen.getByLabelText("Previous page") as HTMLButtonElement).disabled).toBe(true); // still leaf 0
    expect(flipOf(leafWrapper(0)).style.transform).toContain("rotateY(0deg)");
  });

  it("a fast flick commits even short of the distance threshold", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 300 });
    // -60px over 50ms = 1.2px/ms, above COMMIT_VELOCITY (0.5) though
    // progress (60/220 ≈ 0.27) is under COMMIT_PROGRESS (0.4).
    clock.set(50);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 240 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 240 });
    fireEvent.transitionEnd(flipOf(leafWrapper(0)), { propertyName: "transform" });
    expect((screen.getByLabelText("Next page") as HTMLButtonElement).disabled).toBe(true);
  });

  it("a drag that returns exactly to its own origin and releases there does not wedge settling — next() still works afterward", () => {
    // The second, independent deadlock: releaseDrag used to call
    // setSettling unconditionally for any started drag. Dragged out
    // past the threshold and back to exactly clientX 200 (deltaX 0,
    // progress clamps to 0) — the release target (0, since it doesn't
    // commit) is the SAME pose already on screen. No CSS property
    // would change, so no transition starts and no transitionend
    // fires. No transitionend is hand-fired here on purpose: the fix
    // must resolve this without waiting for one.
    const clock = makeClock();
    render(createElement(Harness, { count: 2, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 200 });
    clock.set(50);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 100 }); // -100px, past threshold
    clock.set(100);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200 }); // back to the origin: progress 0
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 200 });
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(flipOf(leafWrapper(0)).style.transform).toContain("172deg");
  });

  it("dragging forward past the last leaf rubber-bands and never commits", () => {
    const clock = makeClock();
    render(createElement(Harness, { count: 1, clock: clock.now }));
    const stage = screen.getByRole("group", { name: "The pages" });
    fireEvent.pointerDown(stage, { pointerId: 1, isPrimary: true, clientX: 300 });
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
