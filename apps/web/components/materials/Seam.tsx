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
   * it. The default gives the deep end ~110px of run at phone width;
   * anything under ~180 starts cropping the tear itself.
   * @default 256
   */
  height?: number;
  className?: string;
  /**
   * Point-reflects the whole strip 180° for a ceiling instead of a
   * floor — the shared shell's band uses this to tear paper DOWN away
   * from a night-sky masthead, the geometric inverse of this
   * component's original job (paper above, night below).
   *
   * A ROTATION, deliberately not a `scaleY(-1)` mirror: a vertical-only
   * flip reproduces this exact meander upside down, which would twin
   * whatever lower tear already exists on the same screen (Today ships
   * one). A full 180° turn flips the horizontal axis too, so the
   * meander is a genuinely different shape, not a reflection of this
   * one.
   *
   * Whether that turn also lands the flush edge on the wrong side was
   * flagged as a real open question and checked against the source
   * asset rather than assumed: `seam-tear-coldpress-tostock.webp`'s
   * alpha channel is a flat 255 for its top ~83% (rows 0–411 of 497)
   * and falls to 0 by row 490 — the meander lives entirely in the
   * final ~15%, at the bottom. Point-reflecting the rendered strip
   * (fibre image + falloff together, as one composite) swaps that
   * with the falloff's own dark end, which is already `var(--night-sky)`
   * — the same solid colour the band's masthead is painted, so the
   * top of a rotated strip lands on a colour that already matches its
   * new neighbour with no separate correction. No gradient-stop or
   * crop change was needed for this variant; verify against the asset
   * again if the source strip is ever regenerated.
   * @default false
   */
  rotated?: boolean;
}

/**
 * Natural dimensions ride along so the browser derives the aspect.
 * The coldpress strip is the -tostock derivative: its sheet tone is
 * matched to paper-coldpress-stock's measured mean (mechanical
 * per-channel gain ×0.965/0.964/0.976), so the sheet tearing at the
 * bottom of a coldpress <Paper> is the same paper to the eye. A
 * bone-graded sibling (seam-tear-coldpress-graded) pairs with the
 * bone-laid stock; the ungraded original stays in the library.
 */
const FIBRE: Record<SeamVariant, { src: string; width: number; height: number }> = {
  coldpress: { src: "/materials/seam-tear-coldpress-tostock.webp", width: 1344, height: 497 },
  bone: { src: "/materials/seam-tear-bone.webp", width: 1344, height: 507 },
};

/**
 * Falloff stops, as fractions of the container at the 393px baseline
 * (height 256; the fibre tips land at ~54%, measured from the
 * coldpress alpha channel). The shape is asymmetric on purpose, and
 * it has now been chosen against pixels twice:
 *
 *   - The ramp under the fibre is STEEP (0 → 0.6 over ~20px): by day
 *     the canvas is bright, and every semi-transparent pixel below
 *     the tear leaks page-light into the window — a slow start reads
 *     as fog, not depth. Unchanged; measured correct.
 *
 *   - The mid-band COMMITS fast (0.6 → 0.9 over the next ~20px).
 *     The first accepted geometry held 0.55–0.8 opacity for ~45px,
 *     and the measured luminance profile (2026-08-06, both modes)
 *     showed why it still hazed: a ~104px descent from lum 129 to 18
 *     by day, 97 to 18 by night — §9.6's fog mechanism operating in
 *     BOTH modes, night simply leaking a dimmer page. At 0.9 the day
 *     leak is ~+22 luminance over the sky; at 0.8 it was ~+45 and
 *     read as a grey transitional band.
 *
 *   - The deep end stays LONG but runs NEARLY OPAQUE (0.9 → 0.97 →
 *     night-sky over ~55px): the slow deepening that gives the night
 *     sky its distance now happens between lum ~24 and 18 instead of
 *     between ~90 and 18. Distance survives; the fog does not. A
 *     short deep end still reads as a colour block — that finding
 *     stands.
 *
 * The fibre itself stays inside the transparent zone — light remains
 * on the torn lip. Straight-to-dark read as a mask in every capture.
 */
const FALLOFF =
  "linear-gradient(to bottom, rgb(13 18 32 / 0) 0%, rgb(13 18 32 / 0) 47%, rgb(13 18 32 / 0.6) 55%, rgb(13 18 32 / 0.9) 63%, rgb(13 18 32 / 0.97) 74%, var(--night-sky) 93%)";

export function Seam({
  variant = "coldpress",
  height = 256,
  className,
  rotated = false,
}: SeamProps) {
  const fibre = FIBRE[variant];

  return (
    <div
      aria-hidden="true"
      className={cn("relative w-full overflow-hidden", rotated && "rotate-180", className)}
      style={{ height }}
    >
      {/* Light dying into the sky — behind and below the fibre, never
          on top of it. The stops are rgb(13 18 32 / …) rather than
          `transparent` because a gradient through transparent-black
          greys out its midpoint. */}
      <div className="absolute inset-0" style={{ background: FALLOFF }} />

      {/* The torn sheet itself, flush against the paper above. It
          carries .under-lamp so at night it dims with the substrate
          it continues — same asset, same curve, so the join stays
          invisible in the dark too. The falloff behind it is the
          outside and never dims. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- keyed
          material composite; the image optimizer adds nothing to a
          small webp and must never re-encode its alpha. */}
      <img
        src={fibre.src}
        alt=""
        width={fibre.width}
        height={fibre.height}
        className="under-lamp absolute inset-x-0 top-0 h-auto w-full"
      />
    </div>
  );
}
