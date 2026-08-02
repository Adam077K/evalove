import type { Member } from "@/lib/types";

/** Eva before Adam, everywhere — including in this array. */
export const MEMBERS: readonly [Member, Member] = [
  { id: "eva", name: "Eva", city: "New York", tz: "America/New_York" },
  { id: "adam", name: "Adam", city: "Tel Aviv", tz: "Asia/Jerusalem" },
] as const;

export const EVA = MEMBERS[0];
export const ADAM = MEMBERS[1];

/**
 * The nine windows, in the couple's own words — PRD §2, verbatim.
 * The w-codes exist in data only and never appear on screen.
 */
export const WINDOW_STRINGS: Record<string, string> = {
  w1: "Eva’s in bed, Adam’s awake",
  w2: "Eva’s up early",
  w3: "Eva’s commute",
  w4: "Eva’s lunch break",
  w5: "Eva’s just off work, Adam’s fading",
  w6: "Worth staying up for",
  w7: "Saturday — Eva and Adam both off",
  w8: "Eva’s at work, Adam’s day is free",
  w9: "Eva’s day is free, Adam’s at work",
};
