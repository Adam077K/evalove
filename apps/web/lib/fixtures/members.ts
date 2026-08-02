import type { Member, MemberSlug, Uuid } from "@/lib/types";

/**
 * Fixture members, against the canonical contract (`lib/types.ts`).
 * Eva before Adam, everywhere — including in this array.
 */

export const EVA: Member = {
  id: "1e0a5c1e-4c11-4b6e-9a3e-7d2f5b9c0a01",
  slug: "eva",
  displayName: "Eva",
  homeTimezone: "America/New_York",
  createdAt: "2026-08-01T14:03:00Z",
};

export const ADAM: Member = {
  id: "2ad0f4b2-8e4e-4d1c-b7a4-9c3e6f1d0b02",
  slug: "adam",
  displayName: "Adam",
  homeTimezone: "Asia/Jerusalem",
  createdAt: "2026-08-01T17:41:00Z",
};

export const MEMBERS: readonly [Member, Member] = [EVA, ADAM];

export function memberById(id: Uuid): Member {
  return id === ADAM.id ? ADAM : EVA;
}

export function memberBySlug(slug: MemberSlug): Member {
  return slug === "adam" ? ADAM : EVA;
}

export function partnerOf(m: Member): Member {
  return m.slug === "eva" ? ADAM : EVA;
}

/** Display names of the two cities. New York first (§2.3). */
export const CITY: Record<MemberSlug, string> = {
  eva: "New York",
  adam: "Tel Aviv",
};

/**
 * Coordinates for the computed sky and the dial's lit arc — data,
 * never display. Solar altitude is a pure function of these.
 */
export const COORDS: Record<MemberSlug, { lat: number; lon: number }> = {
  eva: { lat: 40.7128, lon: -74.006 },
  adam: { lat: 32.0853, lon: 34.7818 },
};

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
