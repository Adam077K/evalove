/* eslint-disable @next/next/no-img-element -- the skylines are keyed
   illustration plates; the optimizer must never re-encode their alpha. */

import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Paper, Seam } from "@/components/materials";
import { TodayPairContent } from "@/components/home/TodayPair";
import { TodayDoorway } from "@/components/home/TodayDoorway";
import { SealedCard } from "@/components/home/SealedCard";
import Stamp, { UnsignedMark } from "@/components/item/Stamp";
import { authorshipOf } from "@/components/book/compose";
import { WINDOW_STRINGS } from "@/lib/window-strings";
import { currentWindow } from "@/lib/shared-day";
import { offsetNote } from "@/lib/stamp";
import { photoDeps } from "@/lib/data";
import { liveTodayObject } from "@/lib/data/today";
import { liveWhatCameBack } from "@/lib/data/archive";
import { parseProfile, PROFILE_KEY } from "@/lib/session/profile";
import type { MemberSlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Today — Eva & Adam",
};

/**
 * Which of the two is holding the phone, for `todaySnapshot`'s day
 * boundary. Reads the same `profile` cookie `lib/viewer.ts` reads
 * client-side and `getIdentity()` reads server-side — attribution, not
 * authentication (see `lib/session/profile.ts`), so a bare cookie read is
 * the documented way to get at it; there is nothing here for a fourth
 * reader to protect. Eva-first when nobody has tapped a name yet, matching
 * `useViewer()`'s own fallback.
 */
async function currentViewerSlug(): Promise<MemberSlug> {
  const jar = await cookies();
  return parseProfile(jar.get(PROFILE_KEY)?.value) ?? "eva";
}

/**
 * Today — the room the app opens into. One continuous space, two
 * worlds (design law §1, revised 2026-08-04):
 *
 *   PAPER — the table: the photograph(s), the caption in their hand,
 *           the sealed note. What they made.
 *   the Seam — the paper tears, light dies past it. Place, not time:
 *           it renders identically in both modes.
 *   DECO — the window: the stamp, the window sentence, the two
 *           cities. The distance between them.
 *   the corner — The Book intruding from the bottom edge: turning
 *           away from the window and looking down at your lap.
 *
 * The clock does not select any of this. Light/dark dims the paper
 * (tokens + the lamp); it never converts a paper section into a deco
 * one. Scrolling down is lifting your eyes from the table to the
 * window — never two stacked panels with a hard edge.
 *
 * Live wiring that must survive any re-skin: `currentWindow`
 * (lib/shared-day — untouchable), `offsetNote` (lib/stamp),
 * `liveWhatCameBack` (inside TodayDoorway's `returned` prop). The
 * photographs themselves are real too — `liveTodayObject` (`lib/data/
 * today.ts`) reads `todaySnapshot`/`listPhotos` against the database, with
 * fixtures reachable only from `/review/today-pair` and never from here.
 *
 * No masthead, no greeting, nothing above the item (§0). The
 * photograph is Today's masthead.
 */
