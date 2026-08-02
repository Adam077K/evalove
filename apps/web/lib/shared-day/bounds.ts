/**
 * The shared day.
 *
 * A shared day D is a named calendar date. A photo belongs to D when the
 * author own local date was D at the instant they posted it:
 *
 *   sharedDay = (createdAt AT TIME ZONE <author IANA zone>)::date
 *
 * That is the entire rule, and `sharedDayOf` is the entire implementation of
 * it. Everything else in this file is presentation of the same fact: a day
 * that is named after two calendar dates at once has to open somewhere and
 * close somewhere, so it opens when the earlier zone reaches midnight and
 * closes when the later zone runs out of that date. Those two edges are read
 * from tzdata every time, which is why the day is 31h long most of the year
 * and 30h long in the weeks when the two zones disagree about DST.
 *
 * The rejected alternative anchored the day at a fixed instant. It disagreed
 * with this model on 44.1% of one partner posts, every day, because it filed
 * the first hours of their morning under the previous date. Nothing in this
 * module may reintroduce a fixed anchor.
 */
import { MS_SECOND, nextIsoDate } from "./calendar";
import { MEMBER_PROFILES } from "./members";
import { localDateOf, startOfLocalDay } from "./zones";

import type { IanaTimeZone, IsoDate, MemberSlug } from "../types";

/** The shared day opens when the earlier of the two zones reaches midnight. */
export const SHARED_DAY_OPEN_TZ: IanaTimeZone =
  MEMBER_PROFILES.adam.homeTimezone;

/** The shared day closes when the later of the two zones runs out of date. */
export const SHARED_DAY_CLOSE_TZ: IanaTimeZone =
  MEMBER_PROFILES.eva.homeTimezone;

export interface SharedDayBounds {
  /** First instant of the day. Local midnight in the opening zone. */
  open: Date;
  /** Last whole second of the day. Local 23:59:59 in the closing zone. */
  close: Date;
}

/**
 * The instant the day stops accepting anything, exclusive.
 *
 * Local midnight of the following date in the closing zone. Kept separate from
 * `close` on purpose: `close` is what a person is shown, the exclusive end is
 * what containment is decided by, and conflating the two loses the last second
 * of every day.
 */
function endExclusiveMsOf(d: IsoDate): number {
  return startOfLocalDay(nextIsoDate(d), SHARED_DAY_CLOSE_TZ).getTime();
}

export function boundsOf(d: IsoDate): SharedDayBounds {
  return {
    open: startOfLocalDay(d, SHARED_DAY_OPEN_TZ),
    close: new Date(endExclusiveMsOf(d) - MS_SECOND),
  };
}

/**
 * How long the shared day lasts, in milliseconds.
 *
 * Not stored anywhere and not configurable: it is the distance between two
 * tzdata-derived edges. It comes out at exactly 31h for most of the year, and
 * exactly 30h during the two stretches when one zone has changed over to
 * summer time and the other has not.
 */
export function sharedDayLengthMs(d: IsoDate): number {
  return endExclusiveMsOf(d) - startOfLocalDay(d, SHARED_DAY_OPEN_TZ).getTime();
}

/** Whether instant `at` falls inside shared day `d`. Half-open, so no gaps. */
export function containsInstant(d: IsoDate, at: Date): boolean {
  const ms = at.getTime();
  return (
    ms >= startOfLocalDay(d, SHARED_DAY_OPEN_TZ).getTime() &&
    ms < endExclusiveMsOf(d)
  );
}

/**
 * The shared day an instant belongs to, from the point of view of one person.
 *
 * The only thing that decides it is the calendar date on that persons own wall
 * clock at that instant. Two people can be on different named days at once;
 * that is not a bug, it is the reason the day is 31h long.
 */
export function sharedDayOf(ts: Date, tz: IanaTimeZone): IsoDate {
  return localDateOf(ts, tz);
}

export interface DualLocalDates {
  eva: IsoDate;
  adam: IsoDate;
  /** True when the two of us are on different calendar dates right now. */
  differ: boolean;
}

/**
 * Both calendar dates at one instant.
 *
 * `tzOverride` exists for the visit: pass the zone a device reported and the
 * answer collapses to a single date with no other change anywhere.
 */
export function dualLocalDates(
  at: Date,
  tzOverride?: Partial<Record<MemberSlug, IanaTimeZone>>,
): DualLocalDates {
  const eva = sharedDayOf(
    at,
    tzOverride?.eva ?? MEMBER_PROFILES.eva.homeTimezone,
  );
  const adam = sharedDayOf(
    at,
    tzOverride?.adam ?? MEMBER_PROFILES.adam.homeTimezone,
  );
  return { eva, adam, differ: eva !== adam };
}
