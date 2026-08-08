import type { IanaTimeZone, IsoDate, IsoDateTime, Photo } from "@/lib/types";

/**
 * Time display, the whole vocabulary.
 *
 * Every offset-dependent value derives from IANA zones via `Intl`
 * (direction §13). No numeric offsets, no timezone library, nothing
 * baked in. The gap is 6 hours for roughly 26 days a year; nothing
 * here knows or cares.
 */

/** `11:48 pm` — that person's own local time, lowercase meridiem. */
export function localTime(iso: IsoDateTime | Date, tz: IanaTimeZone): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  })
    .format(d)
    .toLowerCase()
    .replace(/\s/g, " "); // NBSP from Intl → plain space, one style everywhere
}

/** That person's own local calendar date, `YYYY-MM-DD`. */
export function localDate(iso: IsoDateTime | Date, tz: IanaTimeZone): IsoDate {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(d);
}

/** Fractional local hour (0–24) in a zone, for the dial. */
export function localHour(now: Date, tz: IanaTimeZone): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: tz,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

/** `Tuesday, 4 August` — the running head at the foot of a spread. */
export function runningHeadDate(day: IsoDate): string {
  const [y, m, d] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(utc);
}

/** `2 August 2026` — the title page's begun-line, the colophon. */
export function longDate(day: IsoDate): string {
  const [y, m, d] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utc);
}

/** `August` — thumb-index tabs are named by month, sized by what exists. */
export function monthOf(day: IsoDate): string {
  const [y, m] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(utc);
}

/**
 * A photo's own posted time, in its own author's zone — `postedAtLocal`.
 *
 * Moved here from `lib/fixtures/photos.ts`: it is a one-line wrapper around
 * `localTime` that reads only a `Photo`'s own fields, true of a fixture
 * photograph and a live one alike. Living under `lib/fixtures/` made every
 * caller — including Spread, which real Book pages render — look like it
 * was reaching for stand-in data when it was not.
 */
export function postedAtLocal(p: Pick<Photo, "createdAt" | "sharedDayTz">): string {
  return localTime(p.createdAt, p.sharedDayTz);
}
