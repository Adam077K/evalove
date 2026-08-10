/* eslint-disable @next/next/no-img-element -- the skylines are keyed
   illustration plates; the optimizer must never re-encode their alpha. */

import { Column } from "@/components/chrome/Column";
import { Paper, Seam } from "@/components/materials";
import { BetweenThem } from "@/components/dates/BetweenThem";
import { DatesExplorer } from "@/components/dates/DatesExplorer";
import { HostedDates } from "@/components/dates/HostedDates";
import { ProposeADate } from "@/components/dates/ProposeADate";

import type { DatePlanPhotos } from "@/components/dates/BetweenThem";
import type { MemberLite } from "@/components/dates/plan-copy";
import type { DatePlan, IsoDate } from "@/lib/types";

/**
 * The whole Dates screen, given its data.
 *
 * Split out of `app/(app)/dates/page.tsx` so the screen can be rendered
 * without a session. Every route in this app requires one, and no agent in
 * this environment can obtain one — which is exactly how seven QA passes were
 * issued on code nobody had looked at. `app/(app)/review/dates/page.tsx`
 * renders THIS component, with representative plans, so what gets judged at
 * 393x852 is the shipping composition and not a sketch of it.
 *
 * The page above owns the reads; this owns the composition. Nothing here
 * touches a database.
 *
 * ORDER, TOP TO BOTTOM: the night window · the seam · the paper. On the paper:
 * asking for a date, then what is between them, then the two shelves that were
 * already here. See the note on the ordering inside.
 */

export interface DatesScreenProps {
  /** The app's own window sentence, live from `lib/shared-day`. */
  windowLine: string | null;
  /** The shared day the viewer is living. */
  today: IsoDate;
  proposed: readonly DatePlan[];
  agreed: readonly DatePlan[];
  happened: readonly DatePlan[];
  members: readonly MemberLite[];
  photosByDay: DatePlanPhotos;
}

export function DatesScreen({
  windowLine,
  today,
  proposed,
  agreed,
  happened,
  members,
  photosByDay,
}: DatesScreenProps) {
  return (
    <>
      {/* DECO — the window: the night sky, the window sentence, the two
          cities, and the shores. The distance between them.
          Place, not time: renders identically in both modes (the --night-*
          tokens are :root constants).

          TRIMMED, 2026-08-10, for the reason the whole feature exists. At
          393x852 this band plus the seam spent roughly 600px — three
          quarters of the viewport — before a single thing a person could
          act on. That is the mechanical half of "I don't know where are the
          dates": the answer was below the fold on arrival, every time. The
          band keeps every element it had (the sentence, both cities, both
          shores); it spends less height on air. Figures changed: pt-9 → pt-5,
          the sentence's mt-6 → mt-4, the cities' mt-10 → mt-5, the shore
          plate 228 → 140, the seam 190 → 120.

          The figures are what they are because they were measured, not
          guessed: at the first trim the kind card's own title still landed at
          774px with the dock's tray starting at 783, so the one thing on this
          screen worth pressing was a nine-pixel sliver under a tray. These
          figures put it clear of it. */}
      <section className="relative bg-night-sky pt-5">
        <div className="px-5 md:px-8">
          {/* The window sentence — the app's own voice, live from
              lib/shared-day. Never a w-code. */}
          {windowLine !== null && (
            <p className="type-title mt-4 italic text-night-ink">{windowLine}.</p>
          )}

          {/* The two cities — Poiret One, DECO only, ≥32px only.
              New York first; the gold is hers (brass, like her pin). */}
          <h2 className="font-deco mt-5 text-[34px] tracking-[0.18em] text-night-gold">
            NEW YORK
          </h2>
          <h2 className="font-deco mt-1 text-[32px] tracking-[0.22em] text-night-mute">
            TEL AVIV
          </h2>
        </div>

        {/* The window view — two shores and the space between.
            The plates are keyed (border-connected flood fill, §9.7).
            Neither city is "the far one"; they are both "here", one per
            person. The plates keep their own aspect and are cropped harder
            from below, so the crowns still sit under the names. */}
        <div className="relative mt-2 h-[140px] overflow-hidden">
          <img
            src="/materials/deco-nyc-shore.webp"
            alt=""
            aria-hidden="true"
            width={640}
            height={638}
            className="absolute -bottom-6 -left-4 w-[54%] max-w-none"
          />
          <img
            src="/materials/deco-tlv-shore.webp"
            alt=""
            aria-hidden="true"
            width={724}
            height={525}
            className="absolute -bottom-2 -right-6 w-[50%] max-w-none"
          />
        </div>
      </section>

      {/* The Seam — tears out of the night above into the paper below.
          rotated = point-reflected 180°: its night-sky falloff sits at
          the top (matching bg-night-sky above), its transparent edge at
          the bottom lets the Paper show through.

          120, AND `Seam`'S OWN "~180 FLOOR" DOES NOT APPLY HERE. That
          warning ("anything under ~180 starts cropping the tear itself")
          is written for the un-rotated orientation, where the strip's
          meander is at the bottom and shortening the box clips it away.
          Rotated, the box is point-reflected before it paints: the clip
          still takes from the bottom of the LAYOUT, which is the image's
          own top rows — the flush, fully-opaque end — and the meander,
          living in the asset's final ~15%, ends up at the top of the box
          where nothing reaches it.

          Measured, not reasoned: the fibre renders 145px tall at 393px
          wide (1344x497, ratio 0.3698) inside a 120px box, and a 3x
          capture of the join shows a fibrous torn edge under the
          skyline with continuous paper below it and no visible seam.
          The flush end being shorter costs nothing because the strip is
          the `-tostock` derivative, graded to this exact coldpress
          stock, so the paper below continues it invisibly by
          construction. Re-measure if the asset is ever regenerated. */}
      <Seam rotated height={120} />

      {/* PAPER — the dates content.
          `<Paper>` wraps `<Column>` so every `.card` reads as a plate
          laid on the page (globals.css). */}
      <Paper stock="coldpress">
        <Column>
          <header className="mb-6">
            <p className="type-micro text-mute">for the two of them</p>
            <h1 className="type-hero mt-1.5 text-ink">Dates</h1>
          </header>

          {/* ORDER IS THE FIX. The founder could not find this feature —
              "where is the date thing? I don't know where are the dates" —
              and the route was already one tap from the dock, so the failure
              was never navigation. It was that arriving here showed two
              shelves of reading and nothing anybody could do. Asking for a
              date is the first object on the paper; the two shelves that were
              already here follow it.

              space-y-8, not space-y-10 — part of the same first-paint
              dock-clip fix as /book: at 393x852 the last heading sat inside
              the fixed dock's tray on arrival. Trimmed here rather than
              inside HostedDates' own seeded rhythm, which stays as
              designed. */}
          <div className="space-y-8">
            <ProposeADate today={today} members={members} />
            <BetweenThem
              proposed={proposed}
              agreed={agreed}
              happened={happened}
              members={members}
              photosByDay={photosByDay}
            />
            <HostedDates />
            <DatesExplorer />
          </div>
        </Column>
      </Paper>
    </>
  );
}
