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
 * Every SIGNED `Photo` this module returns carries `authorSlug` — resolved
 * once against the roster, attached here, so nothing downstream re-derives
 * identity from a raw id (see the note on `authorSlug` in `lib/types.ts`
 * and on `authorshipOf` in `components/book/compose.ts`). A deliberately
 * UNSIGNED photo (`authorMemberId === null`, migration 12) carries no
 * `authorSlug` and never will — that absence is not a miss to fix here, it
 * is the point.
 */

import type { IsoDate, MemberSlug, Photo, PhotoKind, SharedDay } from "@/lib/types";
import type { BookLeaf } from "@/components/book/leaves";
import { whatCameBack, type Return } from "@/lib/resurface";
import { sharedDayOf } from "@/lib/shared-day";
import { toBookEntry } from "./rows";
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
 * cursor last. Every SIGNED photo carries `authorSlug`; an unsigned one
 * (`authorMemberId === null`) carries none, on purpose.
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
      // `authorMemberId === null` is a deliberately unsigned photo (migration
      // 12) — it gets no `authorSlug` attached, same as an unresolved id, but
      // for the opposite reason: `authorshipOf` (compose.ts) tells the two
      // apart by the id, not by whether a slug ended up attached.
      const slug =
        photo.authorMemberId === null ? undefined : slugById.get(photo.authorMemberId);
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
  /**
   * The kept days in book order: the richest day (most leaves) leads, then
   * the remaining days run newest-first. See `liveBookLeaves` for the full
   * ordering rule and what happens when a new day arrives.
   */
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
 * A leaf with the one extra fact needed to sort it against its
 * day-mates before it leaves this module — never exposed past
 * `liveBookLeaves`'s own return, so no caller can mistake `position` for
 * a display value.
 */
interface OrderedLeaf {
  leaf: BookLeaf;
  /** `book_entries.position`, ascending. Daily leaves have none — see the
      merge sort below, which treats a missing position as "sorts first". */
  position?: number;
}

/**
 * One curated page holding exactly one photograph: `book_entries` points at
 * a single photo per row — per the migration's own comment ("a page is
 * EITHER a photo OR a finished date's artifact") — and that constraint is
 * unchanged and untouched here. `Spread.tsx`'s existing `single` composition
 * is the whole rendering story for a lone curated leaf — nothing new to
 * build there. `date_id`-pointing entries (a finished date's artifact) are
 * out of scope for this reader; they are simply not yet producible by
 * anything in the app, so skipping them here loses nothing today and the
 * skip is explicit rather than a silent cast.
 *
 * A day with SEVERAL curated photographs no longer becomes several of
 * these — see `toCuratedClusterLeaf` and `MAX_PHOTOS_PER_CURATED_PAGE`
 * below (founder ask, 2026-08-08: "add more than one pic in book page").
 * This function now only ever fires for a chunk of exactly one.
 */
function toCuratedLeaf(entryId: string, position: number, photo: Photo): OrderedLeaf {
  const signedEva = photo.authorSlug === "eva";
  const signedAdam = photo.authorSlug === "adam";
  return {
    leaf: {
      key: `book:${entryId}`,
      day: toSharedDay(photo.sharedDay, [photo]),
      evaPhoto: signedEva ? photo : undefined,
      adamPhoto: signedAdam ? photo : undefined,
      // Neither slug matched: a deliberately unsigned photo (authorMemberId
      // null, migration 12), not a miss — see BookLeaf.unsignedPhoto. Without
      // this, an unsigned curated leaf would carry evaPhoto/adamPhoto both
      // undefined and Spread would silently render nothing for it.
      unsignedPhoto: signedEva || signedAdam ? undefined : photo,
    },
    position,
  };
}

