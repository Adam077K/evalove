/* eslint-disable @next/next/no-img-element -- the ribbon is a keyed
   material composite; the optimizer must never re-encode its alpha. */

import type { CSSProperties } from "react";

import type { IsoDate } from "@/lib/types";
import { longDate } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * The closed book — the masthead object of The Book's surface.
 *
 * §4 says one masthead per surface and "The Book has a cover"; this is
 * that cover, an object rather than a heading. Olive cloth over
 * boards, blind-stamped EVA & ADAM, the colophon at the foot, and the
 * fore-edge — the stacked page edges — visible along the right.
 *
 * THE FORE-EDGE IS THE ANTI-COUNTER. Its width derives from how many
 * leaves the book holds, and that is the only place the archive's size
 * is ever expressed: as the felt weight of an object, never as a
 * number. No digit of the count appears anywhere, in copy or in a
 * label or in an aria string. A thick book is an object, not a tally.
 *
 * The spine bleeds off the LEFT edge of the viewport (§4 move #1: one
 * element bleeds off one edge). The book is larger than the screen —
 * an object on your lap, not an icon in a column. The fore-edge, the
 * edge that means something, stays fully on screen with room to grow.
 *
 * Rotation is a fixed −1.6°, not seeded. There is exactly one book,
 * forever, and it is the masthead of this surface: it sits where it
 * was left, deliberately, the way a wordmark sits — <Mounted>'s seeded
 * scatter is for the many things ON pages, not for the one object that
 * holds them.
 *
 * The board and fore-edge are exported as parts (`CoverBoard`,
 * `ForeEdge`) because the book now OPENS: the flap that swings on
 * /book must be the same board pixel for pixel, and the open page
 * block keeps the same fore-edge at its right. One board, two poses.
 *
 * Materials: OLIVE cloth — the founder's pick, on sight, over the
 * burgundy (which stays in the assets folder as the rejected
 * colourway, never in public/). Olive sits further from
 * --night-burgundy than wine-red does: the Book is the one surface
 * the window never reaches, and a cover echoing the Deco palette
 * would blur that line. The ribbon is BURGUNDY silk — judged against
 * the olive in situ, day and lamp-dimmed, against two rivals: the
 * teal ("sage") fought the cloth, two greens missing each other and
 * nearly merging in value under the lamp; the brass merged with the
 * lamplit table instead — same defect, different neighbour. Burgundy
 * is the classic complement to olive bookcloth, separates cleanly at
 * both light levels, and keeps the rejected cover colourway alive
 * inside the object's own logic. Both losers stay in the assets
 * folder. The file ships as book-ribbon.webp — a name that says
 * "sage" while shipping burgundy is the stale-migration-header
 * defect wearing a different hat. The fore-edge is the stock-derived
 * standin, which beat the generated asset on sight (fine pitch reads
 * as hundreds of pages). Cloth, pages and ribbon all carry the lamp;
 * nothing here is a photograph.
 */

interface BookCoverProps {
  /**
   * How many leaves the book holds — kept days plus gathering pages.
   * Drives fore-edge width only. Never rendered as a number.
   */
  leafCount: number;
  /** The archive's earliest day — the colophon derives from it. */
  begun: IsoDate;
}

/**
 * Leaf count → fore-edge width in px.
 *
 * 12px floor: two boards and the endpapers — a brand-new book is thin,
 * not absent. ~2.6px per leaf while young, so the first weeks visibly
 * thicken week over week; past ~96px the stack compresses (real paper
 * under its own weight) and the growth slows without ever stopping
 * until a 132px ceiling that keeps year three on a 393px screen.
 */
export function foreEdgePx(leaves: number): number {
  const raw = 12 + leaves * 2.6;
  const soft = raw <= 96 ? raw : 96 + (raw - 96) * 0.22;
  return Math.round(Math.min(soft, 132));
}

/**
 * The blind-stamp impression, rebuilt after the founder called the
 * first pass nearly illegible — and it was: a transparent fill under
 * two 1px-offset, 1px-blur shadows meant the light and dark copies
 * overlapped across most of every stroke and cancelled into mush.
 * You had to know what it said to read it.
 *
 * What a real blind stamp does: the die presses a FLOOR into the
 * cloth, and the floor sits in its own slight occlusion shade —
 * that is the letterform's mass, and it is what the transparent fill
 * threw away. Then the walls of the impression work the light: the
 * lower wall catches it (crisp 1px lip, then a soft spill), the
 * upper wall shades (crisp lip, then depth). Crisp means 0 blur at
 * 1px offset — pressed edges are edges, not glows.
 *
 * The highlight rides the lamp so at night the stamping deepens with
 * the cloth it is pressed into; the floor's shade does not dim,
 * because an impression does not fill itself back in when the light
 * goes low.
 */
const EMBOSS: CSSProperties = {
  color: "rgb(30 27 13 / 0.30)",
  textShadow: [
    "0 1px 0 rgb(242 234 208 / calc(0.62 - var(--lamp-dim, 0) * 0.26))",
    "0 2px 3px rgb(242 234 208 / calc(0.24 - var(--lamp-dim, 0) * 0.10))",
    "0 -1px 0 rgb(16 14 7 / 0.50)",
    "0 -2px 2px rgb(16 14 7 / 0.20)",
  ].join(", "),
};

/** The colophon's impression. At 13px the same walls smudge into one
    another, so the small die is pressed deeper (more floor) and lit
    tighter (1px walls only) — legible first, embossed second. */
const EMBOSS_SMALL: CSSProperties = {
  color: "rgb(30 27 13 / 0.44)",
  textShadow: [
    "0 1px 0 rgb(242 234 208 / calc(0.50 - var(--lamp-dim, 0) * 0.22))",
    "0 -1px 0 rgb(16 14 7 / 0.30)",
  ].join(", "),
};

