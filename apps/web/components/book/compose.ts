import type { Photo } from "@/lib/types";

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

/** What every function below needs to know about a photo's author. */
type Authored = Pick<Photo, "authorSlug" | "authorMemberId">;

/**
 * The photo's author, or a loud failure.
 *
 * `authorSlug` used to be derived here by comparing `authorMemberId`
 * against the two fixture ids (`EVA.id`/`ADAM.id`) — which worked only
 * because every photo in the app WAS a fixture. The live database uses its
 * own ids (`supabase/seed.sql`), so that comparison silently attributed
 * every real photograph to Adam. Every producer of a `Photo` that reaches
 * this module — the fixture builder (`lib/fixtures/photos.ts`) and the live
 * composition layer (`lib/data/`) alike — now sets `authorSlug` directly
 * from whichever roster it already has in hand. Throwing on a miss is
 * deliberate: a caption silently rendered in the wrong hand is exactly the
 * kind of "looks right, isn't" bug this product has no tolerance for.
 */
function slugOf(photo: Authored): "eva" | "adam" {
  if (photo.authorSlug === undefined) {
    throw new Error(
      `compose: photo ${photo.authorMemberId} has no authorSlug — every Photo ` +
        "reaching this module must have one set by its producer (a fixture " +
        "builder or a live composition function), never derived here.",
    );
  }
  return photo.authorSlug;
}

export const isEva = (photo: Authored) => slugOf(photo) === "eva";
export const isAdam = (photo: Authored) => slugOf(photo) === "adam";

/** Exported so callers that need the slug itself (the stamp, alt text) don't
    have to re-derive it with their own comparison. */
export const authorSlugOf = slugOf;

/** There are exactly two people in this product, forever (`lib/types.ts`). */
export const DISPLAY_NAME: Record<"eva" | "adam", string> = {
  eva: "Eva",
  adam: "Adam",
};

/**
 * Their hand, per the §2 register table. Never swapped; if authorship
 * were ever ambiguous the line would take the app's voice (Fraunces),
 * not either hand. Caveat runs smaller on the eye than Patrick Hand
 * at equal px — sizes compensate so neither hand shouts.
 */
export function handClass(photo: Authored, size: "caption" | "large" = "caption"): string {
  if (size === "large") {
    return isEva(photo) ? "font-eva text-[33px]" : "font-adam text-[26px]";
  }
  return isEva(photo) ? "font-eva text-[23px]" : "font-adam text-[18px]";
}

/** The chin of a polaroid is narrow — a step smaller again. */
export function chinHandClass(photo: Authored): string {
  return isEva(photo) ? "font-eva text-[19px]" : "font-adam text-[15px]";
}

/**
 * The mount an item lives in — ONE pick, every surface. An object IS
 * its mount: the same photograph must appear in the same frame on the
 * resurfaced opening, in a day spread, everywhere (the seeded-forever
 * rule applied across surfaces, not just across sessions). The first
 * pair capture caught d0730-adam wearing a chin frame on one surface
 * and a square one on another because two lists diverged.
 */
export type MountKind = "chin" | "square" | "torn" | "stock";

/**
 * "square" (polaroid-frame-empty) is asset-gated out of the rotation:
 * its scan carries a dark smear along the left border that survives
 * any honest key — junk on the frame itself, not around it (verified
 * against the raw at 1:1). The render path stays; return it to this
 * list when a clean scan is generated. The Taped/Pinned pattern.
 */
export function mountFor(photoId: string): MountKind {
  return seededPick<MountKind>(photoId, ["chin", "torn", "stock"]);
}
