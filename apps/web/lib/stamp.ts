/**
 * The gap stamp — DESIGN-DIRECTION §7.
 *
 * Every item, everywhere, carries this stamp: two lines, no prose, no icon.
 * Line 1 is a plain-language condition describing what the other one was doing
 * when this was left. Line 2 is both clocks at that instant.
 *
 * This is the entire compensation for cutting The Gap as a surface
 * (PRODUCT-VISION-V2 §3.1). It is also what puts `lib/shared-day/` to
 * work on every screen.
 *
 * TWO INVARIANTS held across every function in this file:
 *   1. Absolute, never relative. "Monday, 5:12 his morning" is a caption;
 *      "3 days ago" is a ledger entry. Nothing here may compute an elapsed
 *      anything.
 *   2. No numeric UTC offset constant. `offsetNote` derives from
 *      `sharedDayLengthMs`; two zones that disagree about DST produce a
 *      30h shared day, two that agree produce a 31h one, and that is the
 *      entire input the offset-note decision needs.
 */

import type { IsoDate, IsoDateTime, MemberSlug } from "@/lib/types";
import { localTime } from "@/lib/time";
import {
  localPartsOf,
  MEMBER_PROFILES,
  MS_HOUR,
  partnerPresence,
  sharedDayLengthMs,
} from "@/lib/shared-day";
import type { PresenceGuess } from "@/lib/shared-day";

/* ------------------------------------------------------------------
 * Display strings — every user-visible string in one place.
 *
 * If the founder wants the DESIGN-DIRECTION §7 his/her wording
 * verbatim, change it here and nowhere else.
 *
 * Eva's name is first wherever both appear and neither is the author
 * (Rule 6 / §A.6 of Brief A). The stamp's line 2 puts the author first
 * because one of them IS the author and they earn first position.
 * ------------------------------------------------------------------ */
export const STAMP_STRINGS = {
  // Conditions — partner-name templates
  leftWhileAsleep: (name: string) => `left while ${name} was asleep`,
  leftWhileAtWork: (name: string) => `left while ${name} was at work`,
  // Time-of-day fallback — used when partner was awake or state is unknown.
  // Based on the author's own local hour at the time of leaving.
  leftEarlyMorning: "left early this morning",
  leftThisMorning: "left this morning",
  leftThisAfternoon: "left this afternoon",
  leftThisEvening: "left this evening",
  leftLate: "left late",
  // DST note — surfaces once below the window sentence for ~26 days/year
  dstNote: "Six hours this week, not seven.",
} as const;

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

export interface Stamp {
  /**
   * Line 1: the condition at the moment of leaving.
   * e.g. "left while Eva was asleep"
   */
  condition: string;
  /**
   * Line 2, first half: the author in their own city's clock.
   * e.g. "Adam 6:20 am"
   */
  author: string;
  /**
   * Line 2, second half: the other one in their own city's clock, same instant.
   * e.g. "Eva 11:20 pm"
   */
  other: string;
}

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

function conditionFor(
  presence: PresenceGuess,
  otherName: string,
  authorLocalHour: number,
): string {
  if (presence === "asleep") return STAMP_STRINGS.leftWhileAsleep(otherName);
  if (presence === "working") return STAMP_STRINGS.leftWhileAtWork(otherName);

  // "awake" or "unknown" — describe the author's local time of day instead.
  // Rule 2: must not say the partner was asleep when they were not.
  if (authorLocalHour < 5) return STAMP_STRINGS.leftLate;
  if (authorLocalHour < 8) return STAMP_STRINGS.leftEarlyMorning;
  if (authorLocalHour < 12) return STAMP_STRINGS.leftThisMorning;
  if (authorLocalHour < 17) return STAMP_STRINGS.leftThisAfternoon;
  if (authorLocalHour < 21) return STAMP_STRINGS.leftThisEvening;
  return STAMP_STRINGS.leftLate;
}

/* ------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------ */

/**
 * The gap stamp for an item left at `leftAt` by `authorSlug`.
 *
 * Calling site: pass the stored `createdAt` UTC instant and the
 * author's slug. All clock-reading happens here, in the author's and
 * partner's own IANA zones, derived from their profiles.
 */
export function stampFor(leftAt: IsoDateTime, authorSlug: MemberSlug): Stamp {
  const authorProfile = MEMBER_PROFILES[authorSlug];
  const otherSlug: MemberSlug = authorSlug === "eva" ? "adam" : "eva";
  const otherProfile = MEMBER_PROFILES[otherSlug];
  const instant = new Date(leftAt);

  const authorParts = localPartsOf(instant, authorProfile.homeTimezone);
  const presence = partnerPresence(otherSlug, instant);
  const condition = conditionFor(
    presence.presence,
    otherProfile.displayName,
    authorParts.hour,
  );

  const authorTime = localTime(instant, authorProfile.homeTimezone);
  const otherTime = localTime(instant, otherProfile.homeTimezone);

  return {
    condition,
    author: `${authorProfile.displayName} ${authorTime}`,
    other: `${otherProfile.displayName} ${otherTime}`,
  };
}

/**
 * The DST note — "Six hours this week, not seven."
 *
 * Returns the note string during the two windows each year when one zone
 * has changed over to summer time and the other has not (~26 days total).
 * Returns null on the ~339 ordinary days.
 *
 * Derived from `sharedDayLengthMs(day)`:
 *   30 × MS_HOUR → zones disagree about DST → show the note
 *   31 × MS_HOUR → zones agree → null
 */
export function offsetNote(day: IsoDate): string | null {
  const ms = sharedDayLengthMs(day);
  // The shared day is exactly 31 × MS_HOUR when both zones agree about DST,
  // and exactly 30 × MS_HOUR when they do not. Using < 31 × MS_HOUR catches
  // the disagreement days without encoding the offset.
  if (ms < 31 * MS_HOUR) {
    return STAMP_STRINGS.dstNote;
  }
  return null;
}
