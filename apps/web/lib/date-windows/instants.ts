/**
 * A window, on a named day, as two real instants.
 *
 * `lib/shared-day/windows.ts` answers "which of the nine bands is happening
 * right now" and nothing else. Placing a date needs the inverse: given the
 * shared day 2026-08-14 and the band `w6`, when exactly does it open, when does
 * it close, and what do the two clocks read at that moment. Nothing in
 * `lib/shared-day` answers that, so this module composes it from three things
 * that package does export — `windowById`, `startOfLocalDay` and `localPartsOf`
 * — and lives outside it, because that package is closed.
 *
 * WHY THIS IS NOT `dayStart + minutes`. The nine bands are minutes since local
 * midnight in the opening zone, and a local day in the opening zone is not
 * always 24 hours long. On 2026-03-27 Jerusalem's clock goes 01:59 → 03:00, so
 * `startOfLocalDay + 180 minutes` lands on 04:00 local, an hour past where `w8`
 * actually ends. On 2026-10-25 it goes 02:59 → 02:00, and the same arithmetic
 * lands on 02:00 local, an hour short. Both errors are silent, both are one
 * hour, and both would put a date at a time neither of them agreed to. So the
 * minute is treated as a wall clock and inverted against tzdata, exactly the
 * way `lib/shared-day/zones.ts` inverts a local midnight.
 *
 * No numeric UTC offset appears here, in code or in a comment, for the reason
 * stated in `lib/shared-day/index.ts`: a single hard-coded shift reintroduces
 * the fixed-anchor model the whole day model exists to refuse.
 */

import {
  MS_HOUR,
  MS_MINUTE,
  SHARED_DAY_CLOSE_TZ,
  SHARED_DAY_OPEN_TZ,
  localPartsOf,
  nextIsoDate,
  parseIsoDate,
  startOfLocalDay,
  windowById,
} from "@/lib/shared-day";

import type { LocalParts, WindowId } from "@/lib/shared-day";
import type { IanaTimeZone, IsoDate } from "@/lib/types";

/** 24 * 60. `w7` closes here, which is local midnight of the following date. */
const MINUTES_PER_LOCAL_DAY = 24 * 60;

/**
 * How many times the wall-clock correction is allowed to iterate.
 *
 * One pass is enough whenever the target local time exists: the drift is read
 * from tzdata at the candidate instant and subtracted, which lands on the
 * answer. A target that does NOT exist — the hour a spring-forward skips —
 * cannot converge, because every candidate reads as a clock an hour away from
 * the one asked for. Three passes is the point at which we stop trying and say
 * so, rather than looping.
 */
const CORRECTION_PASSES = 3;

/** Widest plausible span between a wall clock and the instant behind it. */
const BISECTION_SPAN_MS = 36 * MS_HOUR;

/**
 * The wall clock at `at` in `tz`, re-encoded as if those digits were UTC.
 *
 * Same device as `lib/shared-day/zones.ts`: only ever compared against another
 * value produced the same way, so the encoding cancels and what survives is a
 * statement about two wall clocks rather than a number anyone must interpret.
 */
