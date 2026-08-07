/**
 * The nine windows, in the couple's own words — PRD §2, verbatim.
 *
 * Product copy, not stand-in data: every id `currentWindow` (lib/shared-day,
 * a real live clock computation) can return maps to one of these sentences,
 * and the sentence is what ships to every user, always. It used to live
 * under `lib/fixtures/`, alongside genuine placeholder content (fixture
 * photographs, fixture days) — that neighbourhood made it impossible for a
 * surface reading real data to import this file without also being flagged
 * as reaching for fixtures. Moved out so Today, a real surface, can read the
 * app's own window sentence without touching `lib/fixtures/` at all.
 *
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
