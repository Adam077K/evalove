import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock, Search } from "lucide-react";
import { whatCameBack } from "@/lib/resurface";
import { BEGUN } from "@/lib/fixtures/book";
import { longDate } from "@/lib/time";
import { ResurfacedItem } from "@/components/book/ResurfacedItem";

export const metadata: Metadata = {
  title: "The book — Eva & Adam",
};

/**
 * The Book — default view is what came back, not reverse chronology.
 *
 * P4's withdrawal condition met literally: "make the archive's default
 * view something other than a date grid — something that resurfaces by
 * association rather than by calendar, so that absences are not
 * addressable positions."
 *
 * No count on this page. Nothing here calls `completeDays()` or renders
 * a number of days. The colophon expresses age through the archive's
 * earliest date; it derives from the fixture, not from any classification
 * of how many people contributed to a given day.
 *
 * Chronology is reachable but not default: /book/days, where the
 * existing Spread snap rail moves unchanged. A missed day has no row
 * in that view — the fixture is a list of days that happened, never
 * a date range iterated into a grid.
 *
 * Day-one state — whatCameBack() returns null only when the archive is
 * genuinely empty (lib/resurface.ts guarantees this after the wave-1
 * fix). When null, the surface is a title page: masthead anchors the
 * top, imprint anchors the foot on a hairline rule, blank paper between
 * them. It promises nothing, instructs nothing, counts nothing, and
 * apologises for nothing. Two navigation doors are suppressed (Ask for
 * something has nothing to quote; The days in order opens an empty room);
 * the lock works regardless of archive state and survives.
 *
 * Forced-state rendering for QA lives at /review/book-states — not here.
 * No state-override parameter is permitted on a deployed route.
 */