function wallMsOf(at: number, tz: IanaTimeZone): number {
  const p = localPartsOf(new Date(at), tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** The wall clock we are looking for, in the same encoding. */
function targetWallMs(day: IsoDate, minute: number): number {
  const { year, month, day: dayOfMonth } = parseIsoDate(day);
  return Date.UTC(
    year,
    month - 1,
    dayOfMonth,
    Math.floor(minute / 60),
    minute % 60,
    0,
  );
}

/**
 * The first instant whose `tz` clock reads at or after `wall`.
 *
 * Only reached for a local time that does not exist, which is the one case
 * where the clock jumps strictly forward — so the predicate really is monotone
 * over the searched span. During a fall-back the wall clock repeats rather than
 * advancing, and the correction loop below converges before this is called.
 */
function firstInstantAtOrAfterWall(wall: number, tz: IanaTimeZone): number {
  let low = wall - BISECTION_SPAN_MS;
  let high = wall + BISECTION_SPAN_MS;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (wallMsOf(mid, tz) >= wall) high = mid;
    else low = mid + 1;
  }
  return low;
}

/**
 * The instant at which minute `minute` of local date `day` begins in `tz`.
 *
 * `minute` counts from local midnight, so `1440` is a legal argument and means
 * midnight of the following local date — which is where `w7` closes.
 *
 * Where a local time happens twice (a fall-back), the earlier instant is
 * returned: it is the first time the clock reads that, and a date set for
 * "01:30" starts the first time 01:30 comes round. Where a local time never
 * happens (a spring-forward), the instant the clock reaches or passes it is
 * returned, so a window still opens and closes on a day that skipped an hour.
 */
export function firstInstantOfLocalMinute(
  day: IsoDate,
  minute: number,
  tz: IanaTimeZone,
): Date {
  if (minute === MINUTES_PER_LOCAL_DAY) {
    return startOfLocalDay(nextIsoDate(day), tz);
  }

  const wall = targetWallMs(day, minute);
  let candidate = startOfLocalDay(day, tz).getTime() + minute * MS_MINUTE;

  for (let pass = 0; pass < CORRECTION_PASSES; pass += 1) {
    const drift = wallMsOf(candidate, tz) - wall;
    if (drift === 0) return new Date(candidate);
    candidate -= drift;
  }

  if (wallMsOf(candidate, tz) === wall) return new Date(candidate);
  return new Date(firstInstantAtOrAfterWall(wall, tz));
}

/** What both clocks read at one instant. Eva's first, as everywhere. */
export interface BothClocks {
  eva: LocalParts;
  adam: LocalParts;
}

/**
 * Eva's clock and Adam's clock at the same instant.
 *
 * The home zones, not a device report: this is used to show a moment that has
 * not happened yet, and a device zone is a fact about where someone is now,
 * not about where they will be.
 */
export function bothClocksAt(at: Date): BothClocks {
  return {
    eva: localPartsOf(at, SHARED_DAY_CLOSE_TZ),
    adam: localPartsOf(at, SHARED_DAY_OPEN_TZ),
  };
}

/** A window of a named day, placed on the real timeline. */
export interface WindowPlacement {
  day: IsoDate;
  windowId: WindowId;
  /** The band's own label, from `lib/shared-day`. Never a clock reading. */
  label: string;
  /** First instant of the window, inclusive. */
  opensAt: Date;
  /** First instant after the window, exclusive. */
  closesAt: Date;
  /** Both wall clocks at `opensAt`. */
  opensAtLocal: BothClocks;
  /** Both wall clocks at `closesAt`. */
  closesAtLocal: BothClocks;
}

/**
 * Where a window sits on a given shared day.
 *
 * `null` when `id` names no band — the nine are a closed set, and a tenth
 * cannot be placed. It is not `null` for a day that skipped or repeated an
 * hour: those days are exactly what this module exists to get right.
 */
export function placeWindow(day: IsoDate, id: WindowId): WindowPlacement | null {
  const band = windowById(id);
  if (band === null) return null;

  const opensAt = firstInstantOfLocalMinute(day, band.fromMinute, SHARED_DAY_OPEN_TZ);
  const closesAt = firstInstantOfLocalMinute(day, band.toMinute, SHARED_DAY_OPEN_TZ);

  return {
    day,
    windowId: id,
    label: band.label,
    opensAt,
    closesAt,
    opensAtLocal: bothClocksAt(opensAt),
    closesAtLocal: bothClocksAt(closesAt),
  };
}

/**
 * The two bands the day model itself names as overlaps.
 *
 * `w4` is "the first overlap" and `w6` is "the long overlap", per
 * `lib/shared-day/windows.ts`. Read against the two wall clocks that is Eva's
 * morning to Adam's late afternoon, and Eva's midday to Adam's evening.
 *
 * NOT "the only bands where both of them are awake" — check the clocks before
 * writing that down. Neither of them is asleep anywhere from `w4` through `w7`,
 * and `w8` is Eva's evening against Adam's small hours, which is the most used
 * slot a seven-hour gap has. These two are the ones the model has named, and
 * naming them is all this constant does.
 */
export const OVERLAP_WINDOW_IDS: readonly WindowId[] = ["w4", "w6"];

export function isOverlapWindow(id: WindowId): boolean {
  return OVERLAP_WINDOW_IDS.includes(id);
}

/**
 * `count` shared days starting at `from`, inclusive.
 *
 * Plain calendar arithmetic on the named date — no zone enters it, because a
 * shared day is a name, not a span. The span is `boundsOf`'s job.
 */
export function sharedDaysFrom(from: IsoDate, count: number): IsoDate[] {
  const days: IsoDate[] = [];
  let cursor = from;
  for (let i = 0; i < count; i += 1) {
    days.push(cursor);
    cursor = nextIsoDate(cursor);
  }
  return days;
}
