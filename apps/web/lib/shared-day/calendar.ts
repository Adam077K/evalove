/**
 * Plain calendar arithmetic. Nothing in this file knows about time zones.
 *
 * It converts between an ISO calendar date and the instant that date names
 * when the digits are read as UTC, and it steps one calendar day at a time.
 * UTC is uniform, so advancing a UTC midnight by exactly 24h always lands on
 * the next calendar date. No wall clock is being moved here.
 */
import type { IsoDate } from "../types";

export const MS_SECOND = 1000;
export const MS_MINUTE = 60 * MS_SECOND;
export const MS_HOUR = 60 * MS_MINUTE;
export const MS_UTC_DAY = 24 * MS_HOUR;

export const MINUTES_PER_LOCAL_DAY = 24 * 60;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

/** `YYYY-MM-DD` from calendar fields. Month is 1-based, as humans write it. */
export function isoDateOf(c: CalendarDate): IsoDate {
  return `${pad4(c.year)}-${pad2(c.month)}-${pad2(c.day)}`;
}

export function parseIsoDate(d: IsoDate): CalendarDate {
  const match = ISO_DATE_SHAPE.exec(d);
  if (match === null) {
    throw new RangeError(`not an ISO calendar date: ${d}`);
  }
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) {
    throw new RangeError(`not an ISO calendar date: ${d}`);
  }
  return { year: Number(year), month: Number(month), day: Number(day) };
}

/**
 * The instant named by reading the date digits as UTC.
 *
 * This is a pure re-encoding of the three numbers, not a conversion: it is the
 * value a wall clock reading `d` at midnight would have if the reader were on
 * UTC. Every zone-aware function pairs it with tzdata before using it.
 */
export function utcMsOfIsoDate(d: IsoDate): number {
  const { year, month, day } = parseIsoDate(d);
  return Date.UTC(year, month - 1, day);
}

export function isoDateOfUtcMs(ms: number): IsoDate {
  const at = new Date(ms);
  return isoDateOf({
    year: at.getUTCFullYear(),
    month: at.getUTCMonth() + 1,
    day: at.getUTCDate(),
  });
}

export function nextIsoDate(d: IsoDate): IsoDate {
  return isoDateOfUtcMs(utcMsOfIsoDate(d) + MS_UTC_DAY);
}

/** 0 = Sunday .. 6 = Saturday, for a calendar date with no zone attached. */
export function weekdayOfIsoDate(d: IsoDate): number {
  return new Date(utcMsOfIsoDate(d)).getUTCDay();
}
