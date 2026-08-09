import type { Metadata } from "next";

import { DatesScreen } from "@/components/dates/DatesScreen";
import { sharedDaysFrom } from "@/lib/date-windows";
import { ADAM, EVA } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";
import { SHARED_DAY_OPEN_TZ, currentWindow, sharedDayOf } from "@/lib/shared-day";
import { WINDOW_STRINGS } from "@/lib/window-strings";

import type { MemberLite } from "@/components/dates/plan-copy";
import type { DatePlan } from "@/lib/types";

export const metadata: Metadata = {
  title: "Review: dates — dev",
};

/**
 * Forces per-request rendering. Without it `next build` serialises this page's
 * RSC tree into a static artifact, fixture strings and all, regardless of the
 * layout's `notFound()`. See `app/(app)/review/layout.tsx`, which explains at
 * length why the 404 alone is not enough — this export and that comment are a
 * pair.
 */
export const dynamic = "force-dynamic";

/**
 * Development review surface for the Dates screen — not reachable from the dock.
 *
 * THE REASON THIS FILE EXISTS. Every product route requires a session, and no
 * agent in this environment can obtain one. Seven QA passes were issued on this
 * codebase by reviewers who had read the diff and never seen the screen, and
 * the founder then called the result unusable. `/review/` is the sanctioned
 * way out of that: it renders `DatesScreen` — the exact component
 * `app/(app)/dates/page.tsx` renders — with plans standing in for a database
 * nobody here can write to, at the only viewport that counts.
 *
 * The plans below are the four states worth looking at at once: something
 * asked and waiting, something both said yes to, and two that happened and
 * left photographs. Real live data will not arrive four-at-a-time; that is the
 * point of a review surface.
 */

const MEMBERS: MemberLite[] = [
  { id: EVA.id, slug: "eva", displayName: EVA.displayName },
  { id: ADAM.id, slug: "adam", displayName: ADAM.displayName },
];

/** The day the review is being looked at, so the clock lines are live. */
const TODAY = sharedDayOf(new Date(), SHARED_DAY_OPEN_TZ);
const AHEAD = sharedDaysFrom(TODAY, 4);

function plan(over: Partial<DatePlan> & Pick<DatePlan, "id" | "kind">): DatePlan {
  return {
    status: "proposed",
    proposedBy: EVA.id,
    sharedDay: AHEAD[1] ?? TODAY,
    windowId: "w6",
    startsAt: `${AHEAD[1] ?? TODAY}T16:00:00.000Z`,
    createdAt: `${TODAY}T09:00:00.000Z`,
    ...over,
  };
}

const PROPOSED: DatePlan[] = [
  plan({
    id: "r-1",
    kind: "two-kitchens",
    proposedBy: EVA.id,
    note: "the one with the anchovies, and you have to actually chop",
  }),
];

const AGREED: DatePlan[] = [
  plan({
    id: "r-2",
    kind: "same-film",
    proposedBy: ADAM.id,
    sharedDay: AHEAD[3] ?? TODAY,
    windowId: "w7",
    startsAt: `${AHEAD[3] ?? TODAY}T19:00:00.000Z`,
    status: "agreed",
    answeredBy: EVA.id,
    answeredAt: `${TODAY}T10:00:00.000Z`,
  }),
];

const HAPPENED: DatePlan[] = [
  plan({
    id: "r-3",
    kind: "the-same-hour-walk",
    proposedBy: EVA.id,
    sharedDay: "2026-07-30",
    windowId: "w5",
    startsAt: "2026-07-30T14:00:00.000Z",
    status: "happened",
    answeredBy: ADAM.id,
    answeredAt: "2026-07-29T10:00:00.000Z",
    happenedAt: "2026-07-30T15:00:00.000Z",
  }),
  plan({
    id: "r-4",
    kind: "the-mirrored-errand",
    proposedBy: ADAM.id,
    sharedDay: "2026-07-31",
    windowId: "w4",
    startsAt: "2026-07-31T12:00:00.000Z",
    status: "happened",
    answeredBy: EVA.id,
    answeredAt: "2026-07-30T10:00:00.000Z",
    happenedAt: "2026-07-31T13:00:00.000Z",
  }),
];

/**
 * The photographs each happened date left behind.
 *
 * Keyed by shared day, exactly as the live page keys them — `photos.shared_day`
 * is the whole link between a date and its page, and this surface has to
 * exercise that key rather than hand the component a list directly, or the one
 * thing worth reviewing about this section goes unreviewed.
 */
const PAGES = {
  "2026-07-30": [PHOTOS["d0730-eva"], PHOTOS["d0730-adam"]].filter(
    (p) => p !== undefined,
  ),
  "2026-07-31": [PHOTOS["d0731-eva"]].filter((p) => p !== undefined),
};

export default function ReviewDatesPage() {
  const windowId = currentWindow(new Date());
  const windowLine = windowId !== null ? (WINDOW_STRINGS[windowId] ?? null) : null;

  return (
    <DatesScreen
      windowLine={windowLine}
      today={TODAY}
      proposed={PROPOSED}
      agreed={AGREED}
      happened={HAPPENED}
      members={MEMBERS}
      photosByDay={PAGES}
    />
  );
}