/**
 * How many curated photographs share one page before the next page opens.
 *
 * "A day with many photographs gets a few pages, not one crowded one" — the
 * founder's own words (`tools/book-placement/plan.ts`), first honoured as
 * one photo per page. The founder has now asked for the Book to "hold more
 * than 1 image in the page" (2026-08-08), so the same sentence is honoured
 * one grain smaller: several photographs to a page instead of one, so a
 * long evening (24 July: 21 curated photographs) becomes a handful of pages
 * rather than twenty-one single-photo page turns or one overloaded page. 3
 * is chosen, not derived: the design law's composition rules (unequal
 * pairs, mass hierarchy, overlap, rotation) are proven at 2 (the daily
 * pair) and this stays close to that scale rather than reaching for a page
 * dense enough to start reading as a grid.
 */
export const MAX_PHOTOS_PER_CURATED_PAGE = 3;

/**
 * Split `items` into groups no larger than `maxSize`, sizes as even as
 * possible — never a lonely group of one tacked onto otherwise-full groups
 * (4 items at max 3 becomes 2+2, not 3+1, so no page reads like a mistake).
 * `Math.ceil` decides how many groups there are; the remainder is spread
 * one-per-group from the front, deterministic for a given input length and
 * order — the same input always chunks the same way.
 */
