"use client";

import { ReactNode, CSSProperties } from "react";
import Image from "next/image";

/**
 * Pushpin composite wrapper.
 *
 * Places a pushpin PNG through the top edge of an object, fixing it
 * to the surface. The pushpin PNGs have contact shadows baked in —
 * do NOT add a CSS box-shadow on top of the image; the baked shadow
 * and a CSS shadow would compound to read as double.
 *
 * Eva's pushpin is brass. Adam's is cream. The pushpin variant carries
 * authorship without labelling it — you read who pinned something from
 * the object they used, not from a label.
 *
 * When an asset is absent (Adam's cream and neutral black are not yet
 * generated), the component renders children unwrapped rather than
 * broken. Never throw on a missing material.
 */

export type PinVariant = "eva" | "adam" | "neutral";
export type PinPlacement = "top-left" | "top-center" | "top-right";

export interface PinnedProps {
  /**
   * Eva's pin = brass (pushpin-brass-v2.png).
   * Adam's pin = cream (asset pending — renders children unwrapped).
   * Neutral = matte black (asset pending — renders children unwrapped).
   */
  variant: PinVariant;
  /** Where the pin penetrates the top edge of the child. */
  placement: PinPlacement;
  children: ReactNode;
  className?: string;
}

/** Asset registry. v2 is at a better angle (40° overhead) than v1. */
const PIN_ASSETS: Partial<Record<PinVariant, string>> = {
  eva: "/materials/pushpin-brass-v2.png",
  // adam: "/materials/pushpin-cream.png",   — pending generation
  // neutral: "/materials/pushpin-black.png", — pending generation
};

const PIN_SIZE = { width: 28, height: 28 };

/** Horizontal position per placement. Top edge is fixed at −12px overlap. */
const PIN_LEFT: Record<PinPlacement, CSSProperties> = {
  "top-left": { left: "16px", top: "-12px" },
  "top-center": { left: "50%", top: "-12px", transform: "translateX(-50%)" },
  "top-right": { right: "16px", top: "-12px" },
};

export function Pinned({ variant, placement, children, className }: PinnedProps) {
  const src = PIN_ASSETS[variant];

  /* No asset for this variant yet — render children unwrapped. */
  if (!src) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      {children}
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={PIN_SIZE.width}
        height={PIN_SIZE.height}
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 60,
          /* Contact shadow is baked into the PNG. No CSS shadow added. */
          ...PIN_LEFT[placement],
        }}
      />
    </div>
  );
}
