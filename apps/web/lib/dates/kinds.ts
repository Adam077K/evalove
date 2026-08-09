/**
 * The seven kinds of date two people seven hours apart can actually go on.
 *
 * Not a category list and not a feed. Seven fixed things, each one chosen
 * because the distance does not break it, and each one carrying the reason it
 * does not break — because "why does this work for us" is the only question
 * either of them is actually asking when they open this screen.
 *
 * WHERE THESE CAME FROM. Five are library records: `docs/10-activity-library/
 * library.json`, carried here with their own `verification_tier` so a claim we
 * did not source is still labelled as one we did not source. Two —
 * `an-hour-that-ends` and `the-same-hour-walk` — are the founder's own, from
 * the 2026-08-10 brief; both are marked `plausible-unverified` and name the
 * nearest library record they are not quite.
 *
 * WHY `windowFit` IS NOT COPIED FROM THE LIBRARY. It cannot be. The library's
 * `window_fit` uses the SHELF taxonomy — the nine names in
 * `lib/window-strings.ts` ("Eva’s commute", "Worth staying up for") — and this
 * field uses the nine CLOCK BANDS in `lib/shared-day/windows.ts`. They share
 * the keys `w1`–`w9` and they are not the same set. Reading the bands against
 * the two real wall clocks on an ordinary August day:
 *
 *     w8  Tel Aviv 00:00–03:00   New York 17:00–20:00
 *     w9            03:00–07:00            20:00–00:00
 *     w1            07:00–09:00            00:00–02:00
 *     w2            09:00–12:00            02:00–05:00
 *     w3            12:00–15:00            05:00–08:00
 *     w4            15:00–17:00            08:00–10:00
 *     w5            17:00–19:00            10:00–12:00
 *     w6            19:00–22:00            12:00–15:00
 *     w7            22:00–00:00            15:00–17:00
 *
 * — against which the shelf name for `w4` is "Eva’s lunch break" (it is her
 * 08:00) and for `w6` is "Worth staying up for" (Adam is at 19:00). The shelf
 * names are a different, older taxonomy. Every `windowFit` below was chosen by
 * reading that table, not by copying a field.
 *
 * NO `survives` LINE NAMES A CLOCK TIME, and that is a rule rather than a
 * style. Most kinds fit two or three bands, and the band is chosen when the
 * date is proposed — so a line reading "Eva starts hers at 15:00" was true of
 * one of the bands it appeared under and false of the others, and it shipped
 * that way until somebody rendered the screen and read it. The instant belongs
 * to the readback, which computes it; these lines describe the shape.
 */

import type { WindowId } from "@/lib/shared-day";
import type { ActivityCostTier, VerificationTier } from "@/lib/types";

/** The slug that lands in `date_plans.kind`. Shape matches the column's check. */
export type DateKindSlug =
  | "same-film"
  | "an-hour-that-ends"
  | "two-kitchens"
  | "the-same-hour-walk"
  | "read-until-she-sleeps"
  | "the-same-chapter"
  | "the-mirrored-errand";

export interface DateKindEntry {
  slug: DateKindSlug;
  /** What it is called on the card. */
  title: string;
  /** One line: what the two of them actually do. */
  line: string;
  /**
   * Why this one survives seven hours of distance.
   *
   * The load-bearing field. A date kind without this is a suggestion, and they
   * have had enough suggestions.
   */
  survives: string;
  durationMin: number;
  /** Clock bands from `lib/shared-day/windows.ts`. See the file header. */
  windowFit: readonly WindowId[];
  /**
   * True when the thing only works with both of them present at once. False
   * means the gap is doing some of the work — one of them leaves it, the other
   * finds it, and nobody is waiting.
   */
  needsBothAwake: boolean;
  screenFree: boolean;
  costTier: ActivityCostTier;
  verification: VerificationTier;
  /** The library record behind it, where there is one. */
  sourceId?: string;
  /** Named when this is not a library record but stands next to one. */
  nearestSourceId?: string;
}

