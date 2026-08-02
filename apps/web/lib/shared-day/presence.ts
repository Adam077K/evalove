/**
 * What the other one is probably doing right now.
 *
 * This is an inference, not a signal. Nothing on either device reports being
 * awake, nothing records a last-seen, and no read receipt exists to mine. All
 * this has is the wall clock where that person lives and whether the day is a
 * working day for them, and from those two facts it guesses. The guess is
 * shown as a guess.
 *
 * `unknown` is therefore a first-class answer and not an error path. It means
 * there is no clock to read — an id that resolves to nobody, or an instant
 * that is not a real instant — and the UI is required to render it rather than
 * fall back to something more confident than the truth.
 *
 * Pure in its inputs. Passing `at` explicitly makes it testable; leaving it out
 * reads the current instant and nothing else.
 */
import { profileOf } from "./members";
import { currentWindow, readableClock } from "./windows";

import type { MemberProfile } from "./members";
import type { WindowId } from "./windows";
import type { LocalParts } from "./zones";
import type { IsoDate, Member } from "../types";

export type PresenceGuess = "asleep" | "working" | "awake" | "unknown";

export interface PartnerPresence {
  /** `HH:mm` where they are. Empty when `presence` is `unknown`. */
  localTime: string;
  /** `YYYY-MM-DD` where they are. Empty when `presence` is `unknown`. */
  localDate: IsoDate;
  presence: PresenceGuess;
  window: WindowId | null;
}

/** Local hour from which we assume the night has started. */
const NIGHT_FROM_HOUR = 23;
/** Local hour from which we assume they are up again. */
const MORNING_FROM_HOUR = 7;
/** Local hours the working day is assumed to fill, on a working day. */
const WORK_FROM_HOUR = 9;
const WORK_UNTIL_HOUR = 18;

const NO_CLOCK: PartnerPresence = {
  localTime: "",
  localDate: "",
  presence: "unknown",
  window: null,
};

function guessFrom(parts: LocalParts, profile: MemberProfile): PresenceGuess {
  if (parts.hour >= NIGHT_FROM_HOUR || parts.hour < MORNING_FROM_HOUR) {
    return "asleep";
  }

  const onDuty =
    parts.hour >= WORK_FROM_HOUR &&
    parts.hour < WORK_UNTIL_HOUR &&
    profile.workdays.some((day) => day === parts.weekday);

  return onDuty ? "working" : "awake";
}

/**
 * Where the other one is in their own day.
 *
 * `memberId` may be a slug or a database uuid; pass `roster` when it is a uuid,
 * since this module holds no database handle and will not open one.
 */
export function partnerPresence(
  memberId: string,
  at: Date = new Date(),
  roster: readonly Member[] = [],
): PartnerPresence {
  const profile = profileOf(memberId, roster);
  if (profile === null) return NO_CLOCK;

  const parts = readableClock(at, profile.homeTimezone);
  if (parts === null) return NO_CLOCK;

  return {
    localTime: parts.time,
    localDate: parts.date,
    presence: guessFrom(parts, profile),
    window: currentWindow(at),
  };
}
