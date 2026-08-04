"use client";

import Image from "next/image";

/**
 * THE SIGNATURE COMPONENT.
 *
 * The physical boundary between the scrapbook world (paper, warmth,
 * daylight) and the DECO city world (night sky, gold windows, the city).
 * This is not a divider. It is not a section break. It is one continuous
 * space — the paper ends physically, in real torn fibre, and the night
 * begins on the other side of that edge.
 *
 * Structure:
 *   ┌─────────────────────────────────┐
 *   │  paper surface (above this)     │
 *   ├─ torn-edge-coldpress.png ────── │ ← composited PNG, not CSS
 *   │  gradient falloff               │
 *   │  ↓ into --night-sky             │
 *   └─────────────────────────────────┘
 *
 * The torn-edge PNG is composited as a real <Image>. Never simulate
 * the torn edge in CSS — no box-shadow, clip-path, SVG filter, or
 * background-image gradient approximation. Drawing the tear in CSS
 * is precisely the "coal" the founder rejected in the probe. The
 * material must be the material.
 *
 * The concern logged during design: in day mode, --night-sky is
 * undefined in :root, so the gradient's bottom stop has no colour.
 * Resolution: the Seam is only ever mounted in [data-mode="night"]
 * context (Today's night face). It must not appear on day surfaces.
 * If you are adding Seam to a surface that renders in day mode,
 * that is a composition error — flag it rather than adding a day
 * colour fallback that would break the continuity law.
 */

export interface SeamProps {
  /**
   * Total height of the seam zone in pixels.
   * The torn-fibre PNG occupies the top 32px; the remainder is the
   * gradient falloff into --night-sky.
   * @default 80
   */
  height?: number;
  className?: string;
}

/** Height of the torn-edge image strip (the actual fiber zone). */
const FIBER_HEIGHT = 32;

export function Seam({ height = 80, className }: SeamProps) {
  const falloffHeight = height - FIBER_HEIGHT;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        overflow: "hidden",
      }}
    >
      {/*
       * The torn fibre edge — the actual physical end of the paper.
       * This PNG has real alpha: the torn fibre feathers into
       * transparency so the transition is a genuine material edge,
       * not a masked rectangle.
       *
       * object-fit: cover keeps it full-width at the specified
       * height without distorting the fibre detail.
       */}
      <Image
        src="/materials/torn-edge-coldpress.webp"
        alt=""
        fill={false}
        width={1170}
        height={FIBER_HEIGHT}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${FIBER_HEIGHT}px`,
          objectFit: "cover",
          objectPosition: "top",
          display: "block",
        }}
        priority
      />

      {/*
       * The falloff gradient — light dying into the night sky.
       * Starts transparent (matching the paper above) and falls
       * into --night-sky (#0d1220). One continuous space.
       *
       * Only render if there is room for a falloff zone.
       * A seam that is exactly FIBER_HEIGHT tall is fibre only.
       */}
      {falloffHeight > 0 && (
        <div
          style={{
            position: "absolute",
            top: `${FIBER_HEIGHT}px`,
            left: 0,
            right: 0,
            height: `${falloffHeight}px`,
            background:
              "linear-gradient(to bottom, transparent 0%, var(--night-sky) 100%)",
          }}
        />
      )}
    </div>
  );
}
