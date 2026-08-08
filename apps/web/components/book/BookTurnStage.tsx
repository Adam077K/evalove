"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { SETTLE_MS, useBookTurn } from "./useBookTurn";

/**
 * The stack a spine-hinged turn needs — and the one piece both
 * `/book` (BookObject.tsx) and `/book/days` share, so the mechanism
 * exists exactly once. See turn.ts for why this replaced the
 * scroll-snap carousel, and useBookTurn.ts for the gesture/settle
 * state machine driving it.
 *
 * Split into two exports rather than one bundled component because
 * the two call sites need the stage and its Prev/Next controls in
 * different places in the DOM: BookObject.tsx keeps ForeEdge as a
 * flex sibling of the stage (`items-stretch`, so the fore-edge
 * matches the page block's own height) while the controls sit below
 * the whole board, outside that row. `useBookTurn` is lifted to the
 * caller so both exports share one turn state instead of each owning
 * a private, disagreeing copy of it.
 *
 * Leaves are stacked, not laid in a row: every leaf occupies the
 * SAME grid cell (`gridArea: "1 / 1"`), which is what lets the
 * hinge sit at a fixed on-screen point while whatever is under the
 * turning leaf is already exactly where it needs to be — nothing
 * slides in from off-screen. CSS Grid's own stacking (rather than
 * `position: absolute`) is deliberate: an absolutely positioned
 * stack has no intrinsic height of its own (nothing in normal flow
 * to measure), which would collapse the whole stage to 0px: a grid
 * cell auto-sizes to its tallest un-transformed item, which is
 * exactly BookSheet's own documented contract ("its slots stretch to
 * the tallest leaf," BookSheet.tsx) — carried over from the old flex
 * row without a hidden sizing element. (CSS `transform` never
 * affects layout size, so live rotation never resizes the track.)
 *
 * Each leaf is two faces on one hinge, matching `.cover-flap`'s
 * proven pattern (BookCover.tsx/BookObject.tsx) rather than
 * inventing a second one: a `transform-style: preserve-3d` wrapper
 * holding a front face (the caller's BookSheet, `backface-visibility:
 * hidden`) and a back face (plain bone paper, baked `rotateY(180deg)`,
 * `backface-visibility: hidden`) — reusing paper-bone-v2.png with the
 * identical hinge-shade treatment BookObject.tsx's endpaper already
 * uses, not a new asset. The drop-shadow `filter` sits on an outer,
 * non-3D wrapper: putting it on the preserve-3d element itself would
 * force that element flat (the same constraint `.cover-flap`'s own
 * comment documents), which would silently break the two-face trick.
 *
 * Photographs are unaffected: `.photo`'s own `filter: none` (globals
 * §—"Photographs. Full strength, always") isn't touched by an
 * ancestor's `drop-shadow`, which only adds a shadow around the
 * already-rendered subtree and never dims, desaturates or blurs it —
 * the retired keyframes already proved this coexistence for years
 * with zero regression.
 */

export type BookTurn = ReturnType<typeof useBookTurn>;

export interface BookTurnStageProps {
  /** One already-composed leaf (a `<BookSheet>` element) per page. */
  leaves: ReactNode[];
  /** Read by screen readers for the stage as a whole. */
  ariaLabel: string;
  className?: string;
  turn: BookTurn;
}

const FACE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
};

