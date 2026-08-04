"use client";

import { ReactNode, CSSProperties } from "react";
import Image from "next/image";

/**
 * Washi tape composite wrapper.
 *
 * Places a washi tape strip over an object, bridging it to the surface.
 * The tape PNG is composited as a real <Image> — it is never drawn in CSS.
 * Drawing tape as a gradient or background-image is precisely the "coal"
 * the founder rejected in the probe: every physical object must arrive
 * as a generated material, not a CSS approximation of one.
 *
 * Translucency: the tape PNGs are semi-transparent (65–75%) by their
 * asset. Do not set opacity on the img element — the translucency comes
 * from the PNG's own alpha, which varies naturally across the tape body.
 * A flat CSS opacity is uniform; real washi tape is not.
 *
 * The asset map covers what is currently on disk. As the full 12-variant
 * set is generated and downloaded, add the paths to TAPE_ASSETS without
 * changing the API. Variants with no asset render children unwrapped
 * rather than breaking.
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
   * Which of the 12 washi tape variants to composite.
   * Currently available: 'houndstooth' (washi-ochre-dots.png),
   * 'kraft' (washi-terracotta.png). Others render children unwrapped.
   */
  variant: TapeVariant;
  /** Which edge of the child element the tape bridges. */
  placement: TapePlacement;
  /**
   * Tape rotation in degrees. Default: 0° (perpendicular to bridged edge).
   * Caller should pass a seeded value ±5° from a Mounted-level PRNG.
   * Tape bridges objects — it reads as placed with intent, not dropped,
   * so larger rotations look wrong.
   */
  angle?: number;
  children: ReactNode;
  className?: string;
}

/** Asset registry. Extend as new tape variants arrive from generation. */
const TAPE_ASSETS: Partial<Record<TapeVariant, string>> = {
  houndstooth: "/materials/washi-ochre-dots.webp",
  kraft: "/materials/washi-terracotta.webp",
};

/** How the tape strip is positioned per placement edge. */
const TAPE_POSITION: Record<
  TapePlacement,
  { top?: string; bottom?: string; left?: string; right?: string; width?: string; height?: string; transformOrigin: string }
> = {
  top: {
    top: "-14px",
    left: "50%",
    width: "80px",
    height: "28px",
    transformOrigin: "center center",
  },
  "top-left": {
    top: "-14px",
    left: "12px",
    width: "72px",
    height: "28px",
    transformOrigin: "center center",
  },
  "top-right": {
    top: "-14px",
    right: "12px",
    width: "72px",
    height: "28px",
    transformOrigin: "center center",
  },
  bottom: {
    bottom: "-14px",
    left: "50%",
    width: "80px",
    height: "28px",
    transformOrigin: "center center",
  },
  left: {
    top: "50%",
    left: "-14px",
    width: "28px",
    height: "72px",
    transformOrigin: "center center",
  },
  right: {
    top: "50%",
    right: "-14px",
    width: "28px",
    height: "72px",
    transformOrigin: "center center",
  },
};

export function Taped({
  variant,
  placement,
  angle = 0,
  children,
  className,
}: TapedProps) {
  const src = TAPE_ASSETS[variant];
  const pos = TAPE_POSITION[placement];

  /* Variant with no asset yet — render children unwrapped. */
  if (!src) {
    return <div className={className}>{children}</div>;
  }

  const tapeStyle: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 50,
    transform: `rotate(${angle}deg) ${placement === "top" || placement === "bottom" ? "translateX(-50%)" : placement === "left" || placement === "right" ? "translateY(-50%)" : ""}`,
    ...pos,
  };

  return (
    <div className={className} style={{ position: "relative" }}>
      {children}
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill={false}
        width={parseInt(pos.width ?? "80")}
        height={parseInt(pos.height ?? "28")}
        style={tapeStyle}
        /* NO opacity override — the PNG's natural translucency is the
           translucency. Flat CSS opacity is uniform; real washi is not. */
      />
    </div>
  );
}
