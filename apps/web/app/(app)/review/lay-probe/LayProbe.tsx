"use client";

/* eslint-disable @next/next/no-img-element -- content photographs are
   fixture-resolved and under the `.photo` law: no filter, and the
   optimizer must never re-encode them. */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { Photo } from "@/lib/types";
import { PHOTOS } from "@/lib/fixtures/photos";
import { photoSrc } from "@/lib/fixtures/resolve";
import { seededIn } from "@/components/book/compose";
import { Paper } from "@/components/materials";
import { SHADOW, SPRING, mulberry32, seedFromId, toRotation } from "@/components/materials/Mounted";

/**
 * The take → lift → lay probe — Design-Lead's falsification build
 * (docs/04-features/specs/making-metaphor.md §12). Answers ONE
 * question: does laying a photograph on a page feel like making, in a
 * thumb? Nothing here is meant to survive past that answer.
 *
 * Built strictly from §1–§3 of the spec, "TAKE / THE BOOK SLIDES / LAY
 * only" per the dispatch brief. Everything the spec's §2 describes
 * beyond those three acts — TURN, FASTEN, WRITE, the free 0→332
 * cloth-drag once the book has already slid, a keyboard path — is
 * deliberately absent. So is persistence: reload and the pile is
 * three prints again.
 *
 * SCOPE DECISIONS, recorded rather than buried in code:
 *
 *   - TAKE only picks up a PILE photograph, never a laid one (the
 *     brief's own wording: "on a pile photograph"). Nothing here
 *     re-opens a placed print, so there is no return-to-pile path to
 *     build — every take that commits ends in exactly one lay.
 *   - The page renders at its full measured size (303×518, §1) but
 *     drop targets clamp to the working band only (y380–672 once
 *     slid) — the lower part of a real page a person could not yet
 *     reach in this probe. No vertical scroll is added to reach it;
 *     per §1 that is the thing being refused.
 *   - The pile's own "sweep" is not a second animation: it sits
 *     STATIC at its final y672–783 slot for the whole session. Before
 *     the first take, the page (top 48, height 518) ends its
 *     reachable band 332px above that slot, so there is bare table
 *     between them; the page's own +332px slide (the one animation
 *     this file owns for that act) closes the gap exactly onto the
 *     pile's fixed position. Two moving things reading as one meeting
 *     event, from one transform. Do not add a second one.
 *   - No rail. BookObject's real leaf-turn scroller (the thing §2's
 *     "lock the rail's overflow-x and scroll-snap" defends) is not
 *     built here — this probe has exactly one page and nothing to
 *     turn to. `touch-action: none` on the held element is what
 *     actually keeps iOS from claiming the gesture; that is not
 *     conditional on a rail existing.
 *   - No keyboard path, no ARIA drag alternative. The brief's own
 *     "Do NOT build" list excludes it, and the WCAG 2.5.7 gate belongs
 *     to the full wave's acceptance list (§9), not this falsification
 *     build. Flagged, not silently dropped.
 *
 * Reuse, not reinvention: SHADOW, SPRING and the seeded-PRNG trio are
 * imported from Mounted.tsx (now exported there, additively — see
 * that file) rather than copied, so the held-object shadow step and
 * the release spring are the literal same numbers Mounted uses
 * everywhere else, and the settle drift a laid photograph comes to
 * rest from is Mounted's own second PRNG draw for that id — the same
 * drift that photograph would carry if it were ever composed for
 * real. See `settleDrift` below for why only the second draw is used.
 *
 * REACH is instrumented, not just built to: §9 gate #1 says the region
 * under the held object stays within 495 CSS px of the pivot
 * (355,790) at every moment. A bare "it didn't feel right" from the
 * founder doesn't say whether the MODEL is wrong or the IMPLEMENTATION
 * drifted from the geometry it was built to — those are different
 * problems with different fixes. handleMove tracks the running
 * farthest-corner distance of the held object's box for the whole
 * gesture; layDown logs it once, on release, via console.debug — no
 * UI, nothing visible, nothing shipped, per team-lead/Design-Lead.
 *
 * RESPONSIVENESS FIX (2026-08-06) — founder verdict on phone AND web:
 * "in the edit mode it's very laggy… and it needs to actually work."
 * The gesture (take/lift/lay) was not rejected; the implementation
 * was. Two causes, both read directly in code, neither a per-frame
 * React state update nor a layout-triggering animated property (both
 * were already correct and stay that way):
 *
 *   1. A 250ms dead hold. The pile tile used to show almost no
 *      feedback until RISE_START_MS (120ms) fired a 2px rise — a
 *      quarter-second of near-total unresponsiveness on every single
 *      pickup. RISE_START_MS is gone: handleDown now starts that same
 *      rise at pointerdown itself (0ms; see the comment there), still
 *      eased over a CSS transition, so it is immediate AND continuous
 *      rather than a sudden jump. PRESS_MS (250ms) is UNCHANGED — it
 *      still gates commit, so the scroll-vs-pickup distinction
 *      SLOP_PX/PRESS_MS defend together is intact.
 *   2. An un-eased pop at commit. The held layer used to jump
 *      instantly to scale(1.05) rotate(HAND_ANGLE) with zero
 *      interpolation and hold there, unchanging, for the rest of the
 *      gesture. handleMove now eases scale/rotate/lift in from a
 *      neutral resting pose (scale 1, rotate 0, no lift) over
 *      LIFT_EASE_MS, computed from elapsed-time-since-commit INLINE in
 *      the same transform string that tracks the finger — see
 *      handleMove's own comment for why that computation cannot move
 *      to a CSS transition or a motion/react `animate`.
 */