export function BookTurnStage({ leaves, ariaLabel, className, turn }: BookTurnStageProps) {
  // The grid cell this stage renders (see the file comment) auto-sizes to
  // the TALLEST leaf ever mounted, not the current one — CSS transforms
  // never affect layout size, so a leaf turned away still claims its own
  // height. A short leaf therefore sits inside a much taller shared cell,
  // with the leaf itself top-aligned and dead paper below it before
  // Prev/Next. Reaching those controls on a tall stack can require
  // scrolling the window most of the way down — and because the stage's
  // own height never changes between leaves, that scroll position then
  // carries straight onto whichever leaf just became current, landing on
  // its lower half and leaving the running head and lead photograph
  // above the fold. Measured on `/book/days`: a page turn taking the
  // window to its true scroll maximum, then the next (shorter) leaf
  // opening already scrolled past its own top — indistinguishable, on
  // screen, from a missing photograph.
  //
  // The fix is not to resize the cell (every leaf needs the same box to
  // stack in — see the file comment on why grid-stacking was chosen over
  // `position: absolute`), it is to stop trusting whatever scroll
  // position a turn happened to start from. Every committed turn — a
  // button press or a completed drag, both of which move `currentIndex`
  // — snaps the stage's own top back under the fixed masthead, the same
  // correction `/dates` already needed for its own scroll-position bug.
  // Skipped on first mount: the initial leaf is already exactly where it
  // should be, and firing this on mount would hide whatever heading sits
  // above the stage (`/book/days`'s "The days in order").
  const stageRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // QA-Lead caught a real regression here: the Prev/Next buttons (the
    // WCAG 2.5.7 no-drag path — they exist FOR keyboard users) sit BELOW
    // this stage in DOM order. A sighted keyboard user tabs to "Next" and
    // presses it; this effect then scrolled the stage's TOP into view,
    // which put the very button that still has focus below the bottom of
    // the screen — the fix for the pointer/drag case cost keyboard users
    // their place.
    //
    // The first guard tried here — skip when `activeElement !== body` —
    // does not hold: verified against a real click in Chromium, a mouse
    // tap on the button ALSO leaves it focused (`activeElement` is the
    // button, not `body`), so that check silently disabled the scroll fix
    // for the ordinary tap-to-turn case too. Measured, not assumed: a
    // clicked Next button and a Tab-then-Enter'd Next button both leave
    // `document.activeElement` on the same node; they differ only in
    // WHY it is focused, and `:focus-visible` is the platform's own
    // answer to exactly that question — Chromium's heuristic matches it
    // for keyboard-driven focus and not for a mouse click. A drag-completed
    // turn involves no button at all and leaves focus on `<body>`, which
    // fails `:focus-visible` the same way a mouse click does, so both
    // non-keyboard paths correctly fall through to the scroll fix below.
    const kbdFocused =
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches(":focus-visible");
    if (kbdFocused) return;
    // jsdom (this component's own test file) has no `scrollIntoView` at
    // all — not a stub, an absent property — so this guards the same gap
    // `lib/__tests__/setup-env.ts` already works around elsewhere, rather
    // than adding a jsdom-only mock for one effect.
    if (typeof stageRef.current?.scrollIntoView === "function") {
      stageRef.current.scrollIntoView({ block: "start" });
    }
  }, [turn.currentIndex]);

  return (
    <div
      ref={stageRef}
      className={cn("relative touch-pan-y select-none [perspective:1200px]", className)}
      style={{ display: "grid" }}
      role="group"
      aria-label={ariaLabel}
      onPointerDown={turn.stageHandlers.onPointerDown}
      onPointerMove={turn.stageHandlers.onPointerMove}
      onPointerUp={turn.stageHandlers.onPointerUp}
      onPointerCancel={turn.stageHandlers.onPointerCancel}
    >
      {leaves.map((leaf, index) => {
        const { pose, transition } = turn.poseFor(index);
        const wrapperStyle: CSSProperties = {
          gridArea: "1 / 1",
          position: "relative",
          zIndex: turn.zIndexFor(index),
          filter:
            pose.shadow > 0.004
              ? `drop-shadow(0 ${(12 * pose.shadow).toFixed(1)}px ${(16 * pose.shadow).toFixed(
                  1,
                )}px rgb(41 32 24 / ${(0.18 * pose.shadow).toFixed(3)}))`
              : "none",
          // `filter` only. `transform` lives on `flipStyle` below, and
          // its OWN `transition` must live there too — a `transition`
          // declared on an element that never carries the property it
          // names never fires `transitionend` for that property. That
          // mismatch (this element used to declare both `transform`
          // and `filter` in its transition while only ever setting
          // `filter`) is exactly what let `settling` (useBookTurn.ts)
          // wait forever for an event that could never arrive.
          transition: transition ? `filter ${SETTLE_MS}ms var(--ease-out)` : "none",
        };
        const flipStyle = {
          // Both faces must fill the grid cell exactly, not their own
          // natural content height: `transform` (below) makes this
          // element a containing block for the absolutely positioned
          // back face regardless of `position`, so the back face
          // already sizes to THIS element's box — but this element's
          // own box only stretches to match the grid cell's height
          // (see the file comment) if it, and the front face inside
          // it, both explicitly claim height: 100% rather than
          // shrink-to-fit their own content. Without this, a leaf
          // shorter than the tallest one in the stack would leave the
          // leaf behind it visible in the gap.
          height: "100%",
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: `translateY(${pose.translateY}px) rotateY(${pose.rotateY}deg)`,
          // Declared on the same element as `transform` above — see
          // `wrapperStyle.transition`'s comment. `onTransitionEnd`
          // below listens on this same element for the same reason:
          // it is the only element a real browser will ever fire a
          // `transform` `transitionend` on.
          transition: transition ? `transform ${SETTLE_MS}ms var(--ease-out)` : "none",
          "--leaf-sheen-opacity": pose.sheen,
        } as CSSProperties;

        return (
          <div key={index} data-leaf-index={index} style={wrapperStyle}>
            <div
              style={flipStyle}
              onTransitionEnd={(e) => {
                if (e.propertyName !== "transform") return;
                turn.onSettleTransitionEnd(index);
              }}
            >
              {/* Front face — the caller's own page. Normal flow: this
                  is what the grid cell actually measures. height:
                  100% so a caller's own `h-full` BookSheet (see
                  BookSheet.tsx) actually reaches a definite height to
                  fill, instead of resolving to `auto` against a
                  shrink-to-fit ancestor. */}
              <div style={{ height: "100%", backfaceVisibility: "hidden" }}>{leaf}</div>

              {/* Back face — plain bone paper, the endpaper treatment
                  `.cover-flap` already uses (BookObject.tsx), not a new
                  asset. Visible only once the leaf has rotated past
                  edge-on. */}
              <div
                aria-hidden="true"
                className="under-lamp"
                style={{
                  ...FACE_STYLE,
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderRadius: 2,
                  backgroundImage: "url(/materials/paper-bone-v2.png)",
                  backgroundSize: "cover",
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  style={{
                    background:
                      "linear-gradient(to left, rgb(41 32 24 / 0.18), rgb(41 32 24 / 0.04) 22%, rgb(41 32 24 / 0) 45%)",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface BookTurnControlsProps {
  turn: BookTurn;
  className?: string;
  /** Rendered in the same row, after the Prev/Next buttons — each
      caller's own caption or "close the book" affordance. */
  footer?: ReactNode;
}

/**
 * The WCAG 2.5.7 path: a real, single-pointer, keyboard-operable way
 * to turn the page that isn't the drag gesture. Not optional polish —
 * every caller of BookTurnStage renders this alongside it.
 */
export function BookTurnControls({ turn, className, footer }: BookTurnControlsProps) {
  return (
    <div className={cn("mt-1 flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={turn.prev}
          disabled={turn.isFirst}
          aria-label="Previous page"
          className="press flex h-11 w-11 items-center justify-center rounded-full text-mute disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={turn.next}
          disabled={turn.isLast}
          aria-label="Next page"
          className="press flex h-11 w-11 items-center justify-center rounded-full text-mute disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      {footer}
    </div>
  );
}
