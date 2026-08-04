import { ADAM, EVA } from "@/lib/fixtures/members";

/**
 * Shared composition helpers for The Book — one place, three readers
 * (ResurfacedItem, Spread, the review harness).
 *
 * Everything here is deterministic from a stable ID. §4: composition
 * never re-rolls; the seed is the item's database ID, never an array
 * index.
 */

/** djb2 → [0, 1). Same hash family <Mounted> uses, kept local so the
    primitive's PRNG stays private. */
export function seeded(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) hash = (hash * 33) ^ id.charCodeAt(i);
  return ((hash >>> 0) % 1000) / 1000;
}

/** Seeded value in [min, max]. */
export function seededIn(id: string, min: number, max: number): number {
  return min + seeded(id) * (max - min);
}

/** Seeded pick from a list — mounts, offsets, tape corners. */
export function seededPick<T>(id: string, options: readonly T[]): T {
  return options[Math.floor(seeded(id) * options.length) % options.length]!;
}

export const isEva = (memberId: string) => memberId === EVA.id;
export const isAdam = (memberId: string) => memberId === ADAM.id;

/**
 * Their hand, per the §2 register table. Never swapped; if authorship
 * were ever ambiguous the line would take the app's voice (Fraunces),
 * not either hand. Caveat runs smaller on the eye than Patrick Hand
 * at equal px — sizes compensate so neither hand shouts.
 */
export function handClass(memberId: string, size: "caption" | "large" = "caption"): string {
  if (size === "large") {
    return isEva(memberId) ? "font-eva text-[33px]" : "font-adam text-[26px]";
  }
  return isEva(memberId) ? "font-eva text-[23px]" : "font-adam text-[18px]";
}

/** The chin of a polaroid is narrow — a step smaller again. */
export function chinHandClass(memberId: string): string {
  return isEva(memberId) ? "font-eva text-[19px]" : "font-adam text-[15px]";
}
