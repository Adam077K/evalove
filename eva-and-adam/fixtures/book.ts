import type { BookEntry, DaysTogether, SharedDay } from "@/lib/types";
import { PHOTOS } from "./photos";
import { STORY_FINISHED } from "./dates";

/**
 * The book is a list of days that happened, not a calendar of days.
 * 2026-08-01 has no entry here on purpose: neither posted, so the
 * book skips from July 31st to today in silence.
 */
export const BOOK_ENTRIES: BookEntry[] = [
  /* the opening gathering — plates from before, no dates */
  { id: "b1", position: 1, kind: "plate", photo: PHOTOS["seed-eva-1"]! },
  { id: "b2", position: 2, kind: "plate", photo: PHOTOS["seed-eva-2"]! },
  { id: "b3", position: 3, kind: "plate", photo: PHOTOS["seed-eva-3"]! },
  { id: "b4", position: 4, kind: "plate", photo: PHOTOS["seed-adam-1"]! },
  { id: "b5", position: 5, kind: "plate", photo: PHOTOS["seed-adam-2"]! },

  /* dated leaves */
  { id: "b6", position: 6, kind: "spread", sharedDay: "2026-07-29",
    eva: PHOTOS["d0729-eva"]!, adam: PHOTOS["d0729-adam"]! },
  { id: "b7", position: 7, kind: "spread", sharedDay: "2026-07-30",
    eva: PHOTOS["d0730-eva"]!, adam: PHOTOS["d0730-adam"]! },
  /* a day that closed half-finished — a single plate, a complete page */
  { id: "b8", position: 8, kind: "plate", sharedDay: "2026-07-31",
    photo: PHOTOS["d0731-eva"]! },
  /* a finished date, interleaved by its day */
  { id: "b9", position: 9, kind: "date-page", sharedDay: "2026-07-31",
    dateSession: STORY_FINISHED },
];

/** Today — Adam has posted; Eva's side is still coming. */
export const TODAY: SharedDay = {
  day: "2026-08-02",
  eva: null,
  adam: PHOTOS["d0802-adam"]!,
  complete: false,
  stillOpen: true,
};

export const DAYS_TOGETHER: DaysTogether = {
  count: 41,
  words: "Forty-one days, both of us.",
};

export const BEGUN = "Begun 2 August 2026";
