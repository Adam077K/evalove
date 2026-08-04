/**
 * The gap stamp — DESIGN-DIRECTION §7.
 *
 * Server component. Receives the instant and the author; never reads
 * `new Date()` in an effect. The app-open is the product's only arrival
 * path (§1.1 of the dispatch), so a stamp that hydrates is a skeleton
 * sitting next to the thing she opened for. This must not become a
 * client component.
 *
 * Renders two lines, nothing more:
 *   Line 1 — condition  "left while Eva was asleep"
 *   Line 2 — clocks     "Adam 6:20 am · Eva 11:20 pm"
 *
 * `type-micro` at `normal-case`: the size and tracking are wanted;
 * uppercasing their names is the wrong register (see globals.css §5).
 * `text-mute`: this is metadata on the item, not the item itself.
 * No icon, no chip, no card, no background.
 */

import type { IsoDateTime, MemberSlug } from "@/lib/types";
import { stampFor } from "@/lib/stamp";

interface StampProps {
  /** The UTC instant at which the item was left. Stored `createdAt`. */
  leftAt: IsoDateTime;
  /** Who left it. */
  authorSlug: MemberSlug;
}

export default function Stamp({ leftAt, authorSlug }: StampProps) {
  const stamp = stampFor(leftAt, authorSlug);

  return (
    <p className="type-micro normal-case text-mute leading-snug">
      {stamp.condition}
      <br />
      {stamp.author} · {stamp.other}
    </p>
  );
}
