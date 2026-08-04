import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Torn-edge mount.
 *
 * A backing sheet with a genuinely torn edge, on which a photograph or
 * note sits. The mount peeks out around the content; the tear is the
 * most handmade of the mounts. §3 specifies 8 tear characters; only
 * variant 8 (cold-press, torn left edge) exists in the keyed set.
 *
 * The asset is `torn-edge-coldpress-mount.webp` — a mechanical crop of
 * torn-edge-coldpress.webp, measured from the alpha channel so the
 * sheet runs edge-to-edge on its top, right and bottom, with the tear
 * and its fibre on the left. object-fit: cover anchored to the left
 * keeps the tear character intact at any content size: the sheet
 * crops on its clean side, never stretches on its torn one.
 *
 * Variants 1–7 render children in the same wrapper with no mount —
 * never a broken img — until their assets arrive.
 */

export interface TornProps {
  /**
   * Tear character 1–8 per §3. Only 8 (cold-press, left tear) has an
   * asset today; the rest render children unmounted without error.
   */
  variant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  children: ReactNode;
  className?: string;
}

/** Asset registry. Extend as torn-edge variants arrive from generation. */
const TORN_ASSETS: Partial<Record<number, string>> = {
  8: "/materials/torn-edge-coldpress-mount.webp",
};

/**
 * How far the backing sheet extends past the content. The torn left
 * edge gets more room than the clean sides — the tear is the point.
 */
const OVERHANG_TORN = 30; /* px, left — the fibre needs air */
const OVERHANG_CLEAN = 14; /* px, the other three sides */

export function Torn({ variant, children, className }: TornProps) {
  const src = TORN_ASSETS[variant];

  return (
    <div className={cn("relative", className)} style={{ isolation: "isolate" }}>
      {src && (
        /* eslint-disable-next-line @next/next/no-img-element -- keyed
           material composite; must keep its own alpha untouched. */
        <img
          src={src}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -OVERHANG_CLEAN,
            right: -OVERHANG_CLEAN,
            bottom: -OVERHANG_CLEAN,
            left: -OVERHANG_TORN,
            width: `calc(100% + ${OVERHANG_TORN + OVERHANG_CLEAN}px)`,
            height: `calc(100% + ${OVERHANG_CLEAN * 2}px)`,
            maxWidth: "none",
            objectFit: "cover",
            objectPosition: "left center",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Content above the mount, inside the isolated context. */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