export default async function TodayPage() {
  const now = new Date();
  const windowId = currentWindow(now);
  const windowLine = windowId !== null ? (WINDOW_STRINGS[windowId] ?? null) : null;

  const viewerSlug = await currentViewerSlug();
  const [today, returned] = await Promise.all([
    liveTodayObject(photoDeps(), { slug: viewerSlug }),
    liveWhatCameBack(photoDeps(), now),
  ]);

  const dst = offsetNote(today.day);

  /* The same selection the table renders — the stamp below the seam
     describes the thing above it, including the Tuesday fallback. Since
     2026-08-08 the fallback can land on an unsigned "book" plate (founder
     decision, 2026-08-07), so this observes `authorshipOf` first, exactly
     the guard `ResurfacedItem.tsx` already uses, rather than assuming every
     `stampPhoto` has a slug to hand `<Stamp>`. */
  const { stampPhoto } = today;
  const stampMark =
    stampPhoto === undefined
      ? null
      : (() => {
          const authorship = authorshipOf(stampPhoto);
          return authorship.signed ? (
            <Stamp leftAt={stampPhoto.createdAt} authorSlug={authorship.slug} on="night" />
          ) : (
            <UnsignedMark leftAt={stampPhoto.createdAt} tz={stampPhoto.sharedDayTz} on="night" />
          );
        })();

  return (
    /* The shell (`app/(app)/layout.tsx`) is edge-to-edge by default and
       already reserves the band's top clearance and seats this room
       flush against the shared torn edge — there is nothing left to
       escape here. overflow-x-clip keeps the shore images' single-edge
       bleeds (below) from becoming a horizontal scroll; the deco floor
       replaces the dock's own bottom padding with its own night-sky
       run on purpose (Today's corner runs under the tray). */
    <div className="overflow-x-clip">
      {/* ---- PAPER — the table ---- */}
      <Paper stock="coldpress" className="px-5 pb-16 md:px-8">
        <TodayPairContent
          evaPhoto={today.evaPhoto}
          adamPhoto={today.adamPhoto}
          lastLeft={today.lastLeft}
          recentDailies={today.recentDailies}
        />

        {/* The sealed thing, when one is waiting. An object among
            objects — its own offset, never a full-width row. ml-8
            keeps the washi tape's torn end on the table instead of
            being sliced by the viewport's left edge (design-lead
            2026-08-06 §2). */}
        <div className="ml-8 mr-12 mt-12">
          <SealedCard />
        </div>
      </Paper>

      {/* ---- the Seam — no mode check, ever ---- */}
      <Seam />

      {/* ---- DECO — the window ---- */}
      <section className="relative bg-night-sky pt-9">
        <div className="px-5 md:px-8">
          {/* The stamp — the app observing the thing above the tear:
              typeset, absolute, both clocks. DECO's first word. An
              unsigned `stampPhoto` gets the bare-instant mark instead
              (`stampMark`, above) — there is no "other" to report a gap
              against. */}
          {stampMark}

          {/* The window sentence — the app's own voice, live from
              lib/shared-day. Never a w-code. */}
          {windowLine !== null && (
            <p className="type-title mt-6 italic text-night-ink">
              {windowLine}.
            </p>
          )}
          {dst !== null && (
            <p className="type-micro mt-2 normal-case text-night-mute">{dst}</p>
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

            Interleaving the two full panoramas was tried twice and
            failed the same way both times: at phone width the far
            city becomes the visible band, so the depth reads
            inverted, and its cut plate-edge floats as a hard line.
            The scene this window actually describes has a simpler
            geography — New York on the left shore, Tel Aviv on the
            right, and the distance between them empty at the centre.
            The gap is not leftover space; it is the subject, and the
            Book's corner rises out of it.

            The plates are keyed (border-connected flood fill, §9.7),
            the crops are display views derived from the keyed
            masters (the masters stay canonical), and the CSS sky is
            a live layer — the seam falloff lands on it and it can be
            driven by the hour. Each crop keeps its plate's internal
            far towers, so each shore carries its own depth. Both
            cities at full strength, equal weight — neither of them
            is the far one; they are both "here", one per person. */}
        {/* Height judged by eye against the vertical dead zone: at 260
            the band between TEL AVIV and the rooftops read as
            under-filled rather than intended (the horizontal emptiness
            between the shores is the subject; vertical emptiness was
            not). 228 brings the crown up under the names with ~30px of
            true sky left above it. */}
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

        {/* ---- The Book — a physical corner at the bottom edge,
             overlapping the foreground of the window view: looking
             down at your lap. The overlap stays shallow on purpose:
             it clips the shores at street level, never at the towers
             — the sheet is in the room, the cities are outside. ---- */}
        <div className="relative -mt-14">
          <TodayDoorway returned={returned} />
        </div>
      </section>
    </div>
  );
}
