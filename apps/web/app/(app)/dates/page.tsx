/* eslint-disable @next/next/no-img-element -- the skylines are keyed
   illustration plates; the optimizer must never re-encode their alpha. */

import type { Metadata } from "next";
import { Column } from "@/components/chrome/Column";
import { Paper, Seam } from "@/components/materials";
import { DatesExplorer } from "@/components/dates/DatesExplorer";
import { HostedDates } from "@/components/dates/HostedDates";
import { WINDOW_STRINGS } from "@/lib/window-strings";
import { currentWindow } from "@/lib/shared-day";

export const metadata: Metadata = {
  title: "Dates — Eva & Adam",
};

/**
 * Dates — night window above, a torn edge, two shelves of paper below.
 *
 * The night section (window sentence, cities, shores) moved here from
 * Today (founder, 2026-08-08): a calendar of things-to-do is a window
 * onto the distance; a table of what happened is not. Today is now one
 * continuous paper world; Dates is where the Seam and the DECO window
 * live.
 *
 * ORDER: night section → Seam rotated → Paper. The rotated Seam has
 * its night-sky falloff at the top (matching the bg-night-sky section
 * above it) and its transparent paper edge at the bottom (letting the
 * Paper below show through). Placing the Seam above the night section
 * inverts it on both sides.
 *
 * DST note: `offsetNote` was omitted intentionally. It derives from
 * `sharedDayLengthMs(day)` which requires a SharedDay — a date-boundary
 * concept Dates does not compute. No public helper converts `new Date()`
 * to a SharedDay without reaching into lib/shared-day internals (which
 * are untouchable). The DST line is dropped; it belongs to Today's
 * photo context, not a dates listing.
 *
 * Stamp note: the Stamp was omitted intentionally. It describes a
 * specific photograph and Dates has none; placing it here would invent
 * a fact.
 *
 * The hosted dates are the games the app itself runs (a story one
 * line each, twenty questions, the paired question). The idea shelf
 * is the researched library, keyed to the nine real windows two
 * clocks seven hours apart actually produce — browsable by window,
 * opening on the one happening right now.
 *
 * `<Paper>` wraps `<Column>` — see the same note on `/send`. Every
 * `.card` here reads as "a plate laid on the page" (globals.css); it
 * needs a page under it.
 */
export default function DatesPage() {
  const now = new Date();
  const windowId = currentWindow(now);
  const windowLine = windowId !== null ? (WINDOW_STRINGS[windowId] ?? null) : null;

  return (
    <>
      {/* DECO — the window: the night sky, the window sentence, the two
          cities, and the shores. The distance between them.
          Place, not time: renders identically in both modes (the --night-*
          tokens are :root constants). */}
      <section className="relative bg-night-sky pt-9">
        <div className="px-5 md:px-8">
          {/* The window sentence — the app's own voice, live from
              lib/shared-day. Never a w-code. */}
          {windowLine !== null && (
            <p className="type-title mt-6 italic text-night-ink">
              {windowLine}.
            </p>
          )}

          {/* The two cities — Poiret One, DECO only, ≥32px only.
              New York first; the gold is hers (brass, like her pin). */}
          <h2 className="font-deco mt-10 text-[34px] tracking-[0.18em] text-night-gold">
            NEW YORK
          </h2>
          <h2 className="font-deco mt-1 text-[32px] tracking-[0.22em] text-night-mute">
            TEL AVIV
          </h2>
        </div>

        {/* The window view — two shores and the space between.
            The plates are keyed (border-connected flood fill, §9.7).
            Neither city is "the far one"; they are both "here", one per
            person. Height judged by eye: 228 brings the crown up under
            the names with ~30px of true sky left above it. */}
        <div className="relative mt-2 h-[228px] overflow-hidden">
          <img
            src="/materials/deco-nyc-shore.webp"
            alt=""
            aria-hidden="true"
            width={640}
            height={638}
            className="absolute -bottom-10 -left-4 w-[62%] max-w-none"
          />
          <img
            src="/materials/deco-tlv-shore.webp"
            alt=""
            aria-hidden="true"
            width={724}
            height={525}
            className="absolute -bottom-4 -right-6 w-[58%] max-w-none"
          />
        </div>
      </section>

      {/* The Seam — tears out of the night above into the paper below.
          rotated = point-reflected 180°: its night-sky falloff sits at
          the top (matching bg-night-sky above), its transparent edge at
          the bottom lets the Paper show through. 190px is the smallest
          height above the ~180 crop floor for the fibre strip at 393px. */}
      <Seam rotated height={190} />

      {/* PAPER — the dates content.
          `<Paper>` wraps `<Column>` so every `.card` reads as a plate
          laid on the page (globals.css). */}
      <Paper stock="coldpress">
        <Column>
          <header className="mb-6">
            <p className="type-micro text-mute">for the two of them</p>
            <h1 className="type-hero mt-1.5 text-ink">Dates</h1>
          </header>

          {/* space-y-8, not the original space-y-10 — part of the same
              first-paint dock-clip fix as /book: at 393x852 "The idea
              shelf" heading below sat 3-20px inside the fixed dock's
              tray on arrival (tray from 783px). Trimmed here rather than
              inside HostedDates' own seeded rhythm, which stays as
              designed. */}
          <div className="space-y-8">
            <HostedDates />
            <DatesExplorer />
          </div>
        </Column>
      </Paper>
    </>
  );
}
