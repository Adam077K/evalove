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
 * The board is a FIXED Crown Quarto rectangle — BOARD_WIDTH_PX ×
 * BOARD_HEIGHT_PX below, ratio 189:246 ≈ 0.7683 — and that ratio is
 * invariant at every leaf count. It used to be the flex remainder left
 * over after the fore-edge (a fixed row height, a `flex-1` width), so
 * the cover narrowed as the archive thickened: a bound book's cover
 * does not get narrower as you add pages. Fixed here at the source —
 * the board's own size, never a sibling's — per the measured proportion
 * spec (docs/08-agents_work/sessions/2026-08-06-design-lead-book-proportion.md).
 *
 * The board sits on a real 34px table margin (BOOK_LEFT_MARGIN_PX), not
 * bled off the left edge. The old −36px spine bleed spent the object's
 * one identifying feature — the spine — on a rotation too small (−1.6°)
 * to carry "placed object" alone, and it parked the lamp's pool under
 * the board instead of beside it. /book has no bleeding element,
 * deliberately.
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
 * not absent. Logarithmic, not linear: linear at a rate fast enough to
 * stay visible reaches an unworkable width inside a month, but log
 * keeps week-over-week growth legible early (6 → 13 leaves is +5px)
 * and never actually stops thickening. Ceiling 60px — ~40mm on the
 * 280px board, a genuinely fat album; the old 132px ceiling was ~89mm,
 * which is not an album, and could not coexist with the board's own
 * fixed width on a 393px screen (see BOARD_WIDTH_PX below). Reached at
 * ~2.6 years (~950 leaves) — the board's shape never changes because
 * of it, which is the whole point of this curve living apart from the
 * board's geometry.
 */
export function foreEdgePx(leaves: number): number {
  return Math.round(Math.min(12 + 7 * Math.log(1 + leaves), 60));
}

/**
 * The board's fixed geometry — Crown Quarto, 189 × 246mm, a standard
 * bound-book trim for illustrated and photographic books. Width and
 * height are both literal constants: neither is ever a side effect of
 * the fore-edge's width or the viewport's height. That is what keeps
 * the ratio invariant at every leaf count (proportion spec §1, §5.2).
 */
export const BOARD_WIDTH_PX = 280;
export const BOARD_RATIO = 189 / 246; // ≈ 0.7683
export const BOARD_HEIGHT_PX = Math.round((BOARD_WIDTH_PX / BOARD_RATIO) * 10) / 10; // 364.4

/**
 * The table margin the board sits on — a real margin, not a bleed
 * (§1: "/book has no bleeding element, deliberately"). Shared by the
 * closed cover and the open flap so the board is the same board,
 * pixel for pixel, in both poses.
 */
export const BOOK_LEFT_MARGIN_PX = 34;

/**
 * The blind-stamp impression — twice-corrected.
 *
 * First correction (the founder): the original transparent fill under
 * two 1px-offset, 1px-blur shadows meant the light and dark copies
 * overlapped across most of every stroke and cancelled into mush. You
 * had to know what it said to read it.
 *
 * Second correction (measured, proportion spec §3, after the rebuild
 * that fixed the first defect): both floors still sat INSIDE the
 * cloth's own tonal range — lighter than the weave's ordinary shadows
 * — because the 1px walls are luminance-neutral by construction (equal
 * and opposite, they cancel over a glyph) and a 70%-transparent fill
 * lets the weave show through the letterform at nearly full strength.
 * A die crushes the weave FLAT inside the impression: you read a
 * blind stamp from the texture inside the letter differing from the
 * texture outside it, not from its rim. The fill is the load-bearing
 * lever, not the walls — 0.62 depresses the floor 7.3L below the
 * cloth's own p1 while keeping residual weave sd at 38% of the
 * cloth's; past ≈0.75 the weave dies inside the glyph and it stops
 * being a blind stamp and becomes flat print.
 *
 * Light direction: this surface's lamp sits at the lower-left
 * (LAMPLIGHT, LampShade below). For a depression lit from below-left,
 * the far wall — upper and right — catches the light across the pit,
 * and the near wall — lower and left, the side closest to the lamp —
 * sits in its own rim's shadow. The highlight rides the lamp so at
 * night the stamping deepens with the cloth it is pressed into; the
 * floor's shade does not dim, because an impression does not fill
 * itself back in when the light goes low.
 */
