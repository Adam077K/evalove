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
 *
 * PLACE, NOT TIME. The Seam renders in both light and dark mode and
 * takes no mode check — revised §1 (2026-08-04): the clock stopped
 * governing. Do not re-introduce a `[data-mode]` gate here; the
 * --night-* tokens this component depends on are :root constants
 * precisely so a Seam at noon still falls into the same sky.
 *
 * MATERIAL. The fibre edge is a generated horizontal tear
 * (seam-tear-*.webp), purpose-made for this component: its top row is
 * 100% opaque so it butts flush against the paper above with no join,
 * its tear meanders with real geometry (std ~17px), and everything
 * below the fibre is true alpha. It composites as a plain <img> with
 * no masks — the feathering is in the material. Never simulate this
 * edge with box-shadow, clip-path or an SVG filter, and never crop a
 * band off torn-edge-coldpress.webp for it: that asset's tear runs
 * vertically and any horizontal crop of it is a straight line wearing
 * texture (that failure shipped twice on this branch already).
 *
 * LIGHT. The falloff gradient sits BEHIND the fibre and begins just
 * below the tear line, not at it — a torn edge with light still on
 * its fibre reads as a real object; one that goes straight to black
 * reads as a mask. It lands on var(--night-sky) before the bottom
 * edge, and the DECO section below must open on that exact colour —
 * the handoff is invisible by construction.
 */

export type SeamVariant = "coldpress" | "bone";

export interface SeamProps {
  /**
   * Which torn sheet ends the paper world. 'coldpress' is the soft
   * deckle with cotton fibres (default — it reads as a sheet ending);
   * 'bone' is the rougher hand-ripped tear with laid lines. The
   * founder picks on sight; swapping is this one word.
   * @default "coldpress"
   */
  variant?: SeamVariant;
  /**
   * Total height in pixels: the fibre strip at its natural aspect
   * (~37% of render width — ~145px at 393px) plus the falloff below
   * it. The default gives the tear an ~80px falloff at phone width;
   * anything under ~180 starts cropping the tear itself.
   * @default 224
   */
  height?: number;
  className?: string;
}

/** Natural dimensions ride along so the browser derives the aspect. */
const FIBRE: Record<SeamVariant, { src: string; width: number; height: number }> = {
  coldpress: { src: "/materials/seam-tear-coldpress.webp", width: 1344, height: 497 },
  bone: { src: "/materials/seam-tear-bone.webp", width: 1344, height: 507 },
};

/**
 * Falloff stops, as fractions of the container at the 393px baseline.
 * Measured from the coldpress alpha channel: solid paper ends at 83%
 * of the strip, fibre is gone by 95% — at height 224 that is ~54% and
 * ~62% of the container. Darkness starts under the lit fibre (58%),
 * not at the tear line.
 */
const FALLOFF =
  "linear-gradient(to bottom, rgb(13 18 32 / 0) 0%, rgb(13 18 32 / 0) 58%, rgb(13 18 32 / 0.45) 70%, rgb(13 18 32 / 0.85) 84%, var(--night-sky) 96%)";

export function Seam({ variant = "coldpress", height = 224, className }: SeamProps) {
  const fibre = FIBRE[variant];

  return (
    <div
      aria-hidden="true"
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
    >
      {/* Light dying into the sky — behind and below the fibre, never
          on top of it. The stops are rgb(13 18 32 / …) rather than
          `transparent` because a gradient through transparent-black
          greys out its midpoint. */}
      <div className="absolute inset-0" style={{ background: FALLOFF }} />

      {/* The torn sheet itself, flush against the paper above. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- keyed
          material composite; the image optimizer adds nothing to a
          small webp and must never re-encode its alpha. */}
      <img
        src={fibre.src}
        alt=""
        width={fibre.width}
        height={fibre.height}
        className="absolute inset-x-0 top-0 h-auto w-full"
      />
    </div>
  );
}
