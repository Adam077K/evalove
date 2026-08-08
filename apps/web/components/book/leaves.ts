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
   * `book_entries` can add several more leaves to the SAME calendar day (a
   * day with many photographs gets a few pages, not one crowded one — see
   * `lib/data/archive.ts`), two leaves sharing a date is the normal case,
   * not a bug, and `day.date` stops being unique. Every leaf builder sets
   * this explicitly instead: the daily builder uses the date itself (still
   * unique among daily leaves), the curated builder uses its book entries'
   * own ids (one id for a single-photo leaf, every id in the group for a
   * multi-photo one — see `photos` below).
   */
  key: string;
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /**
   * A curated leaf (`book_entries`) whose photo is deliberately unsigned
   * (`authorMemberId === null`, migration 12) — never set alongside
   * `evaPhoto`/`adamPhoto`, since a single-photo curated leaf carries
   * exactly one photograph (`lib/data/archive.ts`'s `toCuratedLeaf`) and a
   * daily leaf's photos are always signed (`commitPhoto` refuses an
   * unsigned `"daily"` commit). `Spread` renders it through `SingleFigure`,
   * same as a signed single, but in the app's own voice
   * (`unsignedHandClass`) rather than either hand. Never set alongside
   * `photos` either — see below.
   */
  unsignedPhoto?: Photo;
  /**
   * A curated leaf holding MORE than one photograph — 2 to
   * `MAX_PHOTOS_PER_CURATED_PAGE` (`lib/data/archive.ts`'s
   * `toCuratedClusterLeaf`), grouped by day and chunked so a busy day
   * becomes a few pages of a few photographs each. Ordered (oldest first).
   * Set instead of `evaPhoto`/`adamPhoto`/`unsignedPhoto`, never alongside
   * them — a cluster page's photographs can carry any mix of authorship
   * (several from one person, several unsigned, a mix), since grouping is
   * by day, not by the daily ritual's one-each pairing. `Spread` renders it
   * through a dedicated composition (`ClusterComposition`), never the
   * eva/adam pair shape.
   */
  photos?: Photo[];
}
