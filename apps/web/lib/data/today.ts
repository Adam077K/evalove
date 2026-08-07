/**
 * Today, composed from the real archive.
 *
 * The real equivalent of the fixture `todaysObject()` that used to live in
 * `components/home/TodayPair.tsx`: same four states (the pair, one item, the
 * Tuesday, genuinely empty), built from `todaySnapshot` and `listPhotos` —
 * the two functions in `lib/data/photos.ts` this module exists to give
 * callers to.
 *
 * WHY THE TUESDAY FALLBACK IS NOT PART OF `todaySnapshot`. `todaySnapshot`
 * answers one question — who posted on the viewer's shared day — and that
 * question has no opinion about what to show when the answer is "nobody
 * yet". PRODUCT-VISION-V2 §4.4 does have an opinion: the last thing left
 * stays, unchanged, until it is replaced. That is a presentation rule, not a
 * fact about one day, so it is composed here rather than folded into the
 * snapshot's own shape.
 */

import type { IanaTimeZone, IsoDate, IsoDateTime, MemberSlug, Photo } from "@/lib/types";
import { todaySnapshot, listPhotos, type PhotoDeps } from "./photos";

export interface LiveTodayObject {
  /** The shared day, as the viewer is living it. */
  day: IsoDate;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /** The most recent daily from a prior day — the Tuesday fallback. */
  lastLeft?: Photo;
  /** The item the DECO stamp below the seam describes. */
  stampPhoto?: Photo;
  /**
   * A small pool of recent dailies, oldest constraint none, for the
   * Tuesday's pressed-through impression search (`TodayPairContent`'s
   * `recentDailies` prop). Empty whenever the Tuesday branch does not
   * apply — nothing else needs it.
   */
  recentDailies: Photo[];
  pendingUntil: IsoDateTime;
  daysTogether: number;
}

/** How many recent dailies to pull for the impression search. Small on
    purpose — this feeds one decorative detail, not a list anyone scrolls. */
const IMPRESSION_POOL_SIZE = 10;

function withSlug(photo: Photo, slug: MemberSlug): Photo {
  return { ...photo, authorSlug: slug };
}

export async function liveTodayObject(
  deps: PhotoDeps,
  viewer: { slug: MemberSlug; clientTz?: IanaTimeZone },
): Promise<LiveTodayObject> {
  const snapshot = await todaySnapshot(deps, viewer);
  const evaPhoto = snapshot.eva !== null ? withSlug(snapshot.eva, "eva") : undefined;
  const adamPhoto = snapshot.adam !== null ? withSlug(snapshot.adam, "adam") : undefined;

  let lastLeft: Photo | undefined;
  let recentDailies: Photo[] = [];

  if (evaPhoto === undefined && adamPhoto === undefined) {
    // The Tuesday: nothing posted on the viewer's shared day. The most
    // recent daily overall is guaranteed to be from a day strictly before
    // `snapshot.day` — if one existed FOR `snapshot.day`, `todaySnapshot`
    // above would have returned it as `eva` or `adam` and this branch would
    // not be reached.
    const roster = await deps.gateway.listMembers();
    const slugById = new Map(roster.map((m) => [m.id, m.slug]));

    const { photos } = await listPhotos(deps, {
      kind: "daily",
      limit: IMPRESSION_POOL_SIZE,
    });
    recentDailies = photos.map((p) => {
      // An unsigned daily should never exist (`commitPhoto` refuses one —
      // `lib/data/photos.ts`), but this stays null-safe rather than trusting
      // that invariant to hold forever.
      const slug = p.authorMemberId === null ? undefined : slugById.get(p.authorMemberId);
      return slug === undefined ? p : withSlug(p, slug);
    });
    lastLeft = recentDailies[0];
  }

  const stampPhoto =
    evaPhoto !== undefined && adamPhoto !== undefined
      ? evaPhoto.createdAt > adamPhoto.createdAt
        ? evaPhoto
        : adamPhoto
      : (evaPhoto ?? adamPhoto ?? lastLeft);

  return {
    day: snapshot.day,
    evaPhoto,
    adamPhoto,
    lastLeft,
    stampPhoto,
    recentDailies,
    pendingUntil: snapshot.pendingUntil,
    daysTogether: snapshot.daysTogether,
  };
}
