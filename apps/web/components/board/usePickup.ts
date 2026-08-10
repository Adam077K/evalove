/**
 * usePickup — GSAP Draggable for objects on the board surface.
 *
 * Ported from design-H.html:1573-1602 (object pickup) and extended.
 *
 * Rules:
 *   - Object picks up with a slight scale increase and tilt toward level.
 *   - Object drops with an elastic return to its rest rotation.
 *   - `REDUCED` kills every tween (design-H REDUCED checks #6 and #7 of ten).
 *   - Objects receive pointer events; the surface pan is suppressed on them
 *     via `e.stopPropagation()` on pointerdown (design-H:1601).
 *
 * The `topZ` counter starts at 40 (above stacks at z-index 10, instruments
 * at z-index 24, tape at z-index 30) and increments on each pickup. This
 * matches design-H's `var topZ = 40` at line 1574.
 */

"use client";

import { useCallback, useEffect, useRef } from "react";

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

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Stored per-element so the Draggable cleanup can find them. */
const restRotations = new WeakMap<Element, number>();

interface UsePickupOptions {
  /** Called when a photo object is clicked (not dragged). */
  onPhotoClick?: (photoKey: string) => void;
  /** Called when the tome (closed book) is clicked. */
  onTomeClick?: () => void;
  /** Called when a stack is clicked. */
  onStackClick?: (dayKey: string) => void;
}

interface UsePickupReturn {
  /**
   * Call after mount with an array of pickup elements.
   * Returns a cleanup function.
   */
  init: (elements: HTMLElement[], surfaceEl: HTMLElement) => Promise<() => void>;
}

export function usePickup(options: UsePickupOptions = {}): UsePickupReturn {
  const topZRef = useRef(40);
  const { onPhotoClick, onTomeClick, onStackClick } = options;
  const draggablesRef = useRef<Array<InstanceType<typeof import("gsap/Draggable").Draggable>>>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      draggablesRef.current.forEach((d) => d.kill());
      draggablesRef.current = [];
    };
  }, []);

  const init = useCallback(
    async (elements: HTMLElement[], surfaceEl: HTMLElement) => {
      await loadGsap();
      if (!gsap || !Draggable) return () => {};

      // Store rest rotation from data-rot attribute
      elements.forEach((el) => {
        const r = parseFloat(el.getAttribute("data-rot") ?? "0") || 0;
        restRotations.set(el, r);
        gsap!.set(el, { rotation: r, transformOrigin: "50% 50%" });
      });

      // Prevent picked-up objects from triggering the pan
      const stopPropagation = (e: Event) => e.stopPropagation();
      elements.forEach((el) => {
        el.addEventListener("pointerdown", stopPropagation);
      });

      const instances = Draggable.create(elements, {
        type: "x,y",
        bounds: surfaceEl,
        dragClickables: false,
        allowNativeTouchScrolling: false,
        minimumMovement: 5,
        onPress() {
          const el = this.target as HTMLElement;
          el.style.zIndex = String(++topZRef.current);
          el.classList.add("board-held");
          const r = restRotations.get(el) ?? 0;
          if (reduced()) return;
          // REDUCED check #6 (out of ten): object pickup tween
          gsap!.to(el, {
            scale: 1.055,
            rotation: r * 0.6,
            duration: 0.24,
            ease: "power2.out",
            overwrite: "auto",
          });
        },
        onRelease() {
          const el = this.target as HTMLElement;
          el.classList.remove("board-held");
          const r = restRotations.get(el) ?? 0;
          if (reduced()) {
            // REDUCED check #7 (out of ten): object drop tween
            gsap!.set(el, { scale: 1, rotation: r });
            return;
          }
          gsap!.to(el, {
            scale: 1,
            rotation: r,
            duration: 0.62,
            ease: "elastic.out(1, 0.62)",
            overwrite: "auto",
          });
        },
        onClick() {
          const el = this.target as HTMLElement;
          if (el.id === "board-tome") {
            onTomeClick?.();
            return;
          }
          const photoKey = el.getAttribute("data-photo");
          if (photoKey) {
            onPhotoClick?.(photoKey);
            return;
          }
          const dayKey = el.getAttribute("data-day");
          if (dayKey) {
            onStackClick?.(dayKey);
          }
        },
      });

      draggablesRef.current = instances;

      return () => {
        elements.forEach((el) => {
          el.removeEventListener("pointerdown", stopPropagation);
        });
        instances.forEach((d) => d.kill());
        draggablesRef.current = [];
      };
    },
    [onPhotoClick, onTomeClick, onStackClick],
  );

  return { init };
}