// ---------------------------------------------------------------------
// Physical constants — docs/04-features/specs/making-metaphor.md §1–§3.
// Measured on integration/wave4 @ a6fbde6, 393×852. Do not re-derive.
// ---------------------------------------------------------------------

// PRESS_MS/LIFT_EASE_MS exported (additive) so a test can assert the
// timing directly rather than by eye — see __tests__/timing.test.ts.
export const PRESS_MS = 250; // the hold that tells a pickup apart from a
// scroll/tap — unchanged by the responsiveness fix below.
const SLOP_PX = 10;
const HAND_ANGLE = -3.5; // deg — fixed. It never squares up.
const BOOK_SLIDE_PX = 332;

// Responsiveness fix (see the file's top docblock). RISE_START_MS (a
// 120ms gate before the pile tile showed ANY feedback) is gone
// outright — handleDown starts the rise at pointerdown instead. These
// three replace the held layer's old instant, un-eased pop: handleMove
// eases scale/rotate/lift in from a neutral resting pose over
// LIFT_EASE_MS, computed inline from elapsed-time-since-commit.
export const LIFT_EASE_MS = 130; // matches the pile tile's own rise transition.
const HELD_SCALE = 1.05;
const HELD_LIFT_PX = 6; // the old fixed offset — now eased in, not instant.

// §9 gate #1 (REACH): the pivot is (355,790), the law is 495 CSS px.
// The working band below (PAGE_SLID_TOP..BAND_BOTTOM) satisfies it for
// the region a hand actually reaches to lay something; the band's own
// extreme top-left pixel, at full page width, sits a few mm past the
// circle — a pre-existing approximation in the spec's own measurement,
// not one this file introduces. Flagged in the return, not hidden.
// Instrumented at runtime (see reachDistance/maxReachRef) so a NO from
// the founder is interpretable: model wrong vs. implementation drifted.
const PIVOT = { x: 355, y: 790 };
const REACH_PX = 495;

// The open page, §1's measured rectangle, unchanged by the slide —
// only its own transform moves it.
const PAGE = { left: 45, top: 48, width: 303, height: 518 };
// The working band's top once slid (§2) — used for drop-clamping and
// for the percentage math in §7, NOT read back from the DOM: reading
// getBoundingClientRect() inside the same tick as the state update
// that triggers the slide would race the still-unrendered transform.
const PAGE_SLID_TOP = PAGE.top + BOOK_SLIDE_PX; // 380
const BAND_BOTTOM = 672; // the working band's bottom = the pile's top.
const PILE_TOP = 672;
const PILE_HEIGHT = 111; // bottom 783, §1's measured free table.
const PILE_BASE_LEFT = 190; // guarantees the third print bleeds past x393 (§2 "running off the right edge") across the whole 24–40px overlap range.

