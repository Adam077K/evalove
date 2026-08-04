import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock, Search } from "lucide-react";
import { whatCameBack } from "@/lib/resurface";
import { BEGUN, BOOK_ENTRIES, SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { Paper } from "@/components/materials";
import { BookCover } from "@/components/book/BookCover";
import { BookSheet } from "@/components/book/BookSheet";
import { ResurfacedItem } from "@/components/book/ResurfacedItem";

export const metadata: Metadata = {
  title: "The book — Eva & Adam",
};

/**
 * The Book — the object they made, on your lap.
 *
 * ALWAYS PAPER, no exceptions (§1). At night this surface is the same
 * paper under amber lamplight from lower-left — a lit reading room,
 * never a dark canvas, never the city sky. Moving Today → Book is
 * turning away from the window and looking down at your lap: one
 * continuous room, two directions of gaze.
 *
 * One scroll, three moments of one object:
 *
 *   1  The closed book — the masthead (§4: "The Book has a cover").
 *      Cloth boards, blind-stamped EVA & ADAM, the colophon, and the
 *      fore-edge whose width is the archive's only expression of
 *      size: felt weight, never a number. The ribbon hangs toward
 *      what it holds.
 *
 *   2  The opening — scrolling down follows the ribbon to the page it
 *      held: the one item from the archive relevant right now.
 *      `whatCameBack` (lib/resurface) is the live wiring and survives
 *      any re-skin. P4's withdrawal condition holds: the default view
 *      resurfaces by association; absences are not addressable.
 *
 *   3  The doors — the days in order (chronology one tap away, never
 *      the default), Echo (quoting, never inventing), and the pocket
 *      lock. Quiet type on hairline rules, on the table.
 *
 * Day one — the archive genuinely empty — is a new book: thin
 * fore-edge, bare bone paper at the opening. Bare paper is a clear
 * table, not a container waiting to be filled (§4): no copy, no
 * dashed rectangle, no promise. Echo and the days suppress (nothing
 * to quote; an empty room); the lock works from day one.
 *
 * No count on this page — nothing calls completeDays() or renders a
 * number of days. The colophon dates the object; the fore-edge
 * carries its weight. Forced-state rendering for QA lives at
 * /review/book-states; no state-override parameter here, ever.
 */

/**
 * How many leaves the book holds: kept days (days that happened —
 * SHARED_DAYS is a list of days, never an iterated range) plus the
 * gathering's curated pages, two entries to a leaf. Feeds the
 * fore-edge width only. Never rendered as a number.
 */
function leafCount(): number {
  const keptDays = SHARED_DAYS.filter(
    (d) => d.date !== FIXTURE_TODAY && (d.evaPosted || d.adamPosted),
  ).length;
  return keptDays + Math.ceil(BOOK_ENTRIES.length / 2);
}

/**
 * The reading lamp, lower-left (§1: "the same paper stocks lit by
 * amber lamplight from lower-left"). A pool of night-amber painted on
 * the SUBSTRATE only: it sits above the stock and below every object
 * and every line of text, so nothing dims twice (§9.3) and no
 * photograph is ever touched. --lamp-dim drives it to zero by day.
 */
const LAMPLIGHT: CSSProperties = {
  background:
    "radial-gradient(110% 72% at 8% 100%, rgb(212 137 42 / calc(var(--lamp-dim, 0) * 0.17)), rgb(212 137 42 / 0) 62%)",
};

export default function BookPage() {
  const returned = whatCameBack(new Date());
  const leaves = leafCount();

  return (
    /* Escape the (app) column on all four sides — the room runs edge
       to edge, like Today's. overflow-x-clip keeps the spine's
       off-screen bleed from becoming a horizontal scroll. */
    <div className="-mx-5 -mt-[max(1.5rem,env(safe-area-inset-top))] -mb-[calc(var(--dock-footprint)+4rem)] overflow-x-clip md:-mx-8">
      <Paper
        stock="coldpress"
        className="pb-[calc(var(--dock-footprint)+3rem)] pt-[max(2.25rem,env(safe-area-inset-top))]"
      >
        {/* isolate: the lamplight needs a stacking context so -z-10
            lands above the Paper stock and under all content. */}
        <div className="relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={LAMPLIGHT}
          />

          <h1 className="sr-only">The book</h1>

          {/* ---- 1 · The closed book ---- */}
          {/* pr-6 keeps the fore-edge fully on screen with room to
              grow; the spine takes the one bleed edge on the left.
              The bottom margin clears the hanging ribbon's tail. */}
          <div className="mb-36 pr-6">
            <BookCover leafCount={leaves} begun={BEGUN} />
          </div>

          {/* ---- 2 · The opening ---- */}
          <div className="px-5 md:px-8">
            {returned !== null ? (
              <BookSheet ribbon>
                <ResurfacedItem returned={returned} />
              </BookSheet>
            ) : (
              /* Day one: bare paper. A clear table, not an empty
                 container — no copy, no reserved rectangle. The
                 sheet's height is a page's presence, nothing more. */
              <BookSheet>
                <div className="h-[42dvh]" aria-hidden="true" />
              </BookSheet>
            )}
          </div>

          {/* ---- 3 · The doors — type on hairline rules ---- */}
          <div className="mt-20 px-5 md:px-8">
            {returned !== null && (
              <>
                {/* Ask for something — Echo quotes their archive word
                    for word; Search glyph, never a regenerate glyph. */}
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
              </>
            )}

            {/* The pocket — lock only, unlabelled (VISION §2.1: a
                labelled entry is a signpost pointing at the private
                thing; two users forever — they know what the lock
                is). Works from day one. No z-index: content passes
                behind the dock pill like everything else. */}
            <hr className="border-t border-line" />
            <Link
              href="/pocket"
              className="stagger-child flex justify-end py-5 press"
              style={{ "--i": returned !== null ? 2 : 0 } as CSSProperties}
              aria-label="The pocket"
            >
              <Lock size={18} strokeWidth={1.9} className="text-mute" aria-hidden="true" />
            </Link>
            <hr className="border-t border-line" />
          </div>
        </div>
      </Paper>
    </div>
  );
}
