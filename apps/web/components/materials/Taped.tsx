import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Washi tape composite wrapper.
 *
 * Places a washi tape strip across an edge of an object, fastening it
 * to the surface. The strip is the real generated asset composited as
 * an <img> — never drawn in CSS. A gradient pretending to be tape is
 * precisely the "made with coal" failure the founder rejected.
 *
 * ORIENTATION. §4: tape sits perpendicular to the edge it bridges —
 * it crosses the edge, half on the object, half on the surface, the
 * way a strip actually fastens. `angle` is the seeded deviation from
 * that perpendicular (±5° per the composition law; the caller seeds
 * it, usually from the same stable ID as the surrounding <Mounted>).
 * Corner placements run diagonally across the corner at 45°, the
 * classic scrapbook fastening.
 *
 * Both available assets are horizontal strips; vertical and diagonal
 * placements rotate the strip rather than distorting its box, so the
 * pattern never stretches. Display sizes derive from each asset's own
 * aspect ratio.
 *
 * Variants without an asset yet render their children in the same
 * wrapper with no strip — never a broken img. As the 12-pattern set
 * arrives, extend TAPE_ASSETS without changing the API.
 */

export type TapeVariant =
  | "stripe-cream"
  | "stripe-sage"
  | "stripe-blush"
  | "houndstooth"
  | "chevron"
  | "kraft"
  | "floral-pressed"
  | "floral-blue"
  | "botanical-leaf"
  | "botanical-branch"
  | "field-sage"
  | "scallop";

export type TapePlacement =
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "left"
  | "right";

export interface TapedProps {
  /**
   * Which of the 12 washi patterns to composite.
   * Currently available: 'houndstooth' (washi-ochre-dots),
   * 'kraft' (washi-terracotta). Others render children with no strip.
   */
  variant: TapeVariant;
  /** Which edge (or corner) of the child the tape bridges. */
  placement: TapePlacement;
  /**
   * Seeded deviation in degrees from perpendicular-to-the-edge.
   * §4 allows ±5°; pass a value seeded from the item's stable ID.
   * @default 0
   */
  angle?: number;
  children: ReactNode;
  className?: string;
}

interface TapeAsset {
  src: string;
  /** Display size at the strip's own aspect ratio — never distorted. */
  width: number;
  height: number;
}

/** Asset registry. Sizes follow each source's aspect (1024×240, 1024×336). */
const TAPE_ASSETS: Partial<Record<TapeVariant, TapeAsset>> = {
  houndstooth: { src: "/materials/washi-ochre-dots.webp", width: 84, height: 20 },
  kraft: { src: "/materials/washi-terracotta.webp", width: 84, height: 28 },
};

/**
 * Where the strip's centre sits, and its base rotation.
 * Base 90° = the horizontal strip stood upright, crossing a horizontal
 * edge; 0° crosses a vertical edge; ±45° lies across a corner.
 */
const PLACEMENTS: Record<TapePlacement, { left: string; top: string; base: number }> = {
  top: { left: "50%", top: "0%", base: 90 },
  "top-left": { left: "0%", top: "0%", base: -45 },
  "top-right": { left: "100%", top: "0%", base: 45 },
  bottom: { left: "50%", top: "100%", base: 90 },
  left: { left: "0%", top: "50%", base: 0 },
  right: { left: "100%", top: "50%", base: 0 },
};

export function Taped({
  variant,
  placement,
  angle = 0,
  children,
  className,
}: TapedProps) {
  const asset = TAPE_ASSETS[variant];
  const pos = PLACEMENTS[placement];

  return (
    <div className={cn("relative", className)} style={{ isolation: "isolate" }}>
      {children}
      {asset && (
        /* eslint-disable-next-line @next/next/no-img-element -- keyed
           material composite; must keep its own alpha untouched. */
        <img
          src={asset.src}
          alt=""
          aria-hidden="true"
          width={asset.width}
          height={asset.height}
          style={{
            position: "absolute",
            left: pos.left,
            top: pos.top,
            width: asset.width,
            height: asset.height,
            maxWidth: "none",
            /* Centre the strip on the anchor point, then rotate about
               that point. Translate first: the rotation must happen
               around the already-placed centre. */
            transform: `translate(-50%, -50%) rotate(${pos.base + angle}deg)`,
            /* Tape fastens: it renders above whatever it holds, above
               even a Mounted elevation-4 photograph (z 40). Local to
               this wrapper — the wrapper isolates. */
            zIndex: 50,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
