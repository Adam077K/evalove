/**
 * plan.ts — the deterministic placement generator.
 *
 * Pure. No filesystem, no network, no clock, no `Math.random()` — same
 * `SourceItem[]` in, byte-identical `PlacementPlan` out, every time,
 * regardless of the order the caller happened to hand items in (the very
 * first thing this does is re-sort its own input). §4 of
 * `docs/08-agents_work/handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md`
 * states the reason this matters generally for this product ("if a page
 * looks right at 9am, it looks right at 9pm"); the same law applies to a
 * one-time placement run — re-running it against the same archive must
 * produce the same book.
 *
 * THE SCHEMA THIS PLANS AGAINST — the once-only constraint, resolved:
 * `book_entries_photo_idx` is a unique index on `photo_id` (live rows) —
 * `supabase/migrations/20260802090500_book_entries.sql` — so a photograph
 * cannot back two live `book_entries` rows at once. `hand-composed-book-
 * pages.md`'s Q5 flags this as a conflict with a DIFFERENT, unbuilt
 * feature (a person deliberately placing a foreign day's photo onto
 * someone else's composed page — `making-metaphor.md` §8, "composition is
 * derived, not stored"). This tool does not build that feature and does
 * not need to violate the constraint: every item here gets placed exactly
 * ONCE, as its own page, on its own day. The constraint and the founder's
 * "every photo goes in the Book" instruction are both satisfiable at once
 * because they were never actually in tension for this task — only for the
 * later hand-composition one, which is out of scope here and untouched by
 * this file. No migration, no schema change.
 *
 * ONE ENTRY = ONE PAGE, ONE PHOTOGRAPH. The migration's own comment says a
 * `book_entries` row is "a page [that] is EITHER a photo OR a finished
 * date's artifact — never both, never neither"; there is no column that
 * could hold a second photograph on the same row. So "a day with many
 * photographs gets a few pages" (the founder's own words) is realised
 * literally: one row per photograph, several rows for a busy day, ordered
 * by `position`. Nothing about a single-photo page looks unfinished —
 * `Spread.tsx`'s existing `single` composition already is a busy day's
 * kind of page, used today for any day that kept only one photograph;
 * this generator produces no new rendering case, only more of an existing
 * one.
 */

import type { SourceItem } from "./source.ts";

export interface PlannedPage {
  file: string;
  isoDate: string;
  checksumSha256: string | null;
  /**
   * Global reading order, ascending, oldest day first — the same
   * "ascending = reading order" convention `book_entries.position` and
   * `bookManifest()` already use. Spaced by 100 so a future hand-placed
   * insertion (the actual hand-composition feature, once built) always has
   * room to land a fractional value between two existing pages without
   * renumbering anything else — the same reason the column is `numeric`
   * and not `int` (migration's own comment).
   */
  position: number;
}

export interface SkippedItem {
  file: string;
  isoDate: string;
  reason: string;
}

export interface PlacementPlan {
  pages: readonly PlannedPage[];
  skipped: readonly SkippedItem[];
}

/**
 * Why every video in this archive is reported, not placed.
 *
 * `apps/web/lib/types.ts`'s `photos.mime` is image-only and
 * `tools/ingest/load.ts` already refuses to commit video items for exactly
 * this reason ("no schema support for video yet — needs a CTO/schema
 * decision, not something this loader invents"). A `book_entries` row
 * requires a `photo_id`; a video that was never committed as a photo has
 * none. This tool inherits that boundary rather than working around it —
 * inventing video storage here would be a schema decision made by the
 * wrong worker, in the wrong file, with no review.
 */
export const VIDEO_SKIP_REASON =
  "video — apps/web's photos table has no video kind or mime (see " +
  "tools/ingest/load.ts's own note); it cannot get a photo row, so it " +
  "cannot get a book_entries row, until that schema gap is closed by a " +
  "CTO/schema decision. Not a curation choice.";

/* ------------------------------------------------------------------ *
 * Within a day: order by time of day, then break ties on the catalogue's
 * own burst/duplicate notes, then fall back to filename.
 * ------------------------------------------------------------------ */

/**
 * Coarse buckets, checked in this order (first match wins) against the
 * catalogue's free-text `time_of_day` field. Not an enum in the source
 * data — the catalogue was written in prose — so this is a deliberately
 * simple, deterministic keyword read of it, not an attempt at NLP. Ties
 * (including "no recognisable time of day" — a screenshot, a hand-drawn
 * sketch, "time of day not legible") fall through to the filename sort
 * below, which is itself deterministic.
 */
const TIME_OF_DAY_KEYWORDS: readonly (readonly [string, number])[] = [
  ["dawn", 0],
  ["morning", 1],
  ["daytime", 2],
  ["sunset", 3],
  ["dusk", 3],
  ["golden hour", 3],
  ["evening", 4],
  ["night", 5],
];

