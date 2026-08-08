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
 *
 * WHY THE FALLBACK NO LONGER FILTERS TO `kind: "daily"` (2026-08-08). It
 * used to: the Tuesday fallback searched only dailies, on the reasoning that
 * a "daily" is the one shared card for a day and a "book" photo is a curated
 * plate that does not belong to any particular day. That reasoning produces
 * an empty screen the moment the archive holds zero dailies — which is
 * exactly the shape of the real database on go-live (48 real photographs,
 * every one `kind: "book"`, ingested before either of them had posted a
 * daily). §4.4's actual law is "the last thing left stays, unchanged, until
 * it is replaced" — it says nothing about kind. A photograph either of them
 * left is still a lamp left on, whatever the app happened to label it, and
 * an empty table when a real photograph exists in storage fails the
 * Tuesday test worse than showing a "book" plate ever could. So the pool
 * below is read across every kind; `lastLeft` is simply the most recent
 * photograph, full stop. `impressionFor` (TodayPair.tsx) still narrows to
 * `kind === "daily"` for its own decorative purpose, so this widening does
 * not change what the pressed-through impression search sees.
 */

import type { IanaTimeZone, IsoDate, IsoDateTime, MemberSlug, Photo } from "@/lib/types";
import { todaySnapshot, listPhotos, type PhotoDeps } from "./photos";

export interface LiveTodayObject {
  /** The shared day, as the viewer is living it. */
  day: IsoDate;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /**
   * The most recent photograph left, of any kind, from before the viewer's
   * shared day — the Tuesday fallback. May be unsigned (`kind: "book"`,
   * `authorMemberId: null`); every reader of this field must check
   * `authorshipOf` before assuming a hand or a slug (see the file header).
   */
  lastLeft?: Photo;
  /** The item the DECO stamp below the seam describes. May be unsigned —
      same caveat as `lastLeft`. */
  stampPhoto?: Photo;
  /**
   * A small pool of the most recent photographs of any kind, for the
   * Tuesday's pressed-through impression search (`TodayPairContent`'s
   * `recentDailies` prop) — `impressionFor` there narrows this to
   * `kind === "daily"` itself, so the name still describes what that search
   * actually uses. Empty whenever the Tuesday branch does not apply —
   * nothing else needs it.
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
    // The Tuesday: nothing posted on the viewer's shared day. `kind` is
    // deliberately omitted here (see the file header, 2026-08-08): a
    // "daily" posted FOR `snapshot.day` would already have surfaced above as
    // `eva`/`adam`, but a "daily" from an EARLIER day, or any "book" plate at
    // all, is still the last thing left and belongs in this pool.
    const roster = await deps.gateway.listMembers();
    const slugById = new Map(roster.map((m) => [m.id, m.slug]));

    const { photos } = await listPhotos(deps, {
      limit: IMPRESSION_POOL_SIZE,
    });
    recentDailies = photos.map((p) => {
      // A "book" photo may legitimately be unsigned (founder decision,
      // 2026-08-07 — see `lib/types.ts`'s `Photo.authorMemberId`); a "daily"
      // never is (`commitPhoto` refuses one). Either way this stays
      // null-safe rather than trusting either invariant from here.
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
