/**
 * Zone plumbing.
 *
 * Everything this module knows about a wall clock comes from tzdata through
 * `Intl`, and nothing else. There is no assumed shift between any two zones,
 * no anchor instant, and no numeric constant standing in for a zone. A zone is
 * an IANA identifier string; asking what time it is there is a formatting
 * operation, and asking when a local date began is that operation inverted.
 *
 * The inversion is the only interesting part. `Intl` maps instant to wall
 * clock but not back, so we take the wall clock we want, read the local clock
 * at a nearby probe instant, and use the difference between those two to jump
 * to a candidate instant. We then re-format the candidate and keep it only if
 * it really does read as the wall clock we asked for. Three probes are tried,
 * more than a day apart, so a DST transition sitting between the probe and the
 * answer cannot produce a wrong result: it produces a candidate that fails the
 * round trip and is discarded. Where two candidates survive, the local clock
 * repeated itself and the earlier instant is the start of the date. Where none
 * survive, the local clock jumped over midnight entirely and the date begins
 * at the jump, which we find by bisection.
 */
import {
  isoDateOf,
  pad2,
  utcMsOfIsoDate,
  weekdayOfIsoDate,
  MS_HOUR,
} from "./calendar";

import type { IanaTimeZone, IsoDate } from "../types";

/** One instant, as read on one persons own wall clock. */
export interface LocalParts {
  year: number;
  month: number;
  /** 1-based, as humans write it. */
  day: number;
  /** 0..23. */
  hour: number;
  minute: number;
  second: number;
  /** `YYYY-MM-DD` on that wall clock. */
  date: IsoDate;
  /** `HH:mm` on that wall clock. */
  time: string;
  /** 0 = Sunday .. 6 = Saturday, on that wall clock. */
  weekday: number;
}

/**
 * Probe distance for the inversion. Comfortably longer than a day, so the
 * three probes cannot all sit on the same side of a nearby DST transition, and
 * comfortably shorter than the bisection window.
 */
const PROBE_SPAN_MS = 36 * MS_HOUR;

/** Widest plausible span between a wall clock and the instant behind it. */
const BISECTION_SPAN_MS = 36 * MS_HOUR;

const IANA_SHAPE = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9][A-Za-z0-9_+-]*)*$/;

const formatters = new Map<string, Intl.DateTimeFormat>();
const dayStarts = new Map<string, number>();

function formatterFor(tz: IanaTimeZone): Intl.DateTimeFormat {
  const cached = formatters.get(tz);
  if (cached !== undefined) return cached;

  const made = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  formatters.set(tz, made);
  return made;
}

function numericPart(
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const found = parts.find((part) => part.type === type);
  if (found === undefined) {
    throw new RangeError(`Intl returned no ${type} part`);
  }
  const value = Number(found.value);
  if (!Number.isInteger(value)) {
    throw new RangeError(`Intl returned a non-numeric ${type}: ${found.value}`);
  }
  return value;
}

/**
 * True when `tz` is an IANA identifier this runtime can actually resolve.
 *
 * Shape first, then a real `Intl` construction, because the shape check alone
 * would accept a plausible-looking name that tzdata has never heard of.
 */
export function isSupportedTimeZone(tz: unknown): tz is IanaTimeZone {
  if (typeof tz !== "string" || tz.length === 0) return false;
  if (!IANA_SHAPE.test(tz)) return false;
  try {
    formatterFor(tz).format(0);
    return true;
  } catch {
    return false;
  }
}

/** What the clock in `tz` reads at instant `at`. */
export function localPartsOf(at: Date, tz: IanaTimeZone): LocalParts {
  const parts = formatterFor(tz).formatToParts(at);
  const year = numericPart(parts, "year");
  const month = numericPart(parts, "month");
  const day = numericPart(parts, "day");
  const hour = numericPart(parts, "hour");
  const minute = numericPart(parts, "minute");
  const second = numericPart(parts, "second");
  const date = isoDateOf({ year, month, day });

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    date,
    time: `${pad2(hour)}:${pad2(minute)}`,
    weekday: weekdayOfIsoDate(date),
  };
}

/**
 * The wall clock at `at` in `tz`, re-encoded as if those digits were UTC.
 *
 * Only ever compared against another value produced the same way, which is
 * what makes it safe: the encoding cancels, and what survives is a statement
 * about two wall clocks, never a number anyone has to interpret.
 */
function wallClockMsOf(at: number, tz: IanaTimeZone): number {
  const p = localPartsOf(new Date(at), tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

function firstInstantAtOrAfterWall(wall: number, tz: IanaTimeZone): number {
  let low = wall - BISECTION_SPAN_MS;
  let high = wall + BISECTION_SPAN_MS;
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (wallClockMsOf(mid, tz) >= wall) high = mid;
    else low = mid + 1;
  }
  return low;
}

function firstInstantOfLocalDay(d: IsoDate, tz: IanaTimeZone): number {
  const wall = utcMsOfIsoDate(d);
  let earliest: number | null = null;

  for (const probe of [wall - PROBE_SPAN_MS, wall, wall + PROBE_SPAN_MS]) {
    const candidate = wall - (wallClockMsOf(probe, tz) - probe);
    if (wallClockMsOf(candidate, tz) !== wall) continue;
    if (earliest === null || candidate < earliest) earliest = candidate;
  }

  if (earliest !== null) return earliest;
  return firstInstantAtOrAfterWall(wall, tz);
}

/**
 * The first instant of local calendar date `d` in `tz`.
 *
 * Memoised per zone and date. The cache is safe because the answer depends on
 * tzdata alone: the host machine own zone never enters the calculation, so the
 * same key always has the same answer within a process.
 */
export function startOfLocalDay(d: IsoDate, tz: IanaTimeZone): Date {
  const key = `${tz}|${d}`;
  const cached = dayStarts.get(key);
  if (cached !== undefined) return new Date(cached);

  const found = firstInstantOfLocalDay(d, tz);
  dayStarts.set(key, found);
  return new Date(found);
}

/**
 * The calendar date on the `tz` wall clock at instant `ts`.
 *
 * This is the whole day model in one line: `(ts AT TIME ZONE tz)::date`.
 */
export function localDateOf(ts: Date, tz: IanaTimeZone): IsoDate {
  return localPartsOf(ts, tz).date;
}
