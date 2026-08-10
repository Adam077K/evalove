import type { Member, MemberSlug, Uuid } from "@/lib/types";

/**
 * Fixture members, against the canonical contract (`lib/types.ts`).
 * Eva before Adam, everywhere — including in this array.
 *
 * THE IDS ARE THE DATABASE'S IDS, and that is not a coincidence to be
 * tidied away. They used to be a separate invented pair (`1e0a5c1e-…` /
 * `2ad0f4b2-…`) while `supabase/seed.sql` inserted `1111…` / `2222…`, so
 * every fixture-backed screen was carrying a member id that did not
 * exist in the database — a value with the right type, the right shape,
 * and no row behind it. Nothing broke only because nothing wrote with
 * it. `__tests__/member-ids.test.ts` reads seed.sql and fails if these
 * two lines and that file ever disagree again.
 *
 * These rows are still fixtures for everything else: the display names
 * and `createdAt` here are stand-ins, and a screen that needs real
 * member data reads `lib/data/members.ts`.
 */

export const EVA: Member = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "eva",
  displayName: "Eva",
  homeTimezone: "America/New_York",
  createdAt: "2026-08-01T14:03:00Z",
};

export const ADAM: Member = {
  id: "22222222-2222-4222-8222-222222222222",
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
