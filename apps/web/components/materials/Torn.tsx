"use client";

import { ReactNode } from "react";
import Image from "next/image";

/**
 * Torn-edge mount.
 *
 * Places a torn-edge backing paper (PNG with transparency) behind
 * a photograph or note. The photograph sits on top of the torn mount;
 * the mount peeks out at the torn edges, giving the composition depth.
 *
 * 8 variants map to the style bible's torn-edge families:
 *   1 — cream writing paper, bottom edge torn
 *   2 — cream writing paper, right edge torn
 *   3 — cream writing paper, top + right edges torn
 *   4 — ledger paper, bottom edge torn
 *   5 — kraft paper, bottom + left edges torn
 *   6 — newsprint, top edge torn
 *   7 — cream writing paper, all four edges torn
 *   8 — cold-press watercolour, bottom edge deckle tear ← ONLY ONE WITH ASSET
 *
 * Variants 1–7 render children unwrapped until their assets arrive.
 * Variant 8 is the deckle tear — assets/torn-edge-coldpress.png.
 */

export interface TornProps {
  /**
   * Style bible variant 1–8. Only variant 8 (cold-press deckle) has
   * a real asset. Others render children unwrapped without error.
   */
  variant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  children: ReactNode;
  className?: string;
}

/** Asset registry. Extend as torn-edge variants arrive from generation. */
const TORN_ASSETS: Partial<Record<number, string>> = {
  8: "/materials/torn-edge-coldpress.png",
};

/**
 * Mount dimensions for the backing paper.
 * The torn mount is wider and taller than the content so the torn
 * edges are visible around the photograph.
 */
const MOUNT_OVERHANG = 24; /* px each side */

export function Torn({ variant, children, className }: TornProps) {
  const src = TORN_ASSETS[variant];

  /* No asset for this variant yet — render children unwrapped. */
  if (!src) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      {/* The torn backing paper sits behind the photograph. */}
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={800}
        height={240}
        style={{
          position: "absolute",
          inset: `-${MOUNT_OVERHANG}px`,
          width: `calc(100% + ${MOUNT_OVERHANG * 2}px)`,
          height: `calc(100% + ${MOUNT_OVERHANG * 2}px)`,
          objectFit: "cover",
          objectPosition: "center bottom",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      {children}
    </div>
  );
}
