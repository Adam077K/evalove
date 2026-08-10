import type { Metadata } from "next";
import { DatesScreen } from "@/components/dates/DatesScreen";
import { WINDOW_STRINGS } from "@/lib/window-strings";
import { currentWindow, sharedDayOf, SHARED_DAY_OPEN_TZ } from "@/lib/shared-day";
import { dateDeps, datesBetweenThem, listPhotos, photoDeps } from "@/lib/data";

import type { DatePlanPhotos } from "@/components/dates/BetweenThem";
import type { MemberLite } from "@/components/dates/plan-copy";
import type { DatePlan } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dates — Eva & Adam",
};

/** Reads the live tables. Never prerendered. */
export const dynamic = "force-dynamic";

/** How many happened dates get their photographs pulled. */
const PAGES_SHOWN = 4;

interface LiveDates {
  proposed: DatePlan[];
  agreed: DatePlan[];
  happened: DatePlan[];
  members: MemberLite[];
  photosByDay: DatePlanPhotos;
}

/**
 * Everything the two live sections need, or nothing at all.
 *
 * `date_plans` is the one table in this schema that has never been applied
 * anywhere — it is handed to the founder as SQL to run by hand. Until they run
 * it, every read here fails, and this page must still be a working screen:
 * the proposal above needs no database, the seven kinds are content, and the
 * idea shelf is a fixture. So a failed read yields empty lists and a loud,
 * structured server log — never a 500, and never a caught-and-forgotten
 * silence. The truth surfaces where it matters: the first tap on Ask returns
 * the sentence naming the migration.
 */
async function liveDates(): Promise<LiveDates> {
  const empty: LiveDates = {
    proposed: [],
    agreed: [],
    happened: [],
    members: [],
    photosByDay: {},
  };

  try {
    const deps = dateDeps();
    const [between, roster] = await Promise.all([
      datesBetweenThem(deps),
      deps.gateway.listMembers(),
    ]);

    const members: MemberLite[] = roster.map((m) => ({
      id: m.id,
      slug: m.slug,
      displayName: m.display_name,
    }));

    // The page a date left behind: the photographs filed under its own shared
    // day. `photos.shared_day` is the entire link — no join table, no
    // `photo_id` column. Every kind, not only dailies: a photograph either of
    // them left on that day is what the date produced, whatever the app
    // happened to label it.
    const photos = photoDeps();
    const days = between.happened.slice(0, PAGES_SHOWN).map((p) => p.sharedDay);
    const pages = await Promise.all(
      days.map(async (day) => {
        const { photos: found } = await listPhotos(photos, {
          from: day,
          to: day,
          limit: 4,
        });
        return [day, found] as const;
      }),
    );

    return {
      proposed: between.proposed,
      agreed: between.agreed,
      happened: between.happened,
      members,
      photosByDay: Object.fromEntries(pages),
    };
  } catch (thrown) {
    console.error(
      JSON.stringify({
        level: "error",
        operation: "GET /dates",
        kind: "dates_read_unavailable",
        message: thrown instanceof Error ? thrown.message : String(thrown),
        note:
          "the Dates page rendered without the proposed/agreed/happened " +
          "sections. If this is a missing relation, apply " +
          "supabase/migrations/20260810120000_date_plans.sql.",
      }),
    );
    return empty;
  }
}

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
export default async function DatesPage() {
  const now = new Date();
  const windowId = currentWindow(now);
  const windowLine = windowId !== null ? (WINDOW_STRINGS[windowId] ?? null) : null;
  const live = await liveDates();

  return (
    <DatesScreen
      windowLine={windowLine}
      today={sharedDayOf(now, SHARED_DAY_OPEN_TZ)}
      proposed={live.proposed}
      agreed={live.agreed}
      happened={live.happened}
      members={live.members}
      photosByDay={live.photosByDay}
    />
  );
}
