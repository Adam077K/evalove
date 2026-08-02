import type { BookEntry, DaysTogether, IsoDate, SharedDay } from "@/lib/types";
import { PHOTOS } from "./photos";
import { STORY_FINISHED } from "./dates";

/**
 * The book is a list of days that happened, not a calendar of days.
 * 2026-08-01 has no row here on purpose: neither posted, so the book
 * skips from July 31st to today in silence. Nothing may ever iterate
 * a date range to render leaves.
 */
export const SHARED_DAYS: SharedDay[] = [
  {
    date: "2026-07-29",
    evaPosted: true,
    adamPosted: true,
    bothPosted: true,
    photoCount: 2,
    firstPostAt: PHOTOS["d0729-adam"].createdAt,
    lastPostAt: PHOTOS["d0729-eva"].createdAt,
  },
  {
    date: "2026-07-30",
    evaPosted: true,
    adamPosted: true,
    bothPosted: true,
    photoCount: 2,
    firstPostAt: PHOTOS["d0730-adam"].createdAt,
    lastPostAt: PHOTOS["d0730-eva"].createdAt,
  },
  /* closed half-finished — Eva's photograph re-laid as a single plate */
  {
    date: "2026-07-31",
    evaPosted: true,
    adamPosted: false,
    bothPosted: false,
    photoCount: 1,
    firstPostAt: PHOTOS["d0731-eva"].createdAt,
    lastPostAt: PHOTOS["d0731-eva"].createdAt,
  },
  /* today — still open; Adam has posted, Eva's side is coming */
  {
    date: "2026-08-02",
    evaPosted: false,
    adamPosted: true,
    bothPosted: false,
    photoCount: 1,
    firstPostAt: PHOTOS["d0802-adam"].createdAt,
    lastPostAt: PHOTOS["d0802-adam"].createdAt,
  },
];

let n = 0;
const entryId = () =>
  `6c33b1f0-2e44-4a5b-9d10-${String(++n).padStart(12, "0")}`;

/**
 * Curated entries: the opening gathering's plates (in the order each
 * person picked them — that order is a curation choice) and finished
 * dates. Daily spreads are NOT book entries; they derive from
 * `SHARED_DAYS`, which is what keeps a missed day silent.
 */
export const BOOK_ENTRIES: BookEntry[] = [
  { id: entryId(), position: 10, photoId: PHOTOS["seed-eva-1"].id, createdAt: PHOTOS["seed-eva-1"].createdAt },
  { id: entryId(), position: 20, photoId: PHOTOS["seed-eva-2"].id, createdAt: PHOTOS["seed-eva-2"].createdAt },
  { id: entryId(), position: 30, photoId: PHOTOS["seed-eva-3"].id, createdAt: PHOTOS["seed-eva-3"].createdAt },
  { id: entryId(), position: 40, photoId: PHOTOS["seed-adam-1"].id, createdAt: PHOTOS["seed-adam-1"].createdAt },
  { id: entryId(), position: 50, photoId: PHOTOS["seed-adam-2"].id, createdAt: PHOTOS["seed-adam-2"].createdAt },
  /* a finished date, interleaved under its day */
  {
    id: entryId(),
    position: 60,
    dateId: STORY_FINISHED.id,
    dateLabel: "the night of the ferry",
    createdAt: STORY_FINISHED.finishedAt ?? STORY_FINISHED.createdAt,
  },
];

/** The day the finished-date page files under, keyed by session id. */
export const DATE_PAGE_DAYS: Record<string, IsoDate> = {
  [STORY_FINISHED.id]: "2026-07-31",
};

export const DAYS_TOGETHER: DaysTogether = { count: 41 };

export const BEGUN: IsoDate = "2026-08-02";