export default function BookPage() {
  const returned = whatCameBack(new Date());
  const colophon = `Begun ${longDate(BEGUN)}`;

  /* ── Title page (empty archive, day one) ─────────────────────────────
   * Masthead at top, blank paper, imprint at foot.
   * The container's min-height is calc(100dvh - dock-footprint - 2rem)
   * so the flex-1 spacer pushes the imprint to the bottom of the visible
   * area without overlapping the dock. dvh, never vh.
   * ─────────────────────────────────────────────────────────────────── */
  if (returned === null) {
    return (
      <div
        className="flex flex-col"
        style={{
          minHeight: "calc(100dvh - var(--dock-footprint) - 2rem)",
        }}
      >
        {/* Masthead — anchors the top of the page */}
        <h1
          className="type-masthead text-ink"
          style={{ fontSize: "clamp(3.5rem, calc((100vw - 2.5rem) / 4.663), 6.5rem)" }}
        >
          The book
        </h1>

        {/* Blank paper — the page itself */}
        <div className="flex-1" aria-hidden="true" />

        {/* Imprint — anchors the foot on a hairline rule.
            Eva & Adam (type-title, already Fraunces via font-display)
            with the pocket lock at the right — the one way in that
            works on day one. Colophon below, type-micro, quietest token. */}
        <div>
          <hr className="border-t border-line" />
          <Link
            href="/pocket"
            className="flex items-center justify-between py-5 press"
            aria-label="The pocket"
          >
            <span className="type-title text-ink">Eva &amp; Adam</span>
            <Lock
              size={18}
              strokeWidth={1.9}
              className="text-mute"
              aria-hidden="true"
            />
          </Link>
          <p className="type-micro text-mute pb-2">{colophon}</p>
        </div>
      </div>
    );
  }

  /* ── Archive has something — resurface it ────────────────────────────
   * Masthead, colophon, the item that came back, then the full three
   * ways in. All three doors are live when the archive holds anything.
   * ─────────────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* type-masthead once, on THE BOOK. Nothing else on this surface
          takes it.

          font-size override: type-masthead gives clamp(3rem, 15vw, 5rem)
          = 59px at 393px, which leaves 79px short of the column edge.
          "Edge to edge" is the entire justification for extending this
          token beyond the login door.

          calc((100vw - 2.5rem) / 4.663) scales the glyph to fill the
          column (viewport minus 2 × px-5 padding) at any mobile width,
          with ~1px of clearance at every measured width. The measured
          glyph-to-font ratio is 4.64986–4.65096; a divisor of 4.65 sits
          on the wrong side of it and wraps. 4.663 produces glyph ≤
          measure−0.9px at every width from 320 to 430. The clamp floors
          at 3.5rem below ~300px and ceilings at 6.5rem above ~620px.

          All other type-masthead properties (line-height, tracking,
          weight, text-transform) are inherited unchanged. */}
      <h1
        className="type-masthead text-ink"
        style={{ fontSize: "clamp(3.5rem, calc((100vw - 2.5rem) / 4.663), 6.5rem)" }}
      >
        The book
      </h1>

      {/* Colophon — dates the object. type-micro: the quietest token,
          appropriate for permanent metadata that never changes. */}
      <p className="type-micro text-mute mt-2">{colophon}</p>

      {/* Resurfaced item — what came back */}
      <ResurfacedItem returned={returned} />

      {/* Three ways in — type on hairline rules, not cards, not identical rows.
          Stagger entrance on the sections below the item (≤50ms, per spec).
          The item itself does not animate in.

          margin-top: calc(3.5rem + var(--dock-footprint)).
          3.5rem base + --dock-footprint (80px at devices without safe-area
          inset) = 136px total between the resurfaced item and this section.

          LOAD-BEARING. §2.1: the pocket is never in the dock and never
          clipped by it; at the primary viewport it rests below the fold.
          The worst case is a 1200×900 photograph
          with a one-line caption: without the full 3.5rem the lock icon tops
          out at y 844.7, a 7.3px arc above the fold. With it: y 860.7, 8.7px
          below. Reclaiming 16px (→ 2.5rem) restores the sliver; reclaiming
          8px (→ 3rem) leaves 0.7px — this branch has been caught at that
          margin twice. */}
      <div className="mt-[calc(3.5rem_+_var(--dock-footprint))]">
        {/* Ask for something — SORDJATI's pill-label-beside-circular-button.
            Search glyph, not RefreshCw: this is finding in their archive,
            quoting them word for word, never regenerating or inventing. */}
        <hr className="border-t border-line" />
        <Link
          href="/echo"
          className="stagger-child flex items-center justify-between py-5 press"
          style={{ "--i": 0 } as CSSProperties}
          aria-label="Ask for something — Echo"
        >
          <span className="pill-ink rounded-full px-4 py-2 type-label">
            Ask for something
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-mute"
            aria-hidden="true"
          >
            <Search size={15} strokeWidth={1.9} />
          </span>
        </Link>

        {/* The days in order — a rule with a small arrow */}
        <hr className="border-t border-line" />
        <Link
          href="/book/days"
          className="stagger-child flex items-center justify-between py-5 press"
          style={{ "--i": 1 } as CSSProperties}
          aria-label="The days in order"
        >
          <span className="type-title text-ink">The days in order</span>
          <ArrowUpRight
            size={18}
            strokeWidth={1.9}
            className="text-mute"
            aria-hidden="true"
          />
        </Link>

        {/* The pocket — lock only, unlabelled.
            VISION §2.1: a labelled navigation entry is a signpost pointing
            at the private thing. Two users forever — they know what the
            lock is. Never add it to the dock.

            No z-index. The lock passes behind the dock pill like every
            other piece of content — that is the only reading consistent
            with §2.1. The section's margin-top keeps the lock row below
            the fold at scrollY=0 regardless of the resurfaced photo's
            aspect ratio, so the pill never occludes it on first paint. */}
        <hr className="border-t border-line" />
        <Link
          href="/pocket"
          className="stagger-child flex justify-end py-5 press"
          style={{ "--i": 2 } as CSSProperties}
          aria-label="The pocket"
        >
          <Lock
            size={18}
            strokeWidth={1.9}
            className="text-mute"
            aria-hidden="true"
          />
        </Link>
        <hr className="border-t border-line" />
      </div>
    </div>
  );
}