/**
 * The lamp coming DOWN, painted on the cloth — the founder's second
 * defect: day and night covers were nearly indistinguishable because
 * `.under-lamp` dims the whole board uniformly, which reads as
 * "nothing happened" rather than "the lamp came down". A lamp low at
 * the lower-left is DIRECTIONAL: the board's far corner falls into
 * the room's shade while its near corner keeps a warm kiss. Both
 * layers are ×--lamp-dim, so by day this div is invisible.
 *
 * Substrate shading only — the cloth and the page stack are
 * materials, never photographs.
 */
export function LampShade({ className, strength = 1 }: { className?: string; strength?: number }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        background: [
          `linear-gradient(to bottom left, rgb(14 12 5 / calc(var(--lamp-dim, 0) * ${0.38 * strength})), rgb(14 12 5 / 0) 58%)`,
          `radial-gradient(120% 90% at 8% 100%, rgb(224 152 56 / calc(var(--lamp-dim, 0) * ${0.15 * strength})), rgb(224 152 56 / 0) 62%)`,
        ].join(", "),
      }}
    />
  );
}

/**
 * The front board — one face, two poses: lying closed in `BookCover`,
 * and swinging on the flap in `BookObject`. Position, size, corner
 * radii and shadow belong to the caller; the cloth, the stamping, the
 * colophon and the lamp belong here, so the board that opens is the
 * board that was closed.
 *
 * `pl-9` on the stamping returns the bled 36px so the type centres on
 * the VISIBLE cloth — both poses bleed the same 36px past the screen's
 * left edge, so the correction is the board's own.
 */
export function CoverBoard({
  begun,
  className,
  style,
}: {
  begun: IsoDate;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("under-lamp relative bg-cover bg-center", className)}
      style={{
        backgroundImage: "url(/materials/book-cloth-olive.webp)",
        ...style,
      }}
    >
      <div className="absolute inset-x-0 top-[21%] pl-9 pr-4 text-center">
        <p
          className="font-display text-[30px] font-semibold uppercase leading-[1.32] tracking-[0.16em]"
          style={EMBOSS}
        >
          Eva
          <br />
          <span className="text-[22px] font-medium italic normal-case tracking-[0.02em]">
            &amp;
          </span>
          <br />
          Adam
        </p>
      </div>

      {/* The colophon — Fraunces italic, the app's own voice (§2),
          at the foot of the board the way a press dates itself. */}
      <p
        className="font-display absolute inset-x-0 bottom-[7%] pl-9 pr-4 text-center text-[13px] italic tracking-[0.05em]"
        style={EMBOSS_SMALL}
      >
        Begun {longDate(begun)}
      </p>

      <LampShade />
    </div>
  );
}

/**
 * The fore-edge. Width IS the archive — the anti-counter. It stays at
 * the right of the page block whether the book is closed or open: an
 * open book still shows the rest of its pages stacked under your
 * right thumb.
 */
export function ForeEdge({
  width,
  className,
  style,
}: {
  width: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("under-lamp relative bg-left", className)}
      style={{
        width,
        backgroundImage: "url(/materials/book-fore-edge-standin.webp)",
        backgroundSize: "auto 100%",
        ...style,
      }}
    >
      <LampShade strength={0.7} />
    </div>
  );
}

export function BookCover({ leafCount, begun }: BookCoverProps) {
  const edge = foreEdgePx(leafCount);

  return (
    <div className="relative" style={{ transform: "rotate(-1.6deg)" }}>
      <div className="flex items-stretch">
        {/* The front board. Bleeds off the left edge — the spine is
            off-screen. Casts right onto the page stack (the third
            shadow layer) as well as down onto the table. */}
        <CoverBoard
          begun={begun}
          className="z-10 -ml-9 h-[min(540px,58dvh)] flex-1 rounded-[3px] rounded-r-none"
          style={{
            boxShadow:
              "0 4px 12px rgba(41,32,24,0.18), 0 10px 28px rgba(41,32,24,0.13), 7px 0 12px -5px rgba(41,32,24,0.35)",
          }}
        />

        {/* Inset top and bottom by the boards' squares: the boards
            overhang the page block the way bound boards do. */}
        <ForeEdge
          width={edge}
          className="-ml-px my-[3px] rounded-r-[2px]"
          style={{
            boxShadow: "0 3px 10px rgba(41,32,24,0.16), 0 8px 20px rgba(41,32,24,0.10)",
          }}
        />
      </div>

      {/* The ribbon bookmark, holding a place. It leaves the page
          block at the foot and hangs below the book onto the table —
          opening the book follows it to the page it holds. Between
          the board (z-10) and the table; drop-shadow follows its cut,
          and the lamp curve rides inline because a filter class would
          be overridden (the Pinned precedent).

          Geometry: the burgundy is trimmed TIGHT (its junk was
          cleared before trim, unlike the sage's wide box), so the
          strip fills most of the 221x1024 box. Width 83px puts the
          silk's cross-section at ~30px, the sage's in-situ scale;
          `right: edge - 6` lands the hanging tail left of the
          fore-edge, under the boards. The asset's upper twist drapes
          the page block's lower corner AT the fore-edge — kept
          deliberately: seen in situ it reads as the ribbon exiting
          between the pages, and it explains where the tail comes
          from. */}
      <img
        src="/materials/book-ribbon.webp"
        alt=""
        aria-hidden="true"
        width={221}
        height={1024}
        className="pointer-events-none absolute z-[5] h-auto w-[83px]"
        style={{
          right: edge - 6,
          bottom: -150,
          transform: "rotate(2.4deg)",
          filter:
            "drop-shadow(0 3px 5px rgba(41,32,24,0.28)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
        }}
      />
    </div>
  );
}