function timeOfDayRank(timeOfDay: string | null): number {
  if (timeOfDay === null) return 9;
  const lower = timeOfDay.toLowerCase();
  for (const [keyword, rank] of TIME_OF_DAY_KEYWORDS) {
    if (lower.includes(keyword)) return rank;
  }
  return 9;
}

/**
 * Pairs the catalogue itself names as one moment, twice — a burst a few
 * seconds apart, or the same shutter click exported at two resolutions —
 * forced adjacent so the book presents them as a continuation (flip the
 * page, see the next beat) rather than as two separately-discovered
 * memories that happen to look alike. Every pair is cited to the exact
 * catalogue note it comes from; nothing here is guessed.
 *
 * The founder's instruction ("EVERY image... no curation, no quality
 * filtering") is why every one of these files still gets its own page —
 * none of them are dropped, only kept next to their pair. The one
 * genuine duplicate this session found (`24:7:26-12.HEIC`, byte-identical
 * to `-11.HEIC`) was already removed upstream, before this tool's input
 * was generated — see `source-items.json`'s header comment — so it never
 * reaches this list at all.
 */
const ADJACENT_PAIRS: readonly (readonly [string, string])[] = [
  // catalog A, 24:7:26-4.JPG: "near-duplicate of 24:7:26-18.JPG — same
  // pose and instant... likely two exports of one photo".
  ["24:7:26-4.JPG", "24:7:26-18.JPG"],
  // catalog A, 24:7:26-16.HEIC: "burst pair with 24:7:26-17.HEIC — EXIF
  // timestamps four seconds apart".
  ["24:7:26-16.HEIC", "24:7:26-17.HEIC"],
  // catalog A, 24:7:26-8.JPG: "similar pose/mood to 24:7:26.JPG... likely
  // the same outing, not exact duplicates".
  ["24:7:26-8.JPG", "24:7:26.JPG"],
  // catalog B, 31:7:26-1.JPG: "NEAR-DUPLICATE of 31:7:26-4.JPG... a burst
  // pair".
  ["31:7:26-1.JPG", "31:7:26-4.JPG"],
  // catalog C, 6:8:26-6.JPG: "NEAR-DUPLICATE of 6:8:26-2.HEIC -- same
  // scene, red-arrow markup added".
  ["6:8:26-2.HEIC", "6:8:26-6.JPG"],
];

function applyAdjacentPairs(items: readonly SourceItem[]): SourceItem[] {
  const out = [...items];
  for (const [first, second] of ADJACENT_PAIRS) {
    const firstIndex = out.findIndex((item) => item.file === first);
    const secondIndex = out.findIndex((item) => item.file === second);
    if (firstIndex === -1 || secondIndex === -1 || firstIndex === secondIndex) continue;
    const [moved] = out.splice(secondIndex, 1);
    // `first`'s index may have shifted by the splice above (if `second`
    // preceded it) — re-find rather than reuse `firstIndex`.
    const rebasedFirstIndex = out.findIndex((item) => item.file === first);
    out.splice(rebasedFirstIndex + 1, 0, moved!);
  }
  return out;
}

function orderDay(items: readonly SourceItem[]): SourceItem[] {
  const byTimeOfDay = [...items].sort((a, b) => {
    const rankDiff = timeOfDayRank(a.timeOfDay) - timeOfDayRank(b.timeOfDay);
    if (rankDiff !== 0) return rankDiff;
    return a.file.localeCompare(b.file); // deterministic, content-blind tiebreak
  });
  return applyAdjacentPairs(byTimeOfDay);
}

/* ------------------------------------------------------------------ * */

const POSITION_START = 1000;
const POSITION_STEP = 100;

export function planPlacement(rawItems: readonly SourceItem[]): PlacementPlan {
  // Canonical base order, independent of whatever order the caller's
  // input happened to arrive in — determinism starts here.
  const items = [...rawItems].sort((a, b) => a.file.localeCompare(b.file));

  const skipped: SkippedItem[] = [];
  const images: SourceItem[] = [];
  for (const item of items) {
    if (item.kind === "video") {
      skipped.push({ file: item.file, isoDate: item.isoDate, reason: VIDEO_SKIP_REASON });
    } else {
      images.push(item);
    }
  }

  const byDay = new Map<string, SourceItem[]>();
  for (const item of images) {
    const existing = byDay.get(item.isoDate);
    if (existing) existing.push(item);
    else byDay.set(item.isoDate, [item]);
  }

  const days = [...byDay.keys()].sort(); // ascending — oldest day first

  const pages: PlannedPage[] = [];
  let position = POSITION_START;
  for (const day of days) {
    const ordered = orderDay(byDay.get(day)!);
    for (const item of ordered) {
      pages.push({
        file: item.file,
        isoDate: day,
        checksumSha256: item.checksumSha256,
        position,
      });
      position += POSITION_STEP;
    }
  }

  return { pages, skipped };
}
