/**
 * Resurfacing — what came back.
 *
 * The Book's default view and Today's closing doorway both need one item
 * from the past that is relevant *right now*, chosen without recording any
 * open (VISION §4.5: "opens are never recorded, never surfaced, never used
 * to time anything").
 *
 * Two associations, each at up to three resolutions, so null is only
 * reachable when the archive is genuinely empty:
 *
 *   1. Date match  — something from this calendar day, a year ago.
 *      P3: "I always stop. Every time."
 *
 *   2. Hour match  — three resolutions, widening until an answer is found:
 *        R1  ±1 h   → "Left at this hour, in June"
 *        R2  ±3 h   → "Left in the evening, in June"   (same part of day)
 *        R3  any h  → "From June"                       (whole archive)
 *
 *      Do not add a fourth resolution. Three resolutions of one true fact
 *      is honest; a new association invented to fill a branch is decoration,
 *      and this product has failed twice on decoration.
 *
 * Both associations are chosen because neither requires reading an open.
 *
 * SELECTION RULE (Rule 9 — deterministic within a session):
 *   Candidates are sorted oldest-first by sharedDay as a stable tiebreak.
 *   The pick rotates through the sorted list by UTC-day-index (days since
 *   Unix epoch). Same instant → same item; successive days → different item;
 *   label varies because the item does.
 *
 * VISION §2.2 note: `SHARED_DAYS` in `lib/fixtures/book.ts` is a list of
 * days that happened, never a date range iterated into a grid. Nothing here
 * contradicts that — we search the photo archive, not a range.
 */

import type { Photo } from "@/lib/types";
import { PHOTOS } from "@/lib/fixtures/photos";
import { MEMBER_PROFILES, localPartsOf, isoDateOfUtcMs, MS_UTC_DAY } from "@/lib/shared-day";
import { monthOf } from "@/lib/time";

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

/**
 * One item from the archive that is relevant right now, plus why it came back.
 *
 * `label` is displayable directly: "A year ago today", "Left at this hour,
 * in June", "Left in the evening, in June", or "From June".
 */
export type Return =
  | { reason: "date"; label: string; photo: Photo }
  | { reason: "hour"; label: string; photo: Photo };

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Minimum circular distance between two clock hours (0–23).
 *
 * Returns a value in [0, 12]. Handles midnight wraps: 23 and 0 are 1
 * apart, not 23 apart.
 */
function hourDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 24 - raw);
}

/**
 * Part of day for an author-local clock hour.
 *
 * Used in resolution-2 labels: "Left in the evening, in June".
 * The hour is the photo's own local hour (in its sharedDayTz) — accurate
 * because the ±3 window guarantees the photo was left within the same broad
 * part of day as now.
 */
function partOfDay(hour: number): string {
  if (hour >= 4 && hour < 7) return "the early morning";
  if (hour >= 7 && hour < 12) return "the morning";
  if (hour >= 12 && hour < 17) return "the afternoon";
  if (hour >= 17 && hour < 21) return "the evening";
  return "the night"; // covers 21–23 and 0–3
}

/**
 * Deterministic pick from a non-empty list of candidates.
 *
 * Sorts oldest-first by sharedDay as a stable tiebreak within a day.
 * Rotates through the sorted list by UTC-day-index (floor of epoch ms
 * divided by one UTC day), so:
 *   - same instant  → same index → same item          (Rule 9)
 *   - next UTC day  → next index → different item      (variety in the label)
 */
function pickFromMatches(matches: Photo[], now: Date): Photo {
  // Oldest first — still the right archival instinct, and tiebreak is stable.
  const sorted = [...matches].sort((a, b) =>
    a.sharedDay.localeCompare(b.sharedDay),
  );
  // Days since Unix epoch: changes once per UTC midnight, never within a
  // session, so two surfaces rendering the same instant always agree.
  const dayIndex = Math.floor(now.getTime() / MS_UTC_DAY);
  return sorted[dayIndex % sorted.length]!;
}

function findDateMatch(now: Date, photos: Photo[]): Return | null {
  // The shared calendar date one year ago, in UTC calendar fields.
  // UTC is used to avoid the host-machine zone leaking into what is
  // a pure calendar comparison.
  const msOneYearAgo = Date.UTC(
    now.getUTCFullYear() - 1,
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const targetDate = isoDateOfUtcMs(msOneYearAgo);

  const matches = photos.filter((p) => p.sharedDay === targetDate);
  if (matches.length === 0) return null;

  // Among the date-matches, most recent createdAt wins — more determistic
  // than the day-index rotation because the set is small and often a single
  // photo. Rotating here would vary Today's main item across days, which is
  // not the intent.
  const photo = matches.reduce((best, p) =>
    p.createdAt > best.createdAt ? p : best,
  );

  return { reason: "date", label: "A year ago today", photo };
}

function findHourMatch(now: Date, photos: Photo[]): Return {
  // Current hour in each person's own city — two reference clocks.
  const evaHour = localPartsOf(now, MEMBER_PROFILES.eva.homeTimezone).hour;
  const adamHour = localPartsOf(now, MEMBER_PROFILES.adam.homeTimezone).hour;

  // A photo's hour is read in its own author's zone at creation time.
  // That is the same zone the stamp reads it in, keeping the association
  // grounded in a fact already visible on screen.
  function photoHour(p: Photo): number {
    return localPartsOf(new Date(p.createdAt), p.sharedDayTz).hour;
  }

  function filterByThreshold(threshold: number): Photo[] {
    return photos.filter((p) => {
      const ph = photoHour(p);
      return (
        hourDistance(ph, evaHour) <= threshold ||
        hourDistance(ph, adamHour) <= threshold
      );
    });
  }

  // Resolution 1 — same clock hour (±1)
  const closeMatches = filterByThreshold(1);
  if (closeMatches.length > 0) {
    const photo = pickFromMatches(closeMatches, now);
    return {
      reason: "hour",
      label: `Left at this hour, in ${monthOf(photo.sharedDay)}`,
      photo,
    };
  }

  // Resolution 2 — same part of day (±3)
  const broadMatches = filterByThreshold(3);
  if (broadMatches.length > 0) {
    const photo = pickFromMatches(broadMatches, now);
    const ph = photoHour(photo);
    return {
      reason: "hour",
      label: `Left in ${partOfDay(ph)}, in ${monthOf(photo.sharedDay)}`,
      photo,
    };
  }

  // Resolution 3 — any photo in the archive.
  // This branch is what guarantees null is never returned on a non-empty
  // archive: after failing ±1 and ±3, we simply resurface something from
  // the collection without claiming a clock match.
  const photo = pickFromMatches(photos, now);
  return {
    reason: "hour",
    label: `From ${monthOf(photo.sharedDay)}`,
    photo,
  };
}

/* ------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------ */

/**
 * One item from the archive that is relevant at instant `now`, or null
 * only when the archive is genuinely empty.
 *
 * Deterministic: two calls at the same `now` always return the same result
 * (Rule 9 — both surfaces must agree within a session).
 *
 * `photos` defaults to the full fixture archive. Pass an explicit list in
 * tests to control the input without mocking.
 */
export function whatCameBack(
  now: Date,
  photos: Photo[] = Object.values(PHOTOS) as Photo[],
): Return | null {
  if (photos.length === 0) return null;

  const dateResult = findDateMatch(now, photos);
  if (dateResult !== null) return dateResult;

  // findHourMatch always returns a result when photos is non-empty.
  return findHourMatch(now, photos);
}
