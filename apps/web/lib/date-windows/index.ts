/**
 * Placing a date on the real timeline.
 *
 * `lib/shared-day` is the closed package that owns the day model: what a shared
 * day is, where its edges are, and which of the nine windows is happening now.
 * This module is the one thing that model does not do — running a window
 * backwards, from a name and a date to two instants — and it is deliberately
 * outside that package rather than added to it.
 *
 *   instants.ts   a window on a named day, as two real instants
 *
 * Everything here reads tzdata through `lib/shared-day`'s own exports. There is
 * no second implementation of the day model in this directory and there must
 * not be one.
 */
export {
  OVERLAP_WINDOW_IDS,
  bothClocksAt,
  firstInstantOfLocalMinute,
  isOverlapWindow,
  placeWindow,
  sharedDaysFrom,
} from "./instants";
export type { BothClocks, WindowPlacement } from "./instants";
