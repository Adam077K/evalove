/* eslint-disable @next/next/no-img-element -- both layers are exempt:
   the frame is a keyed material whose alpha must never be re-encoded,
   and the photograph is fixture-resolved content under the `.photo`
   law (no filter, no optimizer re-encode). */

import type { ReactNode } from "react";

import type { Photo } from "@/lib/types";
import { photoSrc } from "@/lib/fixtures/resolve";

/**
 * A photograph in a real polaroid frame.
 *
 * The keyed frame assets have genuinely transparent windows (measured
 * from the alpha channel by flood fill from the centre), so the
 * composite is physical: the photograph sits under the frame and shows
 * through the window; the frame's border occludes the photograph's
 * edges the way a print sits in its mount.
 *
 *   chin    polaroid-frame-chin (795×1024) — classic proportions,
 *           window x 9.6→90.6%, y 9.8→75.3%. The chin is the natural
 *           place for a handwritten caption; pass it as children.
 *   square  polaroid-frame-empty (900×1024) — equal borders,
 *           window x 10.3→91.2%, y 11.1→74.4%.
 *
 * THE MOUNT TAKES THE PHOTOGRAPH'S REAL SHAPE.
 *
 * The outer frame's aspect ratio is computed from the photograph's own
 * dimensions so that the transparent window matches the photo exactly
 * and object-cover never crops a single pixel:
 *
 *   window_AR = window_width% / window_height%  (from frame asset)
 *   photo_AR  = photo.width  / photo.height
 *   frame_AR  = photo_AR  × (window_height% / window_width%)
 *
 * When frame_AR is derived this way, window_AR = frame_AR × (width%/height%) =
 * photo_AR exactly — the window and the photo share one shape, and object-cover
 * is a no-op. The frame PNG stretches to the new proportions (its borders grow
 * and shrink proportionally with the photo); that is acceptable because the
 * frame's visual weight comes from its material, not from pixel-perfect borders.
 *
 * The chin keeps a guaranteed minimum height so a handwritten caption is never
 * squeezed off a very wide landscape frame. No overflow-hidden in the ancestry
 * (BookSheet explicitly forbids it), so the chin cannot be clipped — the floor
 * is about giving the text adequate room, not about preventing clip.
 *
 * The <img> carries `.photo` and nothing else; only the FRAME dims under the
 * lamp, via an inline filter because drop-shadow forces the lamp curve inline
 * (the Pinned precedent — one definition in :root, two readers).
 *
 * No <Mounted> in here — the caller mounts the whole polaroid so
 * rotation and mass stay a composition decision, not a mount detail.
 * Callers should suppress Mounted's rectangular box-shadow (the frame
 * edge is keyed, slightly irregular) — the frame casts its own
 * drop-shadow along its real cut.
 */

export type PolaroidVariant = "chin" | "square";

interface FrameSpec {
  src: string;
  /** Transparent window, as percentages of the frame box. */
  window: { left: string; top: string; width: string; height: string };
  /**
   * Raw numeric percentages (0–100) for the window edges — used to compute
   * the frame's aspect ratio from the photograph's own dimensions.
   * Derived once from the window strings above; kept here so the math is
   * co-located with the values it reads.
   */
  windowWidthPct: number;
  windowHeightPct: number;
  /** Minimum chin height in px — guaranteed even for very wide landscape photos. */
  chinMinHeightPx: number;
}

const FRAMES: Record<PolaroidVariant, FrameSpec> = {
  chin: {
    src: "/materials/polaroid-frame-chin.webp",
    window: { left: "9.56%", top: "9.77%", width: "81.05%", height: "65.53%" },
    windowWidthPct: 81.05,
    windowHeightPct: 65.53,
    // Chin spans top-[77.5%] to bottom-[4%] = 18.5% of frame height.
    // At the widest landscape we expect (≈16:9), the frame is ~0.54× the
    // width in height, giving a chin of 0.185×0.54×W ≈ 0.10W.
    // At W=200 px that is 20 px — too tight for a line of 19px Fraunces.
    // 44 px covers one generous line of Eva's hand + a small time stamp.
    chinMinHeightPx: 44,
  },
  square: {
    src: "/materials/polaroid-frame-empty.webp",
    window: { left: "10.33%", top: "11.13%", width: "80.89%", height: "63.28%" },
    windowWidthPct: 80.89,
    windowHeightPct: 63.28,
    // Square variant has no chin — callers never pass children for it.
    // The field exists for type uniformity; it is never applied.
    chinMinHeightPx: 44,
  },
};

export interface PolaroidProps {
  photo: Photo;
  variant?: PolaroidVariant;
  alt: string;
  /** Caption content laid on the chin, in the author's own hand. */
  children?: ReactNode;
  className?: string;
}

export function Polaroid({
  photo,
  variant = "chin",
  alt,
  children,
  className,
}: PolaroidProps) {
  const frame = FRAMES[variant];

  // Derive the frame's aspect ratio from the photograph's own dimensions so
  // the transparent window matches the photo's shape exactly. When this ratio
  // is used, the window's intrinsic AR equals the photo's AR and object-cover
  // is a no-op — no crop for portrait or landscape.
  //
  //   frame_AR = photo_AR × (window_height% / window_width%)
  //
  // Falls back to 1:1 only if dimensions are missing or zero (never in
  // practice — every Photo has width/height set by the ingestion pipeline).
  const photoAR =
    photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
  // Express as "W / H" to satisfy CSS aspect-ratio's preferred syntax.
  //
  //   frame_AR = photo_AR × (windowHeightPct / windowWidthPct)
  //
  // Written as a rational fraction: numerator = photo_AR × windowHeightPct,
  // denominator = windowWidthPct. This avoids floating-point rounding by
  // letting the browser evaluate the division.
  //
  // Proof: window_AR = (windowWidthPct × frame_W) / (windowHeightPct × frame_H)
  //   = (windowWidthPct / windowHeightPct) × frame_AR
  //   = (windowWidthPct / windowHeightPct) × photo_AR × (windowHeightPct / windowWidthPct)
  //   = photo_AR ✓
  const aspectRatio = `${frame.windowHeightPct * photoAR} / ${frame.windowWidthPct}`;

  return (
    <div className={className} style={{ position: "relative", aspectRatio }}>
      {/* The print, under the frame, visible through the window. */}
      <img
        src={photoSrc(photo)}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        className="photo absolute object-cover"
        style={{ ...frame.window, position: "absolute" }}
      />
      {/* The frame, over the print. Its shadow follows the keyed cut. */}
      <img
        src={frame.src}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          filter:
            "drop-shadow(0 2px 4px rgba(41,32,24,0.20)) drop-shadow(0 6px 14px rgba(41,32,24,0.12)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
          transition: "filter var(--dur-3) var(--ease-io)",
        }}
      />
      {/* The chin — their hand, directly on the frame's paper.
          min-height guarantees a legible floor even for very wide landscape
          frames where the chin's natural percentage-height would be too small
          for a line of text. No overflow-hidden in the ancestry means the
          floor never clips content — it only ensures adequate room. */}
      {children !== undefined && variant === "chin" && (
        <div
          className="absolute inset-x-[11%] top-[77.5%] bottom-[4%]"
          style={{ minHeight: frame.chinMinHeightPx > 0 ? `${frame.chinMinHeightPx}px` : undefined }}
          data-testid="polaroid-chin"
        >
          {children}
        </div>
      )}
    </div>
  );
}
