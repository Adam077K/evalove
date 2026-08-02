/**
 * Test-only calendar helpers.
 *
 * Deliberately built out of `Date.UTC` and plain durations only. There is no
 * numeric UTC offset anywhere in this file, and there must never be one: a
 * fixture that says "+7 hours" is the exact thing that would let the rejected
 * fixed-anchor model back in through the test suite.
 *
 * Every wall-clock instant these helpers produce is derived from
 * `startOfLocalDay`, i.e. from tzdata via `Intl`, never from an assumed shift.
 */
import { startOfLocalDay } from "../zones";

import type { IanaTimeZone, IsoDate } from "../../types";

export const MS_SECOND = 1000;
export const MS_MINUTE = 60 * MS_SECOND;
export const MS_HOUR = 60 * MS_MINUTE;

/** UTC is uniform, so stepping a UTC midnight by exactly 24h is always safe. */
const MS_UTC_DAY = 24 * MS_HOUR;

export function isoDateOfUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function utcMidnightOf(d: IsoDate): number {
  const [year, month, day] = d.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`not an ISO date: ${d}`);
  }
  return Date.UTC(year, month - 1, day);
}

export function nextDate(d: IsoDate): IsoDate {
  return isoDateOfUtcMs(utcMidnightOf(d) + MS_UTC_DAY);
}

/** Every calendar date in `year`, ascending. */
export function datesOfYear(year: number): IsoDate[] {
  const out: IsoDate[] = [];
  for (
    let t = Date.UTC(year, 0, 1);
    t < Date.UTC(year + 1, 0, 1);
    t += MS_UTC_DAY
  ) {
    out.push(isoDateOfUtcMs(t));
  }
  return out;
}

/**
 * The half-open span of one person's own local calendar date, in instants.
 *
 * `[start, endExclusive)` — derived from tzdata on both edges, so it is 23h on
 * a spring-forward day and 25h on a fall-back day without anyone saying so.
 */
export function localDaySpan(
  d: IsoDate,
  tz: IanaTimeZone,
): { start: number; endExclusive: number } {
  return {
    start: startOfLocalDay(d, tz).getTime(),
    endExclusive: startOfLocalDay(nextDate(d), tz).getTime(),
  };
}

/**
 * The stretch of instants during which BOTH zones are on calendar date `d`.
 * Empty spans are reported as a non-positive length rather than thrown.
 */
export function coDateOverlap(
  d: IsoDate,
  a: IanaTimeZone,
  b: IanaTimeZone,
): { start: number; endExclusive: number; lengthMs: number } {
  const spanA = localDaySpan(d, a);
  const spanB = localDaySpan(d, b);
  const start = Math.max(spanA.start, spanB.start);
  const endExclusive = Math.min(spanA.endExclusive, spanB.endExclusive);
  return { start, endExclusive, lengthMs: endExclusive - start };
}

export interface Run {
  from: IsoDate;
  to: IsoDate;
  length: number;
}

/** Group an ascending list of dates into maximal contiguous runs. */
export function contiguousRuns(dates: readonly IsoDate[]): Run[] {
  const runs: Run[] = [];
  for (const d of dates) {
    const open = runs[runs.length - 1];
    if (open !== undefined && nextDate(open.to) === d) {
      open.to = d;
      open.length += 1;
    } else {
      runs.push({ from: d, to: d, length: 1 });
    }
  }
  return runs;
}

/**
 * Deterministic 32-bit LCG. "Arbitrary" in the golden replay has to be
 * reproducible, or a red run tells us nothing.
 */
export function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}
