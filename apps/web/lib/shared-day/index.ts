/**
 * The shared-day model for Eva and Adam.
 *
 * One rule, stated once:
 *
 *   A shared day D is a named calendar date. A photo belongs to D when the
 *   author own local date was D at the instant they posted it.
 *
 *   sharedDay = (createdAt AT TIME ZONE <author IANA zone>)::date
 *
 * Two structural rules hold across every file here, and a test reads the
 * source of this directory to enforce them:
 *
 *   1. No numeric UTC shift, anywhere — not in code, not in a constant, not in
 *      a comment, not in a fixture. Zones are IANA identifier strings and every
 *      boundary is read from tzdata. A single number would quietly restore the
 *      fixed-anchor model that misfiles 44.1% of one partner posts every day.
 *   2. `Intl` only, and zero runtime dependencies. No timezone library is
 *      installed and none may be added without CTO approval.
 *
 * Layout:
 *   calendar.ts       calendar arithmetic with no zones in it
 *   zones.ts          the only place that talks to `Intl`
 *   members.ts        the two people, their zones, their working weeks
 *   bounds.ts         the day itself: naming, edges, containment, length
 *   windows.ts        the nine situations two clocks produce
 *   presence.ts       an honest guess about the other one, or `unknown`
 *   days-together.ts  the headline number
 */
export {
  MS_HOUR,
  MS_MINUTE,
  MS_SECOND,
  MS_UTC_DAY,
  isoDateOf,
  isoDateOfUtcMs,
  nextIsoDate,
  parseIsoDate,
  utcMsOfIsoDate,
  weekdayOfIsoDate,
} from "./calendar";
export type { CalendarDate } from "./calendar";

export {
  isSupportedTimeZone,
  localDateOf,
  localPartsOf,
  startOfLocalDay,
} from "./zones";
export type { LocalParts } from "./zones";

export { MEMBER_PROFILES, isMemberSlug, profileOf, resolveTz } from "./members";
export type { MemberProfile, Weekday } from "./members";

export {
  SHARED_DAY_CLOSE_TZ,
  SHARED_DAY_OPEN_TZ,
  boundsOf,
  containsInstant,
  dualLocalDates,
  sharedDayLengthMs,
  sharedDayOf,
} from "./bounds";
export type { DualLocalDates, SharedDayBounds } from "./bounds";

export { WINDOWS, currentWindow, readableClock, windowById } from "./windows";
export type { DayWindow, WindowId } from "./windows";

export { partnerPresence } from "./presence";
export type { PartnerPresence, PresenceGuess } from "./presence";

export { completeDays, daysTogether } from "./days-together";
