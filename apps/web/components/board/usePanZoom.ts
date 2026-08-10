/**
 * usePanZoom — panning and pinch-zoom for the board surface.
 *
 * Ported from design-H.html:1518–1685, with three corrections:
 *
 *   1. Pan bounds are rebased off the VIEWPORT's own bounding rect, not the
 *      browser window — design-H:1528 documents the exact bug: inside a
 *      frame, getBoundingClientRect().top is measured from the browser window,
 *      not from the glass, and the pan floor is wrong by however far down the
 *      page the frame sits. `ribbonTop()` and `loc()` both apply this correction.
 *
 *   2. `user-scalable` and `maximum-scale` are NOT set anywhere in this hook.
 *      The board suppresses default touch behaviour on its own surface only
 *      (touch-action:none on the viewport element), never on <body>.
 *      Platform pinch-zoom continues to work — the board's own pinch is an
 *      ADDITION to it, not a replacement. (WCAG 1.4.4 / SC 1.4.4 Resize Text)
 *
 *   3. REDUCED (prefers-reduced-motion) kills every tween. The mock checks
 *      this in ten places; all ten are ported:
 *        - fitScale initial MIN (no tween on mount)
 *        - pan onDragEnd momentum throw duration → 0
 *        - zoomTo duration → 0
 *        - openOver/shutOver duration → 0 (handled by Table/overlay callers)
 *        - flip/faceUp duration → 0 (not in this hook, in deck callers)
 *        - layout animate=false guard → 0 (deck caller)
 *        - flash edge label → 0 (deck caller)
 *        - bookLayout → 0 (book caller)
 *        - animLeaf → 0 (book caller)
 *        - object pickup/release → 0 (usePickup)
 *
 * Coordinate system: surface is positioned at (x, y) in the viewport.
 * `scale` is the CSS transform scale applied to the surface.
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

// GSAP + Draggable are loaded dynamically so Next.js SSR never touches them.
// They are assigned once on mount and are stable thereafter.
let gsap: typeof import("gsap").gsap | null = null;
let Draggable: typeof import("gsap/Draggable").Draggable | null = null;

async function loadGsap() {
  if (gsap && Draggable) return;
  const [gsapMod, draggableMod] = await Promise.all([
    import("gsap"),
    import("gsap/Draggable"),
  ]);
  gsap = gsapMod.gsap;
  Draggable = draggableMod.Draggable;
  gsap.registerPlugin(Draggable);
}

/** 950 × 2860 — the world dimensions from design-H:1395 */
export const WORLD_W = 950;
export const WORLD_H = 2860;

const MAX_SCALE = 1.55;

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

/**
 * Returns the reduced-motion preference at the moment of the call.
 * Checked once per gesture/tween, not subscribed — matching design-H's `var REDUCED`.
 */
function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface UsePanZoomOptions {
  /**
   * Ref to the element that is the fixed chrome BELOW the table (the dock).
   * Its top edge defines the pan floor. When absent, the viewport bottom is used.
   * Rebased off the viewport's own rect (see note 1 above).
   */
  bottomChromeRef?: RefObject<HTMLElement | null>;
  /**
   * Called when the user double-taps. Receives the tap coordinates relative
   * to the viewport so the caller can decide whether to zoom to fit or to
   * zoom into the tap point.
   */
  onDoubleTap?: (x: number, y: number, currentScale: number, minScale: number) => void;
}

interface UsePanZoomReturn {
  /** Call once after mount to initialise GSAP Draggable. Returns a cleanup fn. */
  init: () => Promise<() => void>;
  /** Imperatively zoom to a scale, around a focus point in viewport coords. */
  zoomTo: (s: number, fx: number, fy: number, dur?: number) => void;
  /** Save and freeze current pan/scale. Used when an overlay opens. */
  freeze: () => { x: number; y: number; s: number };
  /** Restore a saved pan/scale. Used when an overlay closes. */
  thaw: (saved: { x: number; y: number; s: number }) => void;
}

