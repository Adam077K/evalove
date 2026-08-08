"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { leafTurnPose, posesEqual, type LeafTurnPose } from "./turn";

/**
 * The spine-hinged turn's interaction state machine — the thumb (or a
 * tap, or a keyboard Enter) driving `turn.ts`'s pure pose math.
 *
 * Distance in CSS px a full drag needs to cover to complete a turn.
 * Deliberately independent of the stage's actual rendered width —
 * the same feel on a thin phone and a wide one, and no layout
 * measurement in the pointermove hot path. Shorter than
 * BOARD_WIDTH_PX (280, BookCover.tsx) so a comfortable swipe, not a
 * full board-width drag, completes it.
 */
const TURN_DISTANCE_PX = 220;

/** Settle duration, ms. Inline transition strings can't read a CSS
    custom property, so this lives here rather than pulling from
    --dur-2 (globals.css). 300ms is intentionally longer than the
    220ms --dur-2 UI cadence: a page turn carries more mass than a
    button state change. The easing curve's deceleration at the far
    end conveys resistance and landing weight; at 220ms that tail
    was too short to read. The fallback timer below adds
    SETTLE_FALLBACK_SLACK_MS on top, so a legitimate transition
    always resolves first. */
export const SETTLE_MS = 300;

/** Fallback margin, ms, above SETTLE_MS before an unresolved settle
    is forced closed — see the `useEffect` in useBookTurn below.
    `transitionend` is not guaranteed: a backgrounded tab throttles
    rAF/transitions, a leaf can unmount mid-settle, and some browsers
    coalesce rapid transitions. `settling` has exactly one other exit
    (`onSettleTransitionEnd`), so a dropped event would otherwise wedge
    Next/Prev/drag shut for the rest of the session. Generous enough
    that a normal transition always resolves first; tight enough that
    a stalled settle recovers well within one interaction. */
const SETTLE_FALLBACK_SLACK_MS = 150;

/** Past this fraction of the arc, releasing commits the turn. */
const COMMIT_PROGRESS = 0.4;
/** px/ms — a fast flick commits the turn even short of COMMIT_PROGRESS. */
const COMMIT_VELOCITY = 0.5;
/** The rubber-band ceiling at the first/last leaf: dragging past the
    end of the book gives a little, then always springs back — a
    boundary drag never commits, because there is nothing to turn
    to. */
const BOUNDARY_DAMP_MAX = 0.18;
/** Below this many px of movement, a pointer-down is a tap on the
    page's own content, not a turn gesture. */
const DRAG_THRESHOLD_PX = 8;

type Direction = 1 | -1;

interface LiveDrag {
  pointerId: number;
  index: number;
  direction: Direction;
  boundary: boolean;
  startX: number;
  startT: number;
  lastX: number;
  lastT: number;
  progress: number;
  started: boolean;
}

interface Settling {
  index: number;
  target: 0 | 1;
  commits: boolean;
}