function chunkEvenly<T>(items: readonly T[], maxSize: number): T[][] {
  if (items.length === 0) return [];
  const groupCount = Math.ceil(items.length / maxSize);
  const base = Math.floor(items.length / groupCount);
  let remainder = items.length % groupCount;
  const chunks: T[][] = [];
  let i = 0;
  for (let g = 0; g < groupCount; g++) {
    const size = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    chunks.push(items.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/**
 * Several curated entries folded onto one page. `book_entries` still gives
 * each photograph its own row — `book_entries_photo_idx`'s one-row-per-photo
 * rule is untouched, and so is the migration's XOR constraint; nothing here
 * is a schema change. What changes is only how many of those rows become ONE
 * `BookLeaf`/page: a chunk from `chunkEvenly`, in `position` order (the same
 * ascending "reading order" `bookManifest()` already uses), instead of one
 * leaf per row. `Spread.tsx` renders this through a new composition (a
 * "cluster") that is deliberately NOT the daily pair's eva/adam shape — a
 * curated page's photographs can be any mix of authors, including several
 * from the same person or several unsigned, because grouping here is by DAY,
 * never by the daily ritual's one-each pairing.
 *
 * `key` is built from every entry id in the group, not just the first, so
 * two groups can never collide even if a future placement run changes chunk
 * boundaries.
 */
function toCuratedClusterLeaf(
  entryIds: readonly string[],
  position: number,
  photos: readonly Photo[],
): OrderedLeaf {
  return {
    leaf: {
      key: `book:${entryIds.join(",")}`,
      day: toSharedDay(photos[0]!.sharedDay, photos),
      photos: [...photos],
    },
    position,
  };
}

/**
 * The kept days in book order — the real equivalent of the fixture
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
 * ALSO includes `book_entries` (the curated pages placed outside the daily
 * ritual — the opening gathering's archive, laid onto pages by
 * `tools/book-placement`) merged in alongside the daily leaves, closing the
 * gap this function's own doc comment used to flag: a curated photo's day
 * can carry several leaves, so leaves are no longer one-per-date. A day's
 * curated entries are further chunked into groups of up to
 * `MAX_PHOTOS_PER_CURATED_PAGE` (`toCuratedClusterLeaf`), so several
 * photographs from a busy day can share one page instead of each opening
 * its own. Within a date shared by a daily leaf and one or more curated
 * leaves, the daily leaf sorts first (it is the day itself; the curated
 * leaves are more of that day, added afterward) and the curated leaves then
 * follow in `book_entries.position` order — the same ascending "reading
 * order" `bookManifest()` (`lib/data/book.ts`) already uses.
 *
 * **Ordering rule — richest day first:**
 * The day with the most leaves (curated cluster pages + daily leaf) leads
 * the Book: the couple's most-photographed shared evening is the first thing
 * encountered on opening. On a count tie — every day has the same leaf count,
 * which is the common case early on — the more recent date leads, recovering
 * newest-first as the tiebreak. All remaining days then follow newest-first.
 *
 * What happens when a new day arrives: it starts with 1 leaf (the daily) and
 * joins the newest-first tail. It displaces the current lead only if it
 * accumulates more curated leaves than the richest day today. The lead is not
 * intended to be permanent — the day that eventually surpasses it takes over
 * naturally, no code change required.
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

  const dailyLeaves: OrderedLeaf[] = [...byDay.entries()].map(([date, photos]) => ({
    leaf: {
      key: date,
      day: toSharedDay(date, photos),
      evaPhoto: photos.find((p) => p.authorSlug === "eva"),
      adamPhoto: photos.find((p) => p.authorSlug === "adam"),
    },
    // No `position`: a daily leaf is the day itself, so it always sorts
    // ahead of that day's curated leaves — see the merge sort below.
  }));

  const entryRows = await deps.gateway.listBookEntries();
  let curatedLeaves: OrderedLeaf[] = [];
  if (entryRows.length > 0) {
    // One fetch of the whole archive, not one query per entry — the same
    // shape `listAllPhotos` already gives every other reader in this file.
    const archive = await listAllPhotos(deps);
    const photoById = new Map(archive.map((p) => [p.id, p]));
    const resolved = entryRows
      .map(toBookEntry)
      .filter((entry): entry is Extract<typeof entry, { photoId: string }> => "photoId" in entry)
      .flatMap((entry) => {
        const photo = photoById.get(entry.photoId);
        // A stale reference (the photo was purged after the entry was
        // written): skip rather than throw — one missing page must not
        // break every other page in the book.
        return photo === undefined ? [] : [{ entry, photo }];
      })
      .sort((a, b) => a.entry.position - b.entry.position);

    const byDay = new Map<IsoDate, typeof resolved>();
    for (const r of resolved) {
      const list = byDay.get(r.photo.sharedDay);
      if (list) list.push(r);
      else byDay.set(r.photo.sharedDay, [r]);
    }

    curatedLeaves = [...byDay.values()].flatMap((dayRows) =>
      chunkEvenly(dayRows, MAX_PHOTOS_PER_CURATED_PAGE).map((group) =>
        group.length === 1
          ? toCuratedLeaf(group[0]!.entry.id, group[0]!.entry.position, group[0]!.photo)
          : toCuratedClusterLeaf(
              group.map((g) => g.entry.id),
              group[0]!.entry.position,
              group.map((g) => g.photo),
            ),
      ),
    );
  }

  // See the ordering-rule doc comment on this function above.
  const allOrdered = [...dailyLeaves, ...curatedLeaves];

  // Count leaves per date to find the richest day.
  const countByDate = new Map<IsoDate, number>();
  for (const { leaf } of allOrdered) {
    const date = leaf.day.date;
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  // Lead date: most leaves wins; ties go to the more recent date.
  let leadDate: IsoDate | undefined;
  let leadCount = 0;
  for (const [date, count] of countByDate) {
    if (count > leadCount || (count === leadCount && (leadDate === undefined || date > leadDate))) {
      leadCount = count;
      leadDate = date;
    }
  }

  const leaves: BookLeaf[] = allOrdered
    .sort((a, b) => {
      const aIsLead = a.leaf.day.date === leadDate;
      const bIsLead = b.leaf.day.date === leadDate;
      // Lead date always sorts first.
      if (aIsLead !== bIsLead) return aIsLead ? -1 : 1;
      // Within the same date — daily leaf before curated (missing position
      // sorts as −Infinity, i.e., before any explicit position).
      if (a.leaf.day.date === b.leaf.day.date) {
        return (a.position ?? -Infinity) - (b.position ?? -Infinity);
      }
      // Remaining dates: newest first.
      return b.leaf.day.date.localeCompare(a.leaf.day.date);
    })
    .map((ordered) => ordered.leaf);

  const begun =
    leaves.length > 0
      ? leaves.reduce((min, leaf) => (leaf.day.date < min ? leaf.day.date : min), leaves[0]!.day.date)
      : // Genuinely nothing kept yet: the archive begins today, by the
        // clock — there is no earlier day to report.
        sharedDayOf(now, roster[0]?.home_timezone ?? "UTC");

  return { leaves, leafCount: leaves.length, begun };
}
