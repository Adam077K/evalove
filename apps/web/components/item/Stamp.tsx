/**
 * The gap stamp — DECO (design law §1, revised 2026-08-04).
 *
 * The stamp is the distance speaking, not either of them. It is
 * typeset — Outfit at small scale, never Caveat, never Patrick Hand —
 * because the app wrote it, not a person (law §2, "the stamp rule in
 * full"). It is absolute, never relative: both clocks at the instant
 * of leaving, never an elapsed anything.
 *
 * Server component. Receives the instant and the author; never reads
 * `new Date()` in an effect. The app-open is the product's only
 * arrival path, so a stamp that hydrates is a skeleton sitting next
 * to the thing she opened for. This must not become a client
 * component.
 *
 * Two grounds, because the stamp appears in both rooms:
 *
 *   on="paper"  (default) — an item inside The Book. Two lines,
 *               `text-mute`: metadata on the item, not the item.
 *   on="night"  — the DECO band below Today's seam. One line with
 *               `·` separators on `text-night-mute`, exactly the
 *               form the founder accepted in wave0-night-seam.png.
 *
 * No icon, no chip, no card, no background — on either ground.
 */

import type { IsoDateTime, MemberSlug } from "@/lib/types";
import { stampFor } from "@/lib/stamp";

interface StampProps {
  /** The UTC instant at which the item was left. Stored `createdAt`. */
  leftAt: IsoDateTime;
  /** Who left it. */
  authorSlug: MemberSlug;
  /**
   * Which room the stamp is speaking in. Paper = the two-line form
   * inside The Book; night = the one-line form on the DECO band.
   * @default "paper"
   */
  on?: "paper" | "night";
}

export default function Stamp({ leftAt, authorSlug, on = "paper" }: StampProps) {
  const stamp = stampFor(leftAt, authorSlug);

  if (on === "night") {
    return (
      <p className="type-micro normal-case text-night-mute leading-snug">
        {stamp.condition} · {stamp.author} · {stamp.other}
      </p>
    );
  }

  return (
    <p className="type-micro normal-case text-mute leading-snug">
      {stamp.condition}
      <br />
      {stamp.author} · {stamp.other}
    </p>
  );
}
