/**
 * Table — the pannable, zoomable walnut surface.
 *
 * Renders the three nested boxes from design-H:
 *   #viewport  — fixed glass, touch-action:none, pointer event home
 *   #surface   — the 950×2860 world, GSAP-transformed
 *   #world     — absolute children (grain, objects)
 *
 * T1 carries design-H's hard-coded objects so the "indistinguishable from
 * the mock" comparison is honest before real data arrives. T2 will replace
 * those children with computed placements; the Table shell is intentionally
 * data-agnostic.
 *
 * z-index contract enforced here:
 *   0   surface::before (light gradients — CSS)
 *   2   .board-grain (film grain — CSS)
 *   10+ .board-obj (all objects)
 *
 * grain-z-order.test.tsx asserts this contract with a mutation test.
 *
 * WCAG 1.4.4 — user-scalable is never set by this component. The board's
 * pinch is an addition to platform zoom, not a replacement for it. The
 * viewport meta in app/layout.tsx already passes SC 1.4.4 and this
 * component does not touch it.
 */

"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

import { usePanZoom } from "./usePanZoom";
import { usePickup } from "./usePickup";
import "./board.css";

interface TableProps {
  /**
   * Ref to the element whose top edge defines the pan floor (the dock).
   * When absent, the viewport bottom is used.
   */
  bottomChromeRef?: RefObject<HTMLElement | null>;
  /** Called when a photo object is clicked. */
  onPhotoClick?: (photoKey: string) => void;
  /** Called when the tome (book cover) is clicked. */
  onTomeClick?: () => void;
  /** Called when a day stack is clicked. */
  onStackClick?: (dayKey: string) => void;
  /**
   * The objects and furniture to render on the surface.
   * In T1 these are the hardcoded design-H objects.
   * In T3+ they will be computed from the database.
   */
  children: ReactNode;
}

export function Table({
  bottomChromeRef,
  onPhotoClick,
  onTomeClick,
  onStackClick,
  children,
}: TableProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const { init: initPanZoom, zoomTo } = usePanZoom(viewportRef, surfaceRef, {
    bottomChromeRef,
    onDoubleTap(x, y, currentScale, minScale) {
      if (currentScale > minScale + 0.02) {
        const vp = viewportRef.current;
        zoomTo(minScale, vp ? vp.clientWidth / 2 : x, vp ? vp.clientHeight / 2 : y, 0.8);
      } else {
        zoomTo(1, x, y, 0.8);
      }
    },
  });

  const { init: initPickup } = usePickup({
    onPhotoClick,
    onTomeClick,
    onStackClick,
  });

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let pickupCleanup: (() => void) | undefined;

    (async () => {
      cleanup = await initPanZoom();

      // Collect all .board-pickup elements from the world
      const world = worldRef.current;
      if (world && surfaceRef.current) {
        const pickupEls = Array.from(
          world.querySelectorAll<HTMLElement>(".board-pickup"),
        );
        pickupCleanup = await initPickup(pickupEls, surfaceRef.current);
      }
    })();

    return () => {
      cleanup?.();
      pickupCleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="board-root" style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* The viewport: the fixed glass the table sits behind */}
      <div ref={viewportRef} className="board-viewport">
        {/* The surface: 950×2860, GSAP-transformed */}
        <div ref={surfaceRef} className="board-surface">
          {/* The world: all objects and grain */}
          <div ref={worldRef} className="board-world">
            {/*
             * Film grain — z-index:2, mix-blend-mode:overlay, top:1150px.
             * Objects are z-index:10+, so grain paints UNDER every photograph.
             * Moving this above z-index:10 would make it an overlay blend on
             * photographs — an illegal treatment, invisible in a diff.
             * grain-z-order.test.tsx traps this mutation.
             */}
            <div className="board-grain" aria-hidden="true" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
