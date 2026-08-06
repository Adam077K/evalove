/* eslint-disable @next/next/no-img-element -- the ribbon is a keyed
   material composite; the optimizer must never re-encode its alpha. */

import type { CSSProperties } from "react";

import type { IsoDate } from "@/lib/types";
import { longDate } from "@/lib/time";

/**
 * The closed book — the masthead object of The Book's surface.
 *
 * §4 says one masthead per surface and "The Book has a cover"; this is
 * that cover, an object rather than a heading. Burgundy cloth over
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
 * The emboss is the accepted impression technique (Wave 1's
 * pressed-through writing): transparent fill, light below each stroke,
 * shade above — pressure, not ink. The highlight rides the lamp so at
 * night the stamping dims with the cloth it is pressed into.
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
function foreEdgePx(leaves: number): number {
  const raw = 12 + leaves * 2.6;
  const soft = raw <= 96 ? raw : 96 + (raw - 96) * 0.22;
  return Math.round(Math.min(soft, 132));
}

/** The blind-stamp impression: light under the stroke, shade above.
    Tuned against the olive cloth: the highlight is warm neutral (a
    red-leaning highlight looked borrowed from the burgundy) and the
    shade is a deep olive-neutral rather than wine-dark. */
const EMBOSS: CSSProperties = {
  color: "transparent",
  textShadow:
    "0 1px 1px rgb(236 228 208 / calc(0.42 - var(--lamp-dim, 0) * 0.20)), 0 -1px 1px rgb(16 16 8 / 0.60)",
};

export function BookCover({ leafCount, begun }: BookCoverProps) {
  const edge = foreEdgePx(leafCount);

  return (
    <div className="relative" style={{ transform: "rotate(-1.6deg)" }}>
      <div className="flex items-stretch">
        {/* The front board. Bleeds off the left edge — the spine is
            off-screen. Casts right onto the page stack (the third
            shadow layer) as well as down onto the table. */}
        <div
          className="under-lamp relative z-10 -ml-9 h-[min(540px,58dvh)] flex-1 rounded-[3px] rounded-r-none bg-cover bg-center"
          style={{
            backgroundImage: "url(/materials/book-cloth-olive.webp)",
            boxShadow:
              "0 4px 12px rgba(41,32,24,0.18), 0 10px 28px rgba(41,32,24,0.13), 7px 0 12px -5px rgba(41,32,24,0.35)",
          }}
        >
          {/* The stamping. pl-9 returns the bled 36px so the type
              centres on the VISIBLE cloth, not on the board. */}
          <div className="absolute inset-x-0 top-[21%] pl-9 pr-4 text-center">
            <p
              className="font-display text-[30px] font-medium uppercase leading-[1.32] tracking-[0.16em]"
              style={EMBOSS}
            >
              Eva
              <br />
              <span className="text-[22px] italic normal-case tracking-[0.02em]">
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
            style={EMBOSS}
          >
            Begun {longDate(begun)}
          </p>
        </div>

        {/* The fore-edge. Width IS the archive — the anti-counter.
            Inset top and bottom by the boards' squares: the boards
            overhang the page block the way bound boards do. */}
        <div
          aria-hidden="true"
          className="under-lamp -ml-px my-[3px] rounded-r-[2px] bg-left"
          style={{
            width: edge,
            backgroundImage: "url(/materials/book-fore-edge-standin.webp)",
            backgroundSize: "auto 100%",
            boxShadow: "0 3px 10px rgba(41,32,24,0.16), 0 8px 20px rgba(41,32,24,0.10)",
          }}
        />
      </div>

      {/* The ribbon bookmark, holding a place. It leaves the page
          block at the foot and hangs below the book onto the table —
          scrolling down to the opening follows it. Between the board
          (z-10) and the table; drop-shadow follows its cut, and the
          lamp curve rides inline because a filter class would be
          overridden (the Pinned precedent).

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
