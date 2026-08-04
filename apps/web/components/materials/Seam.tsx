import { cn } from "@/lib/utils";

/**
 * THE SIGNATURE COMPONENT.
 *
 * The paper world does not end at a border — it tears, and through the
 * tear you see the night between the two cities. The Seam is the room's
 * one window edge: above it, the table (PAPER — what they made); below
 * it, the distance (DECO — the sky, the skylines, the stamp).
 *
 * It is NOT a divider. If it reads as a section break, it has failed.
 * Two things keep it a single continuous space:
 *
 *   1. The fibre edge is a real torn sheet, composited as an <img>.
 *      `torn-edge-coldpress-seam.webp` is a mechanical derivative of
 *      torn-edge-coldpress.webp: rotated 90° CCW so the tear faces
 *      down, cropped to the tear band (measured from the alpha
 *      channel, not eyeballed). Never simulate this edge with
 *      box-shadow, clip-path or an SVG filter — a drawn tear is
 *      exactly the "made with coal" failure the founder rejected.
 *
 *   2. The falloff is light dying, not a colour block starting. The
 *      gradient begins fully transparent — the canvas above continues
 *      through the fibre — and lands on var(--night-sky) at the bottom
 *      edge, where the DECO section below must open on that exact
 *      colour. The handoff is invisible by construction.
 *
 * PLACE, NOT TIME. The Seam renders in both light and dark mode and
 * takes no mode check — revised §1: the clock stopped governing. The
 * --night-* tokens it depends on are :root constants for this reason.
 */

export interface SeamProps {
  /**
   * Total height of the seam in pixels. The torn fibre occupies
   * roughly the top 32px; the rest is falloff into --night-sky.
   * @default 80
   */
  height?: number;
  className?: string;
}

/** Derived fibre-edge asset — see the component comment for provenance. */
const FIBRE_SRC = "/materials/torn-edge-coldpress-seam.webp";

export function Seam({ height = 80, className }: SeamProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      {/* Light falling off into the sky. Transparent through the fibre
          zone so the canvas continues into the tear; --night-sky well
          before the bottom edge so the handoff to the DECO section
          below has margin. The stops are rgb(13 18 32 / …) rather than
          `transparent` because a gradient through transparent-black
          greys out its midpoint. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(13 18 32 / 0) 0%, rgb(13 18 32 / 0.28) 30%, rgb(13 18 32 / 0.75) 58%, var(--night-sky) 92%)",
        }}
      />

      {/* The real fibre edge. The derived band is three mirrored tiles
          of the tear, so at full width it stands about 43px tall and
          the whole tear — sheet, tear line, hanging fibre — lives and
          fades inside the seam instead of being clipped by it. The
          mask is compositing, not drawing: it blends the sheet's crop
          line into the canvas above and lets the fibre dissolve into
          the dark instead of ending on a crop edge. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- keyed
          material composite; the image optimizer adds nothing to a
          small webp and must never re-encode its alpha. */}
      <img
        src={FIBRE_SRC}
        alt=""
        className="absolute inset-x-0 top-0 h-auto w-full"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 6px, #000 16px, rgb(0 0 0 / 0.5) 24px, transparent 38px)",
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 6px, #000 16px, rgb(0 0 0 / 0.5) 24px, transparent 38px)",
        }}
      />
    </div>
  );
}