export const DATE_KINDS: readonly DateKindEntry[] = [
  {
    slug: "same-film",
    title: "The same film, started together",
    line: "Both press play on the count of three and neither says a word until the credits.",
    survives:
      "A film needs one agreed second and nothing after it. They press play " +
      "together and the distance has nothing left to do — it is the one shape " +
      "of an evening that does not need a connection good enough to talk over.",
    durationMin: 120,
    windowFit: ["w7", "w8"],
    needsBothAwake: true,
    screenFree: false,
    costTier: "free",
    verification: "verified",
    sourceId: "t1-manual-321-sync-fallback",
  },
  {
    slug: "an-hour-that-ends",
    title: "An hour with an end on it",
    line: "A call with the finish agreed before it starts, and kept.",
    survives:
      "An hour that ends is an occasion. One that does not is an obligation — " +
      "and the difference between them is why a call with its finish agreed " +
      "first reads as being met rather than being checked on. The end is the " +
      "part that makes it a date.",
    durationMin: 60,
    windowFit: ["w6", "w7"],
    needsBothAwake: true,
    screenFree: true,
    costTier: "free",
    verification: "plausible-unverified",
    nearestSourceId: "t6-lunch-five-minute-checkin",
  },
  {
    slug: "two-kitchens",
    title: "The same meal, two kitchens",
    line: "One recipe, both cooking it, the call propped against something.",
    survives:
      "The seven hours do this one unaided: Eva’s afternoon and Adam’s evening " +
      "are the same hour, so her lunch and his dinner are the same meal without " +
      "either of them moving a thing. Two kitchens making one recipe is the " +
      "closest this gets to a table.",
    durationMin: 60,
    windowFit: ["w6", "w7"],
    needsBothAwake: true,
    screenFree: false,
    costTier: "cheap",
    verification: "plausible-unverified",
    sourceId: "t2-cook-same-recipe-facetime",
  },
  {
    slug: "the-same-hour-walk",
    title: "A walk at the same hour",
    line: "Both outside at once, in their own city, sending back what they see.",
    survives:
      "Neither of them has to be anywhere or look at anything. Eva walks her " +
      "block, Adam walks his, and the two cities are the content — a " +
      "photograph each, arriving while the other one is still out.",
    durationMin: 30,
    windowFit: ["w5", "w6", "w7"],
    needsBothAwake: true,
    screenFree: true,
    costTier: "free",
    verification: "plausible-unverified",
    nearestSourceId: "t2-guided-tour-neighbourhood",
  },
  {
    slug: "read-until-she-sleeps",
    title: "Reading aloud until she sleeps",
    line: "One shared novel. Eva gets comfortable; Adam reads until she stops answering.",
    survives:
      "This one needs the gap rather than surviving it. Eva is going to bed; " +
      "Adam has just got up and has the whole day in front of him to be tired " +
      "in. Nobody is staying awake for anybody, which is what makes it " +
      "repeatable.",
    durationMin: 30,
    windowFit: ["w1"],
    needsBothAwake: true,
    screenFree: true,
    costTier: "free",
    verification: "verified",
    sourceId: "t2-read-aloud-bedtime-book",
  },
  {
    slug: "the-same-chapter",
    title: "The same chapter, counted in",
    line: "Both download the chapter, count three, and listen to it at the same second.",
    survives:
      "Headphones, no screen, both hands free. It is the only version of " +
      "listening together that works on a subway platform with no signal, " +
      "because the audio is already on the phone and the only live thing is the " +
      "count-in.",
    durationMin: 30,
    windowFit: ["w3", "w4"],
    needsBothAwake: true,
    screenFree: true,
    costTier: "cheap",
    verification: "verified",
    sourceId: "t1-audiobook-manual-sync-commute",
  },
  {
    slug: "the-mirrored-errand",
    title: "The mirrored errand",
    line: "One ordinary errand — bread, stamps, a bulb — run in both cities, receipts compared.",
    survives:
      "Nothing has to happen at the same second, which is why this one holds on " +
      "a day that goes wrong. Two receipts for the same errand from two cities, " +
      "and the difference between them is the entire point.",
    durationMin: 20,
    windowFit: ["w4", "w5"],
    needsBothAwake: false,
    screenFree: true,
    costTier: "cheap",
    verification: "plausible-unverified",
    sourceId: "b1-mirrored-errand",
  },
];

/** Lookup by slug. `null` for anything not in the seven. */
export function dateKind(slug: string): DateKindEntry | null {
  return DATE_KINDS.find((k) => k.slug === slug) ?? null;
}

export function isDateKindSlug(value: unknown): value is DateKindSlug {
  return typeof value === "string" && dateKind(value) !== null;
}

/**
 * The kinds that fit a given band, soonest-relevant first.
 *
 * A band with nothing on it returns an empty array and the caller decides what
 * that means. It is never padded with a near-miss: offering a bedtime reading
 * at 09:00 because the list looked short is how a shelf stops being trusted.
 */
export function kindsForWindow(id: WindowId): DateKindEntry[] {
  return DATE_KINDS.filter((k) => k.windowFit.includes(id));
}

/** Every band at least one kind fits, in the order the day runs. */
export function windowsWithKinds(order: readonly WindowId[]): WindowId[] {
  return order.filter((id) => kindsForWindow(id).length > 0);
}
