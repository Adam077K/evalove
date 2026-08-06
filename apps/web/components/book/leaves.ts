import type { Photo, SharedDay } from "@/lib/types";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { ADAM, EVA } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";

/**
 * The book's leaves — the kept days, newest first.
 *
 * Extracted from /book/days so the same pages can be turned INSIDE
 * the opened book on /book: one book, reachable two ways, one list.
 *
 * The guarantee that makes every caller safe is in the fixture:
 * `SHARED_DAYS` is a list of days that happened, never a date range
 * iterated into a grid. A missed day has no row. Nothing here may
 * iterate a date range.
 */

export interface BookLeaf {
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
}

export function bookLeaves(): BookLeaf[] {
  const daily = Object.values(PHOTOS).filter((p) => p.kind === "daily");
  return SHARED_DAYS.filter(
    (d) => d.date !== FIXTURE_TODAY && (d.evaPosted || d.adamPosted),
  )
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((day) => ({
      day,
      evaPhoto: daily.find(
        (p) => p.sharedDay === day.date && p.authorMemberId === EVA.id,
      ),
      adamPhoto: daily.find(
        (p) => p.sharedDay === day.date && p.authorMemberId === ADAM.id,
      ),
    }));
}
