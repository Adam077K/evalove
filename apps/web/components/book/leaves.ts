import type { Photo, SharedDay } from "@/lib/types";

/**
 * The book's leaves — the kept days, newest first.
 *
 * Just the shape. Extracted from /book/days so the same pages can be
 * turned INSIDE the opened book on /book: one book, reachable two ways,
 * one list — built by whoever has the data, never by this file.
 *
 * The fixture-only builder that used to live here (`bookLeaves()`, reading
 * `SHARED_DAYS`/`PHOTOS` directly) moved to `lib/data/archive.ts` as
 * `liveBookLeaves`, the real equivalent against the database. The guarantee
 * that makes every caller of it safe: a day is a row that happened, never a
 * date range iterated into a grid. A missed day has no row.
 */

export interface BookLeaf {
  /**
   * Unique per leaf, never assumed to equal `day.date`.
   *
   * A day that kept its ordinary one-or-two-photo pairing is the only leaf
   * on its date, so `day.date` alone used to be a safe React key
   * (`DaysTurner.tsx`, `BookObject.tsx`). Once curated pages from
   * `book_entries` can add several more single-photo leaves to the SAME
   * calendar day (a day with many photographs gets a few pages, not one
   * crowded one — see `lib/data/archive.ts`), two leaves sharing a date is
   * the normal case, not a bug, and `day.date` stops being unique. Every
   * leaf builder sets this explicitly instead: the daily builder uses the
   * date itself (still unique among daily leaves), the curated builder uses
   * the book entry's own id.
   */
  key: string;
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /**
   * A curated leaf (`book_entries`) whose photo is deliberately unsigned
   * (`authorMemberId === null`, migration 12) — never set alongside
   * `evaPhoto`/`adamPhoto`, since a curated leaf is always exactly one
   * photograph (`lib/data/archive.ts`'s `toCuratedLeaf`) and a daily leaf's
   * photos are always signed (`commitPhoto` refuses an unsigned `"daily"`
   * commit). `Spread` renders it through `SingleFigure`, same as a signed
   * single, but in the app's own voice (`unsignedHandClass`) rather than
   * either hand.
   */
  unsignedPhoto?: Photo;
}
