import { CITY } from "@/lib/fixtures/members";
import { SHARED_DAY_CLOSE_TZ, SHARED_DAY_OPEN_TZ } from "@/lib/shared-day";
import { localTime, runningHeadDate } from "@/lib/time";

import type { IsoDate, MemberSlug, Uuid } from "@/lib/types";

/**
 * How a date is said out loud, in one place.
 *
 * Every line here is an ABSOLUTE time. Nothing says "in two days" or "this
 * evening", not because a countdown would be hard but because a relative
 * phrase means two different things at each end of a seven-hour gap — "this
 * evening" is Eva's evening or Adam's, never both, and a date is exactly the
 * thing that has to be the same moment for the two of them. The clock line
 * gives both readings and lets each of them find their own.
 */

/** The two people, as much of them as a date card needs. */
export interface MemberLite {
  id: Uuid;
  slug: MemberSlug;
  displayName: string;
}

/** `Friday, 14 August`. */
export function dayLine(day: IsoDate): string {
  return runningHeadDate(day);
}

/**
 * `12:00 pm in New York, 7:00 pm in Tel Aviv`.
 *
 * Eva's city first, like her name. Both readings, always — a single clock on
 * a date screen is the one place a reader cannot tell whose it is.
 */
export function clockLine(at: Date | string): string {
  const eva = localTime(at, SHARED_DAY_CLOSE_TZ);
  const adam = localTime(at, SHARED_DAY_OPEN_TZ);
  return `${eva} in ${CITY.eva}, ${adam} in ${CITY.adam}`;
}

/** Whoever is not this one. `null` when the roster does not hold both. */
export function otherThan(
  members: readonly MemberLite[],
  slug: MemberSlug,
): MemberLite | null {
  return members.find((m) => m.slug !== slug) ?? null;
}

export function memberOf(
  members: readonly MemberLite[],
  id: Uuid,
): MemberLite | null {
  return members.find((m) => m.id === id) ?? null;
}