export interface BookTurnPoseEntry {
  pose: LeafTurnPose;
  /** Ease this leaf's transform/filter rather than track a live
      input 1:1 — true only while a released turn is settling toward
      its target (or a control-triggered turn is running). */
  transition: boolean;
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clampIndex(index: number, leafCount: number): number {
  return Math.min(Math.max(index, 0), Math.max(leafCount - 1, 0));
}

export interface UseBookTurnOptions {
  /** The velocity clock. Defaults to `Date.now` — overridable so
      tests can drive elapsed time deterministically without mocking
      the process-global `Date` (which, unlike this, isn't scoped to
      one test file and can bleed into whatever else is running
      concurrently in the same worker). */
  now?: () => number;
}

export function useBookTurn(leafCount: number, { now = Date.now }: UseBookTurnOptions = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [live, setLive] = useState<{ index: number; progress: number } | null>(null);
  const [settling, setSettling] = useState<Settling | null>(null);
  const dragRef = useRef<LiveDrag | null>(null);

  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= leafCount - 1;

  const commitInstant = useCallback(
    (direction: Direction) => {
      setCurrentIndex((i) => clampIndex(i + direction, leafCount));
    },
    [leafCount],
  );

  /** Buttons and Escape-adjacent controls — always a full turn, never
      a partial drag. Reduced motion jumps straight to the settled
      phase (BookObject.tsx's own `reduced()` pattern for the cover):
      an `onTransitionEnd` that will never fire, because no
      transition ever ran, must not be what anything waits for. */
  const next = useCallback(() => {
    if (isLast || settling) return;
    if (reducedMotion()) {
      commitInstant(1);
      return;
    }
    setSettling({ index: currentIndex, target: 1, commits: true });
  }, [isLast, settling, commitInstant, currentIndex]);

  const prev = useCallback(() => {
    if (isFirst || settling) return;
    if (reducedMotion()) {
      commitInstant(-1);
      return;
    }
    setSettling({ index: currentIndex - 1, target: 0, commits: true });
  }, [isFirst, settling, commitInstant, currentIndex]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (settling) return; // let the in-flight settle resolve before a new gesture starts
      // Only the primary pointer, and only a mouse's primary (left)
      // button — a right-click drag must not start a turn. A second
      // finger's pointerdown (a non-primary touch, or a primary touch
      // arriving while an untouched-but-already-`started` drag is
      // live — e.g. a stray primary reassignment mid-gesture) must
      // not overwrite `dragRef.current`: that would orphan the first
      // finger's drag with no release path, since only the pointerId
      // that owns `dragRef.current` is ever released.
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (dragRef.current?.started) return;
      dragRef.current = {
        pointerId: e.pointerId,
        index: -1,
        direction: 1,
        boundary: false,
        startX: e.clientX,
        // `now()`, not e.timeStamp: PointerEvent's timeStamp is a
        // read-only creation-time field a test harness can't drive
        // through fireEvent's init dict, and this is the only value
        // in the drag session that needs a clock at all.
        startT: now(),
        lastX: e.clientX,
        lastT: now(),
        progress: 0,
        started: false,
      };
    },
    [settling, now],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const deltaX = e.clientX - drag.startX;

      if (!drag.started) {
        if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
        const direction: Direction = deltaX < 0 ? 1 : -1;
        const index = direction === 1 ? currentIndex : currentIndex - 1;
        if (index < 0 || index > leafCount - 1) {
          // Nothing to turn — day one with no leaves, or a stray
          // gesture past the end. Leave it inert rather than fake a
          // page that doesn't exist.
          dragRef.current = null;
          return;
        }
        drag.started = true;
        drag.direction = direction;
        drag.index = index;
        drag.boundary = direction === 1 ? isLast : isFirst;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }

      drag.lastX = e.clientX;
      drag.lastT = now();

      let progress =
        drag.direction === 1
          ? Math.min(Math.max(-deltaX / TURN_DISTANCE_PX, 0), 1)
          : Math.min(Math.max(1 - deltaX / TURN_DISTANCE_PX, 0), 1);

      if (drag.boundary) {
        // Rubber-band: the drag is tracked (so it still feels alive
        // under the thumb) but never travels far enough to commit.
        progress =
          drag.direction === 1
            ? Math.min(progress, BOUNDARY_DAMP_MAX)
            : Math.max(progress, 1 - BOUNDARY_DAMP_MAX);
      }

      drag.progress = progress;
      if (!reducedMotion()) {
        setLive({ index: drag.index, progress });
      }
    },
    [currentIndex, isFirst, isLast, leafCount, now],
  );

  const releaseDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, kind: "up" | "cancel") => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (!drag.started) {
        setLive(null);
        return;
      }

      // A cancelled gesture (the platform took over — a system
      // gesture, another touch point) always springs back: it was
      // never a deliberate release, so it must never read as one.
      let commits = false;
      if (kind === "up") {
        const elapsed = Math.max(drag.lastT - drag.startT, 1);
        const velocity = Math.abs(drag.lastX - drag.startX) / elapsed; // px/ms
        const distanceCommits =
          drag.direction === 1 ? drag.progress >= COMMIT_PROGRESS : drag.progress <= 1 - COMMIT_PROGRESS;
        commits = !drag.boundary && (distanceCommits || velocity >= COMMIT_VELOCITY);
      }

      setLive(null);

      if (reducedMotion()) {
        if (commits) commitInstant(drag.direction);
        return;
      }

      const target: 0 | 1 = commits ? (drag.direction === 1 ? 1 : 0) : drag.direction === 1 ? 0 : 1;

      // A release can land exactly on the pose it is about to be told
      // to settle toward — dragged out and back to the origin
      // (progress clamps to the non-commit target), or dragged all the
      // way to the far end and released right there (progress clamps
      // to the commit target). Either way nothing would change on
      // screen, so no transition would start and no `transitionend`
      // would ever fire to clear `settling` — see posesEqual's own
      // comment in turn.ts. Resolve inline instead of entering
      // `settling`.
      if (posesEqual(leafTurnPose(drag.progress), leafTurnPose(target))) {
        if (commits) commitInstant(drag.direction);
        return;
      }

      setSettling({
        index: drag.index,
        target,
        commits,
      });
    },
    [commitInstant],
  );

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => releaseDrag(e, "up"), [releaseDrag]);
  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => releaseDrag(e, "cancel"),
    [releaseDrag],
  );

  /** Wired to the settling leaf's own `onTransitionEnd` (transform
      only — filter has its own transition on a different element,
      see BookTurnStage.tsx) and to the fallback timer below.
      Finalizes `currentIndex` exactly once, whichever of the two
      fires first: the functional `setSettling` update below reads
      `current` fresh each call, so a second call (real event after
      the timer already resolved it, or vice versa) sees `settling`
      already `null` and is a no-op. */
  const onSettleTransitionEnd = useCallback((index: number) => {
    setSettling((current) => {
      if (!current || current.index !== index) return current;
      if (current.commits) {
        setCurrentIndex(() => (current.target === 1 ? index + 1 : index));
      }
      return null;
    });
  }, []);

  /** Defensive fallback: forces any settle closed if its
      `transitionend` never arrives — a backgrounded tab, a leaf
      unmounted mid-settle, a coalesced transition. `settling` has
      exactly one other exit (the handler above), so a dropped event
      would otherwise wedge Next/Prev/drag shut for good. Re-arms
      whenever a new settle starts and clears on resolution (either
      path) or unmount; idempotent with the real event by construction
      (see the handler's own comment), so a race between the two never
      double-commits. Never fires on the reduced-motion path — that
      path commits through `commitInstant` directly and never sets
      `settling` in the first place. */
  useEffect(() => {
    if (!settling) return;
    const index = settling.index;
    const timer = window.setTimeout(() => {
      onSettleTransitionEnd(index);
    }, SETTLE_MS + SETTLE_FALLBACK_SLACK_MS);
    return () => window.clearTimeout(timer);
  }, [settling, onSettleTransitionEnd]);

  const poseFor = useCallback(
    (index: number): BookTurnPoseEntry => {
      if (live && live.index === index) {
        return { pose: leafTurnPose(live.progress), transition: false };
      }
      if (settling && settling.index === index) {
        return { pose: leafTurnPose(settling.target), transition: true };
      }
      return { pose: leafTurnPose(index < currentIndex ? 1 : 0), transition: false };
    },
    [live, settling, currentIndex],
  );

  const zIndexFor = useCallback(
    (index: number): number => {
      const REST_Z = 1000;
      if ((live && live.index === index) || (settling && settling.index === index)) {
        // Always topmost while it's the leaf actually moving —
        // covers both a forward turn (already normally on top) and a
        // backward turn (rising back above the current page).
        return REST_Z + leafCount + 10;
      }
      if (index === currentIndex) return REST_Z + leafCount;
      if (index > currentIndex) return REST_Z + leafCount - (index - currentIndex);
      return REST_Z + index;
    },
    [live, settling, currentIndex, leafCount],
  );

  return {
    currentIndex,
    isFirst,
    isLast,
    next,
    prev,
    poseFor,
    zIndexFor,
    onSettleTransitionEnd,
    stageHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