const TILE_W = 96; // §2 — the pile's own width.
const TILE_H = 128;
const PILE_CENTER_TOP = PILE_TOP + (PILE_HEIGHT - TILE_H) / 2;

const NEIGHBOR_RADIUS_PX = 90;
const NEIGHBOR_SHIFT_MIN = 3;
const NEIGHBOR_SHIFT_MAX = 5;
const NEIGHBOR_ROTATE_MAX = 1.5;

/** Three prints, not the real archive path — a probe fixture. */
const PILE_PHOTOS: Photo[] = [
  PHOTOS["seed-eva-1"],
  PHOTOS["seed-eva-2"],
  PHOTOS["seed-adam-1"],
];

/** Cubic ease-out, clamped to [0, 1]. */
function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * The held layer's eased scale/rotate/lift, as a pure function of
 * elapsed-time-since-commit — the fix for the un-eased pop at commit
 * (see the file's top docblock, cause #2). Returns numbers only;
 * handleMove (the one caller) writes them into its OWN transform
 * string, in the same assignment that tracks the finger 1:1, never
 * through a CSS transition or a motion/react `animate` — see
 * handleMove's own comment for why a competing animation system on
 * this node is exactly the hazard this file's docblock already warns
 * LaidPhotoView about, and why it applies here too. Exported so the
 * curve is a plain, testable function of time rather than something
 * only inspectable by eye.
 */
export function easedHeldPose(elapsedMs: number): { scale: number; rotate: number; lift: number } {
  const eased = easeOutCubic(elapsedMs / LIFT_EASE_MS);
  return {
    scale: 1 + (HELD_SCALE - 1) * eased,
    rotate: HAND_ANGLE * eased + 0, // `+ 0` folds -0 (eased=0, HAND_ANGLE<0) to 0.
    lift: HELD_LIFT_PX * eased,
  };
}

/**
 * The settle drift a laid photograph comes to rest from — Mounted's
 * OWN second PRNG draw for that id, not a second generator. Mounted
 * draws rotation first (from a ROTATION_RANGE this probe does not
 * use — a hand-laid print keeps the angle the hand gave it, fixed at
 * HAND_ANGLE, never re-rolled) and drift second; this replays the
 * same sequence and discards only the first draw, so the SAME
 * photograph draws the SAME drift here as it would in <Mounted
 * context="book-photo" settled={false}>.
 */
function settleDrift(id: string): number {
  const rand = mulberry32(seedFromId(id));
  rand(); // discard — Mounted's own first draw, a rotation this probe fixes instead.
  return toRotation(rand(), -2, 2);
}

/**
 * §9 gate #1 (REACH): distance from the thumb pivot to the FARTHEST
 * corner of the held object's box, at this instant — the whole
 * region under the object, not just its centre. Called every
 * pointermove while held; handleMove folds the result into a running
 * max for the gesture, which layDown logs once on release.
 */
function reachDistance(x: number, y: number, w: number, h: number): number {
  let max = 0;
  for (const cx of [x, x + w]) {
    for (const cy of [y, y + h]) {
      const d = Math.hypot(cx - PIVOT.x, cy - PIVOT.y);
      if (d > max) max = d;
    }
  }
  return max;
}

interface PileLayout {
  left: number;
  rotation: number;
}

/** Sequential, not independent: each tile's left depends on the one
    before it, so the seeded 24–40px overlap is real overlap, not a
    coincidence of independent draws. */
function buildPileLayout(photos: Photo[]): Map<string, PileLayout> {
  const layout = new Map<string, PileLayout>();
  let cursor = PILE_BASE_LEFT;
  photos.forEach((photo, i) => {
    if (i > 0) {
      const overlap = seededIn(`${photo.id}:pile-overlap`, 24, 40);
      cursor += TILE_W - overlap;
    }
    layout.set(photo.id, {
      left: cursor,
      rotation: seededIn(`${photo.id}:pile-rot`, -6, 6),
    });
  });
  return layout;
}

interface LaidPhoto {
  id: string;
  photo: Photo;
  xPct: number;
  yPct: number;
}

interface PressBook {
  photoId: string;
  startX: number;
  startY: number;
  commitTimer: number;
}

interface DragBook {
  photo: Photo;
  originLeft: number;
  originTop: number;
  startX: number;
  startY: number;
  commitTime: number; // performance.now() at commit — easedHeldPose's clock.
}

/** What the FIRST paint of the held layer needs — set once, at commit,
    never touched again by React (subsequent frames write straight to
    the DOM in handleMove). Deliberately in state, not just dragRef:
    react-hooks/refs forbids reading a ref's `.current` during render,
    and this is exactly the "read once at commit time" shape state is
    for — the per-frame tracking below still bypasses state entirely. */
interface HeldState {
  id: string;
  photo: Photo;
  originLeft: number;
  originTop: number;
}

export function LayProbe() {
  const [pile, setPile] = useState<Photo[]>(PILE_PHOTOS);
  const [laid, setLaid] = useState<LaidPhoto[]>([]);
  const [held, setHeld] = useState<HeldState | null>(null);
  const [risingId, setRisingId] = useState<string | null>(null);
  const [liftedOnce, setLiftedOnce] = useState(false);

  const pileLayout = useMemo(() => buildPileLayout(PILE_PHOTOS), []);

  const heldLayerRef = useRef<HTMLDivElement>(null);
  const laidRefs = useRef(new Map<string, HTMLDivElement>());
  const pressRef = useRef<PressBook | null>(null);
  const dragRef = useRef<DragBook | null>(null);
  const maxReachRef = useRef(0); // §9 gate #1 — running max for the current held gesture.

  const registerLaidRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) laidRefs.current.set(id, el);
    else laidRefs.current.delete(id);
  }, []);

  useEffect(
    () => () => {
      const p = pressRef.current;
      if (p) window.clearTimeout(p.commitTimer);
    },
    [],
  );

  const cancelPress = useCallback(() => {
    const p = pressRef.current;
    if (p) window.clearTimeout(p.commitTimer);
    pressRef.current = null;
    setRisingId(null); // eases straight back to rest — same CSS transition
    // that started the rise; no separate "cancel" animation needed.
  }, []);

  /* Commit — the 250ms mark. The object comes up into the hand: lift,
     rotate to the fixed hand angle, shadow deepens. Reading the pile
     tile's CURRENT rect (not its resting one) means the handoff to
     the fixed held layer inherits whatever the 2px pre-commit rise
     already did — no separate reconciliation needed. */
  const commit = useCallback((photo: Photo, el: HTMLElement, startX: number, startY: number) => {
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      photo,
      originLeft: rect.left,
      originTop: rect.top,
      startX,
      startY,
      commitTime: performance.now(), // easedHeldPose's t=0 — the resting pose.
    };
    maxReachRef.current = reachDistance(rect.left, rect.top - HELD_LIFT_PX, TILE_W, TILE_H);
    setRisingId(null);
    setLiftedOnce(true); // the first lift — the book/page gap starts closing.
    setHeld({ id: photo.id, photo, originLeft: rect.left, originTop: rect.top });
  }, []);

  /* Lay — release, wherever the hand is. Every committed take ends in
     exactly one lay (§ scope decision above): the drop point clamps
     into the working band, never cancels back to the pile. */
  const layDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const centerX = d.originLeft + dx + TILE_W / 2;
    const centerY = d.originTop + dy - HELD_LIFT_PX + TILE_H / 2;

    const bandLeft = PAGE.left;
    const bandRight = PAGE.left + PAGE.width;
    const clampedX = Math.min(Math.max(centerX, bandLeft), bandRight);
    const clampedY = Math.min(Math.max(centerY, PAGE_SLID_TOP), BAND_BOTTOM);

    // §7 — percentages of the FULL page box, never pixels, even
    // though the droppable region this probe offers is only its
    // upper working band.
    const xPct = ((clampedX - PAGE.left) / PAGE.width) * 100;
    const yPct = ((clampedY - PAGE_SLID_TOP) / PAGE.height) * 100;

    setLaid((prev) => [...prev, { id: d.photo.id, photo: d.photo, xPct, yPct }]);
    setPile((prev) => prev.filter((p) => p.id !== d.photo.id));

    // §9 gate #1 — logged once per gesture, on release. No UI, nothing
    // visible, nothing shipped: this is so a founder "no" is
    // interpretable (model wrong vs. implementation drifted), not a
    // shipped diagnostic.
    console.debug("[lay-probe] reach", {
      photoId: d.photo.id,
      maxReachPx: Math.round(maxReachRef.current),
      limitPx: REACH_PX,
      withinLaw: maxReachRef.current <= REACH_PX,
    });

    dragRef.current = null;
    setHeld(null);
  }, []);

  const handleDown = useCallback(
    (photo: Photo, e: ReactPointerEvent<HTMLDivElement>) => {
      if (pressRef.current || dragRef.current) return; // one hand.
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;

      // Immediate, not gated behind a 120ms timer: the print starts
      // lifting the instant the thumb lands (§ responsiveness fix,
      // top docblock, cause #1). The lift itself still eases in over
      // the pile tile's own CSS transition (130ms, unchanged below) —
      // immediate AND continuous, never a sudden jump. PRESS_MS still
      // gates commit, so a tap/scroll under 250ms never gets this far.
      setRisingId(photo.id);
      const commitTimer = window.setTimeout(
        () => commit(photo, el, startX, startY),
        PRESS_MS,
      );
      pressRef.current = { photoId: photo.id, startX, startY, commitTimer };
    },
    [commit],
  );

  const handleMove = useCallback(
    (photo: Photo, e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (d && held?.id === photo.id) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        const x = d.originLeft + dx; // never eased — tracks the finger 1:1.

        // The pop fix (§ responsiveness fix, top docblock, cause #2):
        // scale/rotate/lift eased from the resting pose, computed
        // right here from elapsed-time-since-commit and folded into
        // THIS SAME transform string alongside x/y. Deliberately not a
        // CSS transition: this string is rewritten on every
        // pointermove, and a transition would then be perpetually
        // chasing a moving target — visible LAG, the exact complaint
        // this fix answers. Deliberately not motion/react's `animate`
        // either: the file's own docblock (LaidPhotoView, below)
        // already explains why a competing animation on this node
        // stomps the tracked position back to origin — same hazard,
        // same fix, one node, one string.
        const elapsed = performance.now() - d.commitTime;
        const pose = easedHeldPose(elapsed);
        const y = d.originTop + dy - pose.lift;
        const layer = heldLayerRef.current;
        if (layer) {
          layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${pose.scale}) rotate(${pose.rotate}deg)`;
        }

        // §9 gate #1 — running max, cheap (no DOM read, reuses x/y
        // already computed above).
        const reach = reachDistance(x, y, TILE_W, TILE_H);
        if (reach > maxReachRef.current) maxReachRef.current = reach;

        // Neighbour shift — direct DOM writes only, no React state, so
        // this stays cheap at 60fps with up to two laid neighbours.
        const heldCenterX = x + TILE_W / 2;
        const heldCenterY = y + TILE_H / 2;
        for (const item of laid) {
          const node = laidRefs.current.get(item.id);
          if (!node) continue;
          const cx = PAGE.left + (item.xPct / 100) * PAGE.width;
          const cy = PAGE_SLID_TOP + (item.yPct / 100) * PAGE.height;
          const ddx = cx - heldCenterX;
          const ddy = cy - heldCenterY;
          const dist = Math.hypot(ddx, ddy);
          if (dist > 0.01 && dist < NEIGHBOR_RADIUS_PX) {
            const t = 1 - dist / NEIGHBOR_RADIUS_PX;
            const mag = NEIGHBOR_SHIFT_MIN + t * (NEIGHBOR_SHIFT_MAX - NEIGHBOR_SHIFT_MIN);
            const nx = (ddx / dist) * mag;
            const ny = (ddy / dist) * mag;
            const rot = Math.sign(nx || 1) * t * NEIGHBOR_ROTATE_MAX;
            node.style.transform = `translate(-50%, -50%) translate(${nx.toFixed(2)}px, ${ny.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
          } else {
            node.style.transform = "translate(-50%, -50%)";
          }
        }
        return;
      }

      const p = pressRef.current;
      if (!p || p.photoId !== photo.id) return;
      const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
      if (dist > SLOP_PX) cancelPress();
    },
    [held, laid, cancelPress],
  );

  const handleUp = useCallback(
    (photo: Photo, e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRef.current && held?.id === photo.id) {
        layDown(e);
        return;
      }
      cancelPress(); // < 250ms — back with no consequence.
    },
    [held, layDown, cancelPress],
  );

  const pageTranslateY = (liftedOnce ? BOOK_SLIDE_PX : 0) + (held ? -2 : 0);

  return (
    <div
      className="-mx-5 -mt-[max(1.5rem,env(safe-area-inset-top))] -mb-[calc(var(--dock-footprint)+4rem)] overflow-x-clip md:-mx-8"
      style={{ minHeight: "100dvh" }}
    >
      <Paper stock="coldpress" className="relative">
        <div className="relative isolate" style={{ minHeight: "100dvh" }}>
          {/* Dev-only orientation — never on a product surface. Placed
              off the measured geometry (§1 starts the page at y48) so
              it cannot shift the coordinates below. */}
          <p
            className="type-micro absolute left-5 top-3 text-mute"
            aria-hidden="true"
          >
            lay probe — press and hold a print
          </p>

          {/* ---- THE PAGE ---- */}
          <div
            className="absolute"
            style={{
              left: PAGE.left,
              top: PAGE.top,
              width: PAGE.width,
              height: PAGE.height,
              zIndex: 1,
              transform: `translateY(${pageTranslateY}px)`,
              transition: "transform 500ms var(--ease-io)",
            }}
          >
            <Paper
              stock="bone"
              className={`h-full rounded-[2px] border border-line transition-shadow duration-200 ${held ? "shadow-e3" : "shadow-e2"}`}
            >
              {laid.map((item) => (
                <LaidPhotoView key={item.id} item={item} registerRef={registerLaidRef} />
              ))}
            </Paper>
          </div>

          {/* ---- THE PILE — static; the page's own slide closes the
              gap onto it (see the file doc comment). ---- */}
          <div
            className="absolute left-0 right-0"
            style={{ top: PILE_CENTER_TOP, height: TILE_H, zIndex: 5 }}
            aria-hidden="true"
          >
            {pile.map((photo, i) => {
              const L = pileLayout.get(photo.id)!;
              const isHeld = held?.id === photo.id;
              const isRising = risingId === photo.id;
              return (
                <div
                  key={photo.id}
                  onPointerDown={(e) => handleDown(photo, e)}
                  onPointerMove={(e) => handleMove(photo, e)}
                  onPointerUp={(e) => handleUp(photo, e)}
                  onPointerCancel={(e) => handleUp(photo, e)}
                  className="absolute"
                  style={{
                    left: L.left,
                    top: 0,
                    width: TILE_W,
                    height: TILE_H,
                    zIndex: i + 1,
                    opacity: isHeld ? 0 : 1,
                    boxShadow: SHADOW[2],
                    // isRising flips at pointerdown itself (handleDown,
                    // 0ms) — this transition is what makes that flip
                    // read as a rise instead of a jump; it is the ONLY
                    // feedback for the first PRESS_MS, so it must never
                    // go back to being gated behind a timer.
                    transform: `rotate(${L.rotation}deg) translateY(${isRising ? -2 : 0}px)`,
                    transition: "transform 130ms var(--ease-out)",
                    touchAction: "none",
                    WebkitTouchCallout: "none",
                    userSelect: "none",
                  }}
                >
                  <img
                    src={photoSrc(photo)}
                    alt={photo.caption ?? "A loose photograph"}
                    draggable={false}
                    className="photo block h-full w-full object-cover object-top"
                    style={{ WebkitTouchCallout: "none", userSelect: "none" }}
                  />
                </div>
              );
            })}
          </div>

          {/* ---- THE HELD OBJECT — its own fixed layer, own
              compositor layer, tracks the finger 1:1. First paint
              reads `held` (render-safe state, set once at commit) and
              renders the NEUTRAL resting pose — scale 1, rotate 0, no
              lift, same position the pile tile was already at —
              because that first paint IS elapsed≈0 for easedHeldPose.
              Every frame after that, handleMove writes straight to
              this node's style — never through React again — easing
              scale/rotate/lift up to the full picked-up pose over
              LIFT_EASE_MS. See handleMove's own comment for why that
              computation lives there and not here. ---- */}
          {held && (
            <div
              ref={heldLayerRef}
              className="pointer-events-none"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: TILE_W,
                height: TILE_H,
                zIndex: 50,
                willChange: "transform",
                boxShadow: SHADOW[4],
                transform: `translate3d(${held.originLeft}px, ${held.originTop}px, 0) scale(1) rotate(0deg)`,
                WebkitTouchCallout: "none",
                userSelect: "none",
              }}
            >
              <img
                src={photoSrc(held.photo)}
                alt=""
                draggable={false}
                className="photo block h-full w-full object-cover object-top"
                style={{ WebkitTouchCallout: "none", userSelect: "none" }}
              />
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
}

