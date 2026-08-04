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
 * The photograph is object-cover into the window: a polaroid crops to
 * its aperture — that is what the format is. The <img> carries
 * `.photo` and nothing else; only the FRAME dims under the lamp, via
 * an inline filter because drop-shadow forces the lamp curve inline
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
  aspect: string;
  /** Transparent window, as percentages of the frame box. */
  window: { left: string; top: string; width: string; height: string };
}

const FRAMES: Record<PolaroidVariant, FrameSpec> = {
  chin: {
    src: "/materials/polaroid-frame-chin.webp",
    aspect: "795 / 1024",
    window: { left: "9.56%", top: "9.77%", width: "81.05%", height: "65.53%" },
  },
  square: {
    src: "/materials/polaroid-frame-empty.webp",
    aspect: "900 / 1024",
    window: { left: "10.33%", top: "11.13%", width: "80.89%", height: "63.28%" },
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

  return (
    <div className={className} style={{ position: "relative", aspectRatio: frame.aspect }}>
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
      {/* The chin — their hand, directly on the frame's paper. */}
      {children !== undefined && variant === "chin" && (
        <div className="absolute inset-x-[11%] top-[77.5%] bottom-[4%]">
          {children}
        </div>
      )}
    </div>
  );
}
