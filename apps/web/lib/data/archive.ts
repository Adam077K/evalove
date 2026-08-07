/**
 * The whole archive, composed from the real database.
 *
 * `listPhotos` pages; this module pages FOR its callers, because both
 * things this file feeds need "every live photo", not one page of it:
 *
 *   - `whatCameBack` (`lib/resurface.ts`) searches the entire archive for
 *     what is relevant right now — a date match a year ago, an hour match
 *     from any month. A partial archive is a search that can silently miss
 *     the right answer, not a smaller version of the right answer.
 *   - The Book's kept days (`liveBookLeaves`) are, by definition, every
 *     daily photo that is not still today.
 *
 * Every `Photo` this module returns carries `authorSlug` — resolved once
 * against the roster, attached here, so nothing downstream re-derives
 * identity from a raw id (see the note on `authorSlug` in `lib/types.ts`
 * and on `slugOf` in `components/book/compose.ts`).
 */

import type { IsoDate, MemberSlug, Photo, PhotoKind, SharedDay } from "@/lib/types";
import type { BookLeaf } from "@/components/book/leaves";
import { whatCameBack, type Return } from "@/lib/resurface";
import { sharedDayOf } from "@/lib/shared-day";
import { listPhotos, MAX_PAGE_SIZE, type PhotoDeps } from "./photos";

/**
 * Safety valve on the paging loop below: a request that has not terminated
 * after this many pages (at `MAX_PAGE_SIZE` each) is a bug — an id that
 * never advances the cursor, say — not a legitimately huge archive. Two
 * people posting once a day would take centuries to reach it.
 */
const MAX_ARCHIVE_PAGES = 500;

/**
 * Every live photo of the given kind (or every kind, if omitted), oldest
 * cursor last, each carrying `authorSlug`.
 */
export async function listAllPhotos(
  deps: PhotoDeps,
  input: { kind?: PhotoKind } = {},
): Promise<Photo[]> {
  const roster = await deps.gateway.listMembers();
  const slugById = new Map<string, MemberSlug>(roster.map((m) => [m.id, m.slug]));

  const out: Photo[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_ARCHIVE_PAGES; page += 1) {
    const result = await listPhotos(deps, {
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
      limit: MAX_PAGE_SIZE,
    });
    for (const photo of result.photos) {
      const slug = slugById.get(photo.authorMemberId);
      out.push(slug === undefined ? photo : { ...photo, authorSlug: slug });
    }
    if (result.nextCursor === null) return out;
    cursor = result.nextCursor;
  }

  throw new Error(
    `listAllPhotos: stopped after ${MAX_ARCHIVE_PAGES} pages without exhausting the ` +
      "cursor — either the archive has grown far beyond what this product expects, " +
      "or the keyset cursor is not advancing. Investigate before raising the cap.",
  );
}

/**
 * `whatCameBack`, against the real archive. The default view of The Book
 * (`ResurfacedItem`) and Today's closing doorway (`TodayDoorway`) both use
 * this — see the doc comment on `whatCameBack` for the selection rule.
 */
export async function liveWhatCameBack(
  deps: PhotoDeps,
  now: Date,
): Promise<Return | null> {
  const archive = await listAllPhotos(deps);
  return whatCameBack(now, archive);
}

/* ------------------------------------------------------------------ *
 * The Book's kept days
 * ------------------------------------------------------------------ */

export interface LiveBookLeaves {
  /** The kept days, newest first. */
  leaves: BookLeaf[];
  /** Feeds the fore-edge width only. Never rendered as a number. */
  leafCount: number;
  /** The archive's earliest kept day — the colophon derives from it. */
  begun: IsoDate;
}

function toSharedDay(date: IsoDate, photos: readonly Photo[]): SharedDay {
  const evaPosted = photos.some((p) => p.authorSlug === "eva");
  const adamPosted = photos.some((p) => p.authorSlug === "adam");
  const createdAts = [...photos.map((p) => p.createdAt)].sort();
  return {
    date,
    evaPosted,
    adamPosted,
    bothPosted: evaPosted && adamPosted,
    photoCount: photos.length,
    ...(createdAts[0] !== undefined ? { firstPostAt: createdAts[0] } : {}),
    ...(createdAts.at(-1) !== undefined ? { lastPostAt: createdAts.at(-1)! } : {}),
  };
}

/**
 * The kept days, newest first — the real equivalent of the fixture
 * `bookLeaves()` that used to live in `components/book/leaves.ts`.
 *
 * A day is "kept" once it is no longer live for EITHER member — excluded by
 * checking both home zones, not one, because Eva and Adam's shared days can
 * genuinely diverge (`America/New_York` and `Asia/Jerusalem` are rarely the
 * same calendar date at the same instant). A day still live for either of
 * them is Today's to show, not the Book's — showing it in both places at
 * once is the duplicate the fixture's single `FIXTURE_TODAY` exclusion was
 * guarding against.
 *
 * Deliberately does not include `book_entries` (the curated, non-daily
 * pages from the opening gathering) — `lib/data/book.ts` owns that table
 * and it is a separate read this task did not ask for. Every day this
 * returns is derived from `photos` alone, same as the fixture it replaces.
 */
export async function liveBookLeaves(
  deps: PhotoDeps,
  now: Date = new Date(),
): Promise<LiveBookLeaves> {
  const roster = await deps.gateway.listMembers();
  const liveShareDays = new Set(roster.map((m) => sharedDayOf(now, m.home_timezone)));

  const dailies = await listAllPhotos(deps, { kind: "daily" });

  const byDay = new Map<IsoDate, Photo[]>();
  for (const photo of dailies) {
    if (liveShareDays.has(photo.sharedDay)) continue; // still Today's, not a kept day
    const existing = byDay.get(photo.sharedDay);
    if (existing) existing.push(photo);
    else byDay.set(photo.sharedDay, [photo]);
  }

  const leaves: BookLeaf[] = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, photos]) => ({
      day: toSharedDay(date, photos),
      evaPhoto: photos.find((p) => p.authorSlug === "eva"),
      adamPhoto: photos.find((p) => p.authorSlug === "adam"),
    }));

  const begun =
    leaves.length > 0
      ? leaves.reduce((min, leaf) => (leaf.day.date < min ? leaf.day.date : min), leaves[0]!.day.date)
      : // Genuinely nothing kept yet: the archive begins today, by the
        // clock — there is no earlier day to report.
        sharedDayOf(now, roster[0]?.home_timezone ?? "UTC");

  return { leaves, leafCount: leaves.length, begun };
}