export function usePanZoom(
  viewportRef: RefObject<HTMLElement | null>,
  surfaceRef: RefObject<HTMLElement | null>,
  options: UsePanZoomOptions = {},
): UsePanZoomReturn {
  const scaleRef = useRef(1);
  const minScaleRef = useRef(0.1);
  const panRef = useRef<InstanceType<typeof import("gsap/Draggable").Draggable> | null>(null);
  const { bottomChromeRef, onDoubleTap } = options;

  /**
   * The bottom of the pannable area, measured from the TOP of the viewport
   * element. This is the key rebase: inside any frame or positioned ancestor,
   * `getBoundingClientRect().top` is measured from the browser window; the
   * difference between the element's top and the viewport's top gives the
   * correct floor. (design-H:1527-1535)
   */
  const panFloor = useCallback((): number => {
    const vp = viewportRef.current;
    if (!vp) return window.innerHeight;
    const vpRect = vp.getBoundingClientRect();
    const chrome = bottomChromeRef?.current;
    if (!chrome) return vpRect.height;
    const chromeRect = chrome.getBoundingClientRect();
    // Rebase: chromeRect.top is from the browser window; vpRect.top too.
    // The floor in viewport-local coordinates is their difference.
    return Math.round(chromeRect.top - vpRect.top);
  }, [viewportRef, bottomChromeRef]);

  /**
   * A pointer event's position relative to the viewport element.
   * (design-H:1537-1540)
   */
  const loc = useCallback(
    (e: PointerEvent): { x: number; y: number } => {
      const vp = viewportRef.current;
      if (!vp) return { x: e.clientX, y: e.clientY };
      const r = vp.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    },
    [viewportRef],
  );

  const limits = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !gsap) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const scale = scaleRef.current;
    const vw = vp.clientWidth;
    const vh = panFloor();
    const w = WORLD_W * scale;
    const h = WORLD_H * scale;
    const cy = h <= vh ? (vh - h) / 2 + 44 : 0;
    return {
      minX: w <= vw ? (vw - w) / 2 : vw - w,
      maxX: w <= vw ? (vw - w) / 2 : 0,
      minY: h <= vh ? cy : vh - h,
      maxY: h <= vh ? cy : 0,
    };
  }, [viewportRef, panFloor]);

  const zoomTo = useCallback(
    (s: number, fx: number, fy: number, dur = 0.8) => {
      const srf = surfaceRef.current;
      if (!srf || !gsap) return;
      const pan = panRef.current;
      const minScale = minScaleRef.current;
      s = clamp(s, minScale, MAX_SCALE);
      const x = gsap.getProperty(srf, "x") as number;
      const y = gsap.getProperty(srf, "y") as number;
      const scale = scaleRef.current;
      const wx = (fx - x) / scale;
      const wy = (fy - y) / scale;
      scaleRef.current = s;
      const b = limits();
      // REDUCED check #3 (out of ten): zoom tween
      gsap.to(srf, {
        scale: s,
        x: clamp(fx - wx * s, b.minX, b.maxX),
        y: clamp(fy - wy * s, b.minY, b.maxY),
        duration: reduced() ? 0 : dur,
        ease: "power3.inOut",
        onComplete() {
          pan?.applyBounds(limits());
          pan?.update();
        },
      });
    },
    [surfaceRef, limits],
  );

  const freeze = useCallback(() => {
    const srf = surfaceRef.current;
    if (!srf || !gsap) return { x: 0, y: 0, s: 1 };
    panRef.current?.disable();
    return {
      x: gsap.getProperty(srf, "x") as number,
      y: gsap.getProperty(srf, "y") as number,
      s: scaleRef.current,
    };
  }, [surfaceRef]);

  const thaw = useCallback(
    (saved: { x: number; y: number; s: number }) => {
      const srf = surfaceRef.current;
      if (!srf || !gsap) return;
      scaleRef.current = saved.s;
      gsap.set(srf, { x: saved.x, y: saved.y, scale: saved.s });
      panRef.current?.enable();
      panRef.current?.applyBounds(limits());
      panRef.current?.update();
    },
    [surfaceRef, limits],
  );

  const init = useCallback(async () => {
    await loadGsap();
    const vp = viewportRef.current;
    const srf = surfaceRef.current;
    if (!vp || !srf || !gsap || !Draggable) return () => {};

    // Compute minimum scale (fit-to-viewport), matching design-H:1520
    // CHROME = 150 is the mock's own constant for the sum of fixed chrome
    // above and below. We derive it from the real viewport instead.
    const chrome = bottomChromeRef?.current;
    const chromeH = chrome
      ? vp.clientHeight - Math.round(chrome.getBoundingClientRect().top - vp.getBoundingClientRect().top)
      : 150;
    const MIN = Math.min(vp.clientWidth / WORLD_W, (vp.clientHeight - chromeH) / WORLD_H) * 0.96;
    minScaleRef.current = MIN;
    scaleRef.current = 1;

    // Initial position: x:-40, y:0 — design-H:1548
    gsap.set(srf, { x: -40, y: 0, scale: 1 });

    // Velocity tracking state (design-H:1550)
    let vx = 0, vy = 0, lastT = 0, lastX = 0, lastY = 0;

    const panInstances = Draggable.create(srf, {
      type: "x,y",
      allowNativeTouchScrolling: false,
      edgeResistance: 0.82,
      dragResistance: 0,
      bounds: limits(),
      onPressInit() {
        gsap!.killTweensOf(srf);
        this.update();
      },
      onDragStart() {
        vp.classList.add("board-panning");
        lastT = performance.now();
        lastX = this.x;
        lastY = this.y;
        vx = vy = 0;
      },
      onDrag() {
        const t = performance.now();
        const dt = Math.max(t - lastT, 10);
        vx = vx * 0.55 + ((this.x - lastX) / dt * 1000) * 0.45;
        vy = vy * 0.55 + ((this.y - lastY) / dt * 1000) * 0.45;
        lastT = t;
        lastX = this.x;
        lastY = this.y;
      },
      onDragEnd() {
        vp.classList.remove("board-panning");
        const b = limits();
        const pan = panRef.current;
        // REDUCED check #2 (out of ten): pan momentum throw
        gsap!.to(srf, {
          x: clamp(this.x + vx * 0.26, b.minX, b.maxX),
          y: clamp(this.y + vy * 0.26, b.minY, b.maxY),
          duration: reduced() ? 0 : 1.05,
          ease: "power3.out",
          onComplete() {
            pan?.update();
          },
        });
      },
    });

    panRef.current = panInstances[0] ?? null;

    // Pinch zoom state (design-H:1619)
    const pts = new Map<number, { x: number; y: number }>();
    let pinch: {
      d0: number; s0: number; x0: number; y0: number; cx: number; cy: number;
    } | null = null;
    let downX = 0, downY = 0, lastTap = 0, lastTapX = 0, lastTapY = 0;

    const onPointerDown = (e: PointerEvent) => {
      const q = loc(e);
      pts.set(e.pointerId, { x: q.x, y: q.y });
      downX = q.x;
      downY = q.y;
      if (pts.size === 2) {
        const a = Array.from(pts.values());
        panRef.current?.disable();
        const a0 = a[0]!, a1 = a[1]!;
        pinch = {
          d0: Math.hypot(a0.x - a1.x, a0.y - a1.y) || 1,
          s0: scaleRef.current,
          x0: gsap!.getProperty(srf, "x") as number,
          y0: gsap!.getProperty(srf, "y") as number,
          cx: (a0.x + a1.x) / 2,
          cy: (a0.y + a1.y) / 2,
        };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      const q = loc(e);
      pts.set(e.pointerId, { x: q.x, y: q.y });
      if (!pinch || pts.size < 2) return;
      const a = Array.from(pts.values());
      const a0 = a[0]!, a1 = a[1]!;
      const d = Math.hypot(a0.x - a1.x, a0.y - a1.y) || 1;
      const s = clamp(pinch.s0 * (d / pinch.d0), MIN, MAX_SCALE);
      const mx = (a0.x + a1.x) / 2;
      const my = (a0.y + a1.y) / 2;
      const wx = (pinch.cx - pinch.x0) / pinch.s0;
      const wy = (pinch.cy - pinch.y0) / pinch.s0;
      scaleRef.current = s;
      const b = limits();
      gsap!.set(srf, {
        scale: s,
        x: clamp(mx - wx * s, b.minX, b.maxX),
        y: clamp(my - wy * s, b.minY, b.maxY),
      });
    };

    const letGo = (e: PointerEvent) => {
      const q = loc(e);
      pts.delete(e.pointerId);
      if (pinch && pts.size < 2) {
        pinch = null;
        panRef.current?.enable();
        panRef.current?.applyBounds(limits());
        panRef.current?.update();
        lastTap = 0;
        return;
      }
      if (pts.size) return;
      if (Math.hypot(q.x - downX, q.y - downY) > 12) {
        lastTap = 0;
        return;
      }
      const t = performance.now();
      if (t - lastTap < 340 && Math.hypot(q.x - lastTapX, q.y - lastTapY) < 34) {
        lastTap = 0;
        // REDUCED check #4 (out of ten): double-tap zoom
        // The caller receives (x, y, currentScale, minScale) and decides the target.
        if (onDoubleTap) {
          onDoubleTap(q.x, q.y, scaleRef.current, MIN);
        } else {
          if (scaleRef.current > MIN + 0.02) {
            zoomTo(MIN, vp.clientWidth / 2, vp.clientHeight / 2, 0.8);
          } else {
            zoomTo(1, q.x, q.y, 0.8);
          }
        }
        return;
      }
      lastTap = t;
      lastTapX = q.x;
      lastTapY = q.y;
    };

    const onPointerCancel = (e: PointerEvent) => {
      pts.delete(e.pointerId);
    };

    // REDUCED check #5 (out of ten): ctrl+wheel zoom (no tween when REDUCED)
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const q = loc(e as unknown as PointerEvent);
      // dur=0 for wheel: immediate, no easing
      zoomTo(scaleRef.current * (1 - e.deltaY * 0.01), q.x, q.y, 0);
    };

    const onResize = () => {
      const newMIN = Math.min(vp.clientWidth / WORLD_W, (vp.clientHeight - chromeH) / WORLD_H) * 0.96;
      minScaleRef.current = newMIN;
      scaleRef.current = clamp(scaleRef.current, newMIN, MAX_SCALE);
      gsap!.set(srf, { scale: scaleRef.current });
      panRef.current?.applyBounds(limits());
      panRef.current?.update();
    };

    vp.addEventListener("pointerdown", onPointerDown, true);
    vp.addEventListener("pointermove", onPointerMove, true);
    vp.addEventListener("pointerup", letGo, true);
    vp.addEventListener("pointercancel", onPointerCancel, true);
    vp.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      vp.removeEventListener("pointerdown", onPointerDown, true);
      vp.removeEventListener("pointermove", onPointerMove, true);
      vp.removeEventListener("pointerup", letGo, true);
      vp.removeEventListener("pointercancel", onPointerCancel, true);
      vp.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      panRef.current?.kill();
      panRef.current = null;
    };
  }, [viewportRef, surfaceRef, bottomChromeRef, limits, loc, zoomTo, onDoubleTap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      panRef.current?.kill();
    };
  }, []);

  return { init, zoomTo, freeze, thaw };
}
