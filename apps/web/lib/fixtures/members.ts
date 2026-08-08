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
 * The nine window sentences moved to `@/lib/window-strings` — they are
 * product copy, not fixture stand-in data, and needed to live somewhere a
 * real, live surface could import without tripping "this page reaches for
 * fixtures". Re-exported here so no import site in the Dates feature had to
 * change at the same time as this file.
 */
export { WINDOW_STRINGS } from "@/lib/window-strings";