const EMBOSS: CSSProperties = {
  color: "rgb(30 27 13 / 0.62)",
  textShadow: [
    "1px -1px 0 rgb(242 234 208 / calc(0.62 - var(--lamp-dim, 0) * 0.26))",
    "2px -2px 3px rgb(242 234 208 / calc(0.24 - var(--lamp-dim, 0) * 0.10))",
    "-1px 1px 0 rgb(16 14 7 / 0.50)",
    "-2px 2px 2px rgb(16 14 7 / 0.20)",
  ].join(", "),
};

/** The colophon's impression, pressed deeper (0.68 vs the main
    stamp's 0.62 — a small die is struck deeper) and lit tighter (1px
    walls only, no spill). At 13px Fraunces italic the stems were
    ≈1.2 CSS px — too thin for the fill to ever reach full opacity
    across their width, so the stroke's effective floor stayed lighter
    than specified no matter the alpha. 16px at weight 600 brings the
    stems to ≈2.1px; tracking 0.08em keeps adjacent strokes from
    merging into the weave's shadow between them (proportion spec §3). */
const EMBOSS_SMALL: CSSProperties = {
  color: "rgb(30 27 13 / 0.68)",
  textShadow: [
    "1px -1px 0 rgb(242 234 208 / calc(0.50 - var(--lamp-dim, 0) * 0.22))",
    "-1px 1px 0 rgb(16 14 7 / 0.30)",
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
 * and swinging on the flap in `BookObject`. Position (via the
 * caller's margin/left), size, corner radii and shadow belong to the
 * caller; the cloth, the stamping, the colophon and the lamp belong
 * here, so the board that opens is the board that was closed —
 * literally the same BOARD_WIDTH_PX × BOARD_HEIGHT_PX rectangle in
 * both poses.
 *
 * The stamping is centred with plain symmetric padding: there is no
 * bleed left to compensate for (proportion spec §1 — the board no
 * longer bleeds off the screen's left edge).
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
      <div className="absolute inset-x-0 top-[21%] px-4 text-center">
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
          at the foot of the board the way a press dates itself. 16px
          / weight 600 / tracking 0.08em: see EMBOSS_SMALL's comment
          for why 13px could never carry the fill. */}
      <p
        className="font-display absolute inset-x-0 bottom-[7%] px-4 text-center text-[16px] font-semibold italic tracking-[0.08em]"
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
    <div
      className="relative"
      style={{ marginLeft: BOOK_LEFT_MARGIN_PX, transform: "rotate(-1.6deg)" }}
    >
      <div className="flex items-stretch">
        {/* The front board — fixed at BOARD_WIDTH_PX × BOARD_HEIGHT_PX,
            invariant at every leaf count (no more flex-1 remainder).
            Casts right onto the page stack (the third shadow layer)
            as well as down onto the table. */}
        <CoverBoard
          begun={begun}
          className="z-10 rounded-[3px] rounded-r-none"
          style={{
            width: BOARD_WIDTH_PX,
            height: BOARD_HEIGHT_PX,
            boxShadow:
              "0 4px 12px rgba(41,32,24,0.18), 0 10px 28px rgba(41,32,24,0.13), 7px 0 12px -5px rgba(41,32,24,0.35)",
          }}
        />

        {/* Inset top and bottom by the boards' squares: the boards
            overhang the page block the way bound boards do. Stretches
            to the board's own height via `items-stretch` — the board
            is definite now (explicit width + height), so it is always
            the fore-edge that yields to it, never the reverse. */}
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
          strip fills most of the 221x1024 box. Width 62px / bottom
          -111 rescale the same ribbon to the 364px board — the old
          83px / -150 were tuned to the 494px board this cover used to
          have, and left unscaled would put the ribbon's exit at 24%
          down the new board instead of the measured 52%. `right: edge
          - 6` lands the hanging tail left of the fore-edge, under the
          boards. The asset's upper twist drapes the page block's
          lower corner AT the fore-edge — kept deliberately: seen in
          situ it reads as the ribbon exiting between the pages, and
          it explains where the tail comes from. */}
      <img
        src="/materials/book-ribbon.webp"
        alt=""
        aria-hidden="true"
        width={221}
        height={1024}
        className="pointer-events-none absolute z-[5] h-auto w-[62px]"
        style={{
          right: edge - 6,
          bottom: -111,
          transform: "rotate(2.4deg)",
          filter:
            "drop-shadow(0 3px 5px rgba(41,32,24,0.28)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
        }}
      />
    </div>
  );
}
