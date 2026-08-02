/**
 * The headline number.
 *
 * A day counts once both of us posted on it. It is deliberately not a count of
 * photos, not a streak, and not a count of days elapsed since some start date:
 * nothing here can be broken by a missed day, and nothing here rewards volume.
 * Two people, one day, both present.
 *
 * `bothPosted` on the row is documented as derived, so this recomputes it from
 * the two facts it is derived from rather than trusting a denormalised flag
 * that some writer may not have refreshed. Dates are de-duplicated because a
 * caller may hand us the same day from two pages of results.
 */
import type { IsoDate, SharedDay } from "../types";

export function daysTogether(days: readonly SharedDay[]): number {
  const complete = new Set<IsoDate>();
  for (const day of days) {
    if (day.evaPosted && day.adamPosted) complete.add(day.date);
  }
  return complete.size;
}

/** The days that count, in ascending date order. */
export function completeDays(days: readonly SharedDay[]): SharedDay[] {
  const byDate = new Map<IsoDate, SharedDay>();
  for (const day of days) {
    if (day.evaPosted && day.adamPosted) byDate.set(day.date, day);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
