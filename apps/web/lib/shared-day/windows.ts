/**
 * The nine windows of a shared day.
 *
 * Two clocks seven hours apart do not give a couple twenty-four interchangeable
 * hours; they give a small number of recognisably different situations, and the
 * UI names them. A window is one of those situations: what each of us is most
 * likely doing while the other does something else.
 *
 * The windows are keyed off the wall clock in the opening zone, and that is
 * enough to place both of us, because the two clocks move together. When the
 * two zones disagree about DST for a few weeks the pairing slides by an hour;
 * that slide is real, it is what those weeks feel like, and reading the clock
 * from tzdata is what lets the windows follow it instead of pretending.
 *
 * The set starts at w1 when the opening zone wakes up, runs forward through
 * the day, crosses local midnight into w8 and w9, and closes the loop. Nine
 * bands, no gaps, no overlap.
 */
import { MINUTES_PER_LOCAL_DAY } from "./calendar";
import { SHARED_DAY_OPEN_TZ } from "./bounds";
import { localPartsOf } from "./zones";

import type { LocalParts } from "./zones";
import type { IanaTimeZone } from "../types";

export type WindowId =
  "w1" | "w2" | "w3" | "w4" | "w5" | "w6" | "w7" | "w8" | "w9";

export interface DayWindow {
  id: WindowId;
  /** Human label. Describes the situation, never a clock reading. */
  label: string;
  /** Minutes since local midnight in the opening zone, inclusive. */
  fromMinute: number;
  /** Minutes since local midnight in the opening zone, exclusive. */
  toMinute: number;
}

/** Ascending by `fromMinute`, tiling the whole local day exactly once. */
export const WINDOWS: readonly DayWindow[] = [
  {
    id: "w8",
    label: "the closing zone alone in the evening",
    fromMinute: 0,
    toMinute: 180,
  },
  {
    id: "w9",
    label: "one of us late, the other deeply asleep",
    fromMinute: 180,
    toMinute: 420,
  },
  {
    id: "w1",
    label: "the opening zone wakes, the closing zone turns in",
    fromMinute: 420,
    toMinute: 540,
  },
  {
    id: "w2",
    label: "deep work against deep sleep",
    fromMinute: 540,
    toMinute: 720,
  },
  {
    id: "w3",
    label: "midday against sunrise",
    fromMinute: 720,
    toMinute: 900,
  },
  {
    id: "w4",
    label: "the first overlap",
    fromMinute: 900,
    toMinute: 1020,
  },
  {
    id: "w5",
    label: "evening against mid-morning",
    fromMinute: 1020,
    toMinute: 1140,
  },
  {
    id: "w6",
    label: "the long overlap",
    fromMinute: 1140,
    toMinute: 1320,
  },
  {
    id: "w7",
    label: "the opening zone winds down",
    fromMinute: 1320,
    toMinute: MINUTES_PER_LOCAL_DAY,
  },
];

export function windowById(id: WindowId): DayWindow | null {
  return WINDOWS.find((w) => w.id === id) ?? null;
}

/**
 * The wall clock in `tz`, or `null` when there is no clock to read.
 *
 * Both callers of this treat an unreadable clock as a real answer to show,
 * not as an error to swallow, so it returns instead of throwing.
 */
export function readableClock(at: Date, tz: IanaTimeZone): LocalParts | null {
  if (!Number.isFinite(at.getTime())) return null;
  try {
    return localPartsOf(at, tz);
  } catch {
    return null;
  }
}

/**
 * Which window we are in at instant `at`.
 *
 * `null` is returned only when there is no clock to read: a non-finite instant,
 * or a zone this runtime cannot resolve. It is never a stand-in for an instant
 * the model could not classify, because the nine bands cover the whole day.
 */
export function currentWindow(
  at: Date,
  tz: IanaTimeZone = SHARED_DAY_OPEN_TZ,
): WindowId | null {
  const parts = readableClock(at, tz);
  if (parts === null) return null;

  const minute = parts.hour * 60 + parts.minute;
  const found = WINDOWS.find(
    (w) => minute >= w.fromMinute && minute < w.toMinute,
  );
  return found?.id ?? null;
}
