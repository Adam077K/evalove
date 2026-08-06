import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock, Search } from "lucide-react";
import { whatCameBack } from "@/lib/resurface";
import { BEGUN, BOOK_ENTRIES, SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { Paper } from "@/components/materials";
import { BookObject } from "@/components/book/BookObject";
import { bookLeaves } from "@/components/book/leaves";

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
 * One object and its doors:
 *
 *   1  The book — closed, it is the masthead (§4: "The Book has a
 *      cover"): cloth boards, blind-stamped EVA & ADAM, the colophon,
 *      and the fore-edge whose width is the archive's only expression
 *      of size: felt weight, never a number. TAP IT AND IT OPENS
 *      (founder's ruling — tap, not a drag, for discoverability) to
 *      the page the ribbon held: the one item from the archive
 *      relevant right now. `whatCameBack` (lib/resurface) is the live
 *      wiring and survives any re-skin. P4's withdrawal condition
 *      holds: the default view resurfaces by association; absences
 *      are not addressable. Inside, the kept days turn on the same
 *      thumb-following rail as /book/days. See BookObject.
 *
 *   2  The doors — the days in order (chronology one tap away, never
 *      the default), Echo (quoting, never inventing), and the pocket
 *      lock. Quiet type on hairline rules, on the table.
 *
 * Day one — the archive genuinely empty — is a new book: thin
 * fore-edge, bare bone paper when opened. Bare paper is a clear
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
 *
 * position: FIXED, not absolute — the lamp stands beside the chair,
 * in the room, so its pool holds the lower-left of your VIEW as you
 * scroll. Document-anchored it sat uselessly at the foot of a
 * 2000px page (first night capture). Verify it in viewport shots;
 * full-page captures lie about fixed elements.
 */
const LAMPLIGHT: CSSProperties = {
  /* Two layers, both ×--lamp-dim: the amber pool at the lower-left,
     and the room's shade settling over the top of the view — a lamp
     that has come DOWN is directional, and the first night capture's
     uniform dim read as "nothing happened" rather than "the lamp
     came down" (founder). The shade stays ≤0.12 so night ink never
     approaches the AA floor set in globals §2. */
  background:
    "radial-gradient(130% 88% at 6% 102%, rgb(212 137 42 / calc(var(--lamp-dim, 0) * 0.30)), rgb(212 137 42 / 0) 64%), linear-gradient(to bottom, rgb(20 16 8 / calc(var(--lamp-dim, 0) * 0.12)), rgb(20 16 8 / 0) 42%)",
};

export default function BookPage() {
  const returned = whatCameBack(new Date());
  const leaves = leafCount();
  const pages = bookLeaves();

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
            className="pointer-events-none fixed inset-0 -z-10"
            style={LAMPLIGHT}
          />

          <h1 className="sr-only">The book</h1>

          {/* ---- 1 · The book — tap to open, swipe to turn ---- */}
          {/* pr-6 keeps the fore-edge fully on screen with room to
              grow; the spine takes the one bleed edge on the left.
              The bottom margin clears the hanging ribbon's tail. */}
          <div className="mb-48 pr-6">
            <BookObject
              returned={returned}
              leaves={pages}
              leafCount={leaves}
              begun={BEGUN}
            />
          </div>

          {/* ---- 2 · The doors — type on hairline rules ---- */}
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
