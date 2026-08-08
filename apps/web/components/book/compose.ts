import type { MemberSlug, Photo } from "@/lib/types";

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
 * Whether a photo is signed, and by whom — or deliberately unsigned.
 *
 * A discriminated union rather than `MemberSlug | undefined` on purpose: the
 * old shape let a render site skip the "what if there's no author" branch
 * entirely and fall straight through to whatever the last `else` happened to
 * be (`isEva`/`isAdam` both false silently reading as "must be Adam" in a
 * naive `? eva : adam` — the exact invented-author bug the founder's
 * 2026-08-07 decision explicitly forbids). Narrowing on `.signed` is the only
 * way past this type without reaching into a field the other arm doesn't
 * have, so a caller that renders a byline is forced to decide what an
 * unsigned photo looks like rather than being able to ignore the case.
 */
export type Authorship =
  | { readonly signed: true; readonly slug: MemberSlug }
  | { readonly signed: false };

/**
 * Resolve a photo's authorship, or a loud failure — never an invented one.
 *
 * Two DIFFERENT kinds of "no slug" reach this function, and they are NOT the
 * same case:
 *
 *   - `authorMemberId === null` — the photo is DELIBERATELY unsigned
 *     (founder decision, 2026-08-07: a photograph nobody could be
 *     confidently attributed to, or one a third party took of them
 *     together, is held unsigned rather than guessed at — see migration 12).
 *     This is not an error. It returns `{ signed: false }`.
 *
 *   - `authorMemberId` is set but `authorSlug` is still `undefined` — a
 *     producer (the fixture builder or a live composition function) FAILED
 *     to resolve an id that should have resolved. `authorSlug` used to be
 *     derived here by comparing `authorMemberId` against the two fixture ids
 *     (`EVA.id`/`ADAM.id`) — which worked only because every photo in the
 *     app WAS a fixture; the live database uses its own ids
 *     (`supabase/seed.sql`), so that comparison silently attributed every
 *     real photograph to Adam. Every producer of a signed `Photo` now sets
 *     `authorSlug` directly from whichever roster it already has in hand,
 *     and this function still throws on a miss: a caption silently rendered
 *     in the wrong hand is exactly the kind of "looks right, isn't" bug this
 *     product has no tolerance for, and it must stay that way even now that
 *     `null` is a legal, unsigned state.
 */
export function authorshipOf(photo: Authored): Authorship {
  if (photo.authorMemberId === null) {
    return { signed: false };
  }
  if (photo.authorSlug === undefined) {
    throw new Error(
      `compose: photo ${photo.authorMemberId} has an author but no authorSlug ` +
        "resolved — every SIGNED Photo reaching this module must have one set " +
        "by its producer (a fixture builder or a live composition function), " +
        "never derived here. If this photo is meant to be unsigned, its " +
        "authorMemberId must be null, not merely unresolved.",
    );
  }
  return { signed: true, slug: photo.authorSlug };
}

export const isEva = (photo: Authored): boolean => {
  const a = authorshipOf(photo);
  return a.signed && a.slug === "eva";
};
export const isAdam = (photo: Authored): boolean => {
  const a = authorshipOf(photo);
  return a.signed && a.slug === "adam";
};

/**
 * The slug itself (the stamp, alt text), for a caller that already knows —
 * or does not care — that this photo is signed. Throws for an unsigned
 * photo exactly as it throws for an unresolved one: a caller reaching for a
 * name that is not there is a bug at the call site, whether that name was
 * never set on purpose or failed to resolve. Render sites that might see an
 * unsigned photo must check `authorshipOf(photo).signed` FIRST and use
 * `unsignedHandClass`/`unsignedChinHandClass` instead of calling this.
 */
export function authorSlugOf(photo: Authored): MemberSlug {
  const a = authorshipOf(photo);
  if (!a.signed) {
    throw new Error(
      `compose: authorSlugOf called on an unsigned photo (id ${String(photo.authorMemberId)}) ` +
        "— check authorshipOf(photo).signed before asking for a slug; an " +
        "unsigned photo has none to give, on purpose.",
    );
  }
  return a.slug;
}

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
 *
 * Throws for an unsigned photo — routed through `authorSlugOf`, same
 * reasoning as there. A caller that might render an unsigned photo must
 * check `authorshipOf(photo).signed` first and use `unsignedHandClass`
 * instead; this function existing without that guard would be the
 * "isEva false therefore render as Adam" bug the 2026-08-07 decision
 * forbids, just one layer further down.
 */
export function handClass(photo: Authored, size: "caption" | "large" = "caption"): string {
  const slug = authorSlugOf(photo);
  if (size === "large") {
    return slug === "eva" ? "font-eva text-[33px]" : "font-adam text-[26px]";
  }
  return slug === "eva" ? "font-eva text-[23px]" : "font-adam text-[18px]";
}

/** The chin of a polaroid is narrow — a step smaller again. Throws for an
    unsigned photo — see `handClass`. */
export function chinHandClass(photo: Authored): string {
  return authorSlugOf(photo) === "eva" ? "font-eva text-[19px]" : "font-adam text-[15px]";
}

/**
 * The app's own voice, for a caption whose author is deliberately
 * unresolved (founder decision, 2026-08-07: an unsigned photo belongs to
 * the day, not to a sender). Design law §2's register table is explicit:
 * "if the content's author is ambiguous, it appears in the app's own voice
 * (Fraunces), not in either hand" — `--font-display` is Fraunces. Sized
 * between the two hands, since there is no hand to size against.
 */
export function unsignedHandClass(size: "caption" | "large" = "caption"): string {
  return size === "large"
    ? "font-display italic text-[28px]"
    : "font-display italic text-[19px]";
}

/** The chin counterpart to `unsignedHandClass` — see `chinHandClass`. */
export function unsignedChinHandClass(): string {
  return "font-display italic text-[17px]";
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
