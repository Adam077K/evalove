/**
 * The two people, and the zone each of them is read in.
 *
 * A profile carries the home zone as an IANA identifier and the days that
 * count as a working week on that persons own local calendar. Adam works
 * Sunday to Thursday, Eva Monday to Friday; that difference is a fact about
 * the week, not about any clock, so it lives here rather than in the presence
 * inference that consumes it.
 */
import { isSupportedTimeZone } from "./zones";

import type { IanaTimeZone, Member, MemberSlug } from "../types";

/** 0 = Sunday .. 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MemberProfile {
  slug: MemberSlug;
  displayName: string;
  homeTimezone: IanaTimeZone;
  /** Working days on this persons own local calendar. */
  workdays: readonly Weekday[];
}

export const MEMBER_PROFILES: Readonly<Record<MemberSlug, MemberProfile>> = {
  eva: {
    slug: "eva",
    displayName: "Eva",
    homeTimezone: "America/New_York",
    workdays: [1, 2, 3, 4, 5],
  },
  adam: {
    slug: "adam",
    displayName: "Adam",
    homeTimezone: "Asia/Jerusalem",
    workdays: [0, 1, 2, 3, 4],
  },
};

export function isMemberSlug(value: unknown): value is MemberSlug {
  return value === "eva" || value === "adam";
}

/**
 * The zone a piece of content should be filed in.
 *
 * The device report wins whenever it is a zone this runtime can resolve. That
 * is the whole visit story: when Eva is in Jerusalem her phone says so, and
 * her photos are filed on the date she is actually living, with no travel flag
 * and no special case anywhere downstream.
 *
 * When neither the device nor the home zone is usable we fall back to the zone
 * the shared day opens in. The day model is only ever wrong in one direction
 * that matters — filing a photo under a date that has already been lived — and
 * the earliest zone is the one that cannot do that.
 */
export function resolveTz(
  clientReportedTz?: string,
  homeTz?: string,
): IanaTimeZone {
  if (isSupportedTimeZone(clientReportedTz)) return clientReportedTz;
  if (isSupportedTimeZone(homeTz)) return homeTz;
  return MEMBER_PROFILES.adam.homeTimezone;
}

/**
 * The profile for a member id.
 *
 * Accepts a slug directly, or a database uuid when the caller passes the
 * roster it was read from. A roster row wins over the built-in profile for the
 * two fields it owns, because the database is where a zone change is recorded.
 * Returns `null` when the id resolves to nobody — the caller must render that.
 */
export function profileOf(
  memberId: string,
  roster: readonly Member[] = [],
): MemberProfile | null {
  if (isMemberSlug(memberId)) return MEMBER_PROFILES[memberId];

  const row = roster.find((member) => member.id === memberId);
  if (row === undefined) return null;

  const base = MEMBER_PROFILES[row.slug];
  return {
    ...base,
    displayName: row.displayName,
    homeTimezone: isSupportedTimeZone(row.homeTimezone)
      ? row.homeTimezone
      : base.homeTimezone,
  };
}
