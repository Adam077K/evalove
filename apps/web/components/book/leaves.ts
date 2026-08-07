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
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
}