/**
 * A laid photograph — outer wrapper owns position (percentage of the
 * page box, §7) and the live neighbour-shift transform, written
 * directly to this node's style by handleMove above. The inner
 * motion.div owns the settle spring exclusively: Mounted.tsx's own
 * comment on why these must be two different nodes — "on the
 * animated path, motion/react owns the transform property outright" —
 * applies here too; a rotate written to the outer div would fight it.
 *
 * memo'd so a sibling being laid (a `laid` array update elsewhere)
 * does not re-run this component's JSX and stomp the outer div's
 * imperative transform back to its base value.
 */
const LaidPhotoView = memo(function LaidPhotoView({
  item,
  registerRef,
}: {
  item: LaidPhoto;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const reduced = useReducedMotion();
  const drift = useMemo(() => settleDrift(item.photo.id), [item.photo.id]);
  const alt = item.photo.caption ?? "A laid photograph";

  return (
    <div
      ref={(el) => registerRef(item.id, el)}
      className="absolute"
      style={{
        left: `${item.xPct}%`,
        top: `${item.yPct}%`,
        width: TILE_W,
        height: TILE_H,
        zIndex: 20,
        transform: "translate(-50%, -50%)",
        transition: "transform var(--dur-2) var(--ease-out)",
      }}
    >
      {reduced ? (
        <div
          className="h-full w-full"
          style={{ boxShadow: SHADOW[4], transform: `rotate(${HAND_ANGLE}deg)` }}
        >
          <img
            src={photoSrc(item.photo)}
            alt={alt}
            draggable={false}
            className="photo block h-full w-full object-cover object-top"
            style={{ WebkitTouchCallout: "none", userSelect: "none" }}
          />
        </div>
      ) : (
        <motion.div
          className="h-full w-full"
          style={{ boxShadow: SHADOW[4] }}
          initial={{ scale: 1.05, y: -6, rotate: HAND_ANGLE + drift }}
          animate={{ scale: 1, y: 0, rotate: HAND_ANGLE }}
          transition={SPRING}
        >
          <img
            src={photoSrc(item.photo)}
            alt={alt}
            draggable={false}
            className="photo block h-full w-full object-cover object-top"
            style={{ WebkitTouchCallout: "none", userSelect: "none" }}
          />
        </motion.div>
      )}
    </div>
  );
});
