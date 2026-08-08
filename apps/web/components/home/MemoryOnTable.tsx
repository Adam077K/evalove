/* eslint-disable @next/next/no-img-element -- content photographs are
   composited into material mounts; the optimizer must never re-encode them
   and `.photo` law forbids any filter touching the <img>. */

/**
 * The resurfaced memory — one photograph from the archive that came back
 * today, placed on the paper table beneath the main photograph.
 *
 * "Paper is what they made." The memory photograph is something one of them
 * left — it belongs on the table, in the PAPER world, beside the thing that
 * is here today. This gives the founder what he asked for: the main image,
 * and below it the photograph that came back.
 *
 * The label above it ("Left at this hour, in July") is the app's own voice
 * in Fraunces italic: a FACT about when this was left, not a prompt. Absolute
 * always — never "a month ago", always the month and the reason. The design
 * law is explicit: the app may speak facts; it may never solicit anything.
 *
 * Hard rules enforced here:
 *   - Photographs are never dimmed, tinted or washed. `.photo` stays
 *     `filter: none`, same law as the hero above it on the table.
 *   - The label is a fact in the app's own voice — Fraunces italic.
 *   - Nothing solicits composing. No plus. No "add yours".
 *   - The photo's own caption is shown in their hand, not the app's.
 *     An unsigned photo shows no caption attribution — same guard as HeroItem.
 *
 * Mount: white photo backing (bg-surface, same stock PairSpread's follower
 * uses) with a top-right corner of washi tape fastening it. Positioned LEFT
 * of centre to contrast the hero's right-bleed composition — the memory
 * did not bleed off the same edge; it arrived from the other side.
 *
 * Rotation: seeded from photo.id with note context (±5°). The seed is the
 * stable database ID — never an array index or a position (design law §4).
 */

import type { Return } from "@/lib/resurface";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Mounted, Taped } from "@/components/materials";
import { authorshipOf } from "@/components/book/compose";

interface MemoryOnTableProps {
  returned: Return;
}

/** djb2 → float in [0, 1). Local copy — keeps PRNG internals out of the public API. */
function seededFloat(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) hash = (hash * 33) ^ id.charCodeAt(i);
  return ((hash >>> 0) % 1000) / 1000;
}

function seededAngle(id: string, min: number, max: number): number {
  return min + seededFloat(id) * (max - min);
}

export function MemoryOnTable({ returned }: MemoryOnTableProps) {
  const { label, photo } = returned;
  const authorship = authorshipOf(photo);
  const caption = photo.caption;

  return (
    <div className="mt-14">
      {/* The label — the app's own voice, Fraunces italic.
          One fact: why this came back, never what to do with it.
          "Left at this hour, in July" = the time of its origin.
          `normal-case` because the design law explicitly bans
          uppercase for anything that isn't a data label —
          and this is a sentence, not a label. */}
      <p
        className="font-display italic text-[13px] leading-snug normal-case text-mute ml-5"
        style={{ fontVariationSettings: '"opsz" 24, "SOFT" 0, "WONK" 0', fontWeight: 400 }}
      >
        {label}.
      </p>

      {/* The photograph — left-biased (ml-4) to contrast the hero's
          right-bleed. 62% width so it reads as "placed after": smaller,
          tucked in, held to the paper by one corner of tape. White backing
          (bg-surface, identical paper stock to PairSpread's follower) with
          a Polaroid-style bottom border (pb-5) to invite a caption below. */}
      <Mounted
        id={photo.id}
        context="note"
        elevation={3}
        className="mt-3 ml-4 w-[62%]"
      >
        <Taped
          variant="washi-ochre-dots"
          placement="top-right"
          angle={seededAngle(photo.id + ":m-tape", -5, 5)}
        >
          <div className="bg-surface p-1.5 pb-5">
            <img
              src={photoSrc(photo)}
              alt={
                caption ??
                (authorship.signed
                  ? `A photograph from ${label}`
                  : "A photograph from that day")
              }
              width={photo.width}
              height={photo.height}
              className="photo block h-auto w-full max-h-[38dvh] object-cover"
              loading="lazy"
            />
          </div>
        </Taped>
      </Mounted>

      {/* Caption — in their hand, below the white border, at a slightly
          different offset than the photo so it reads as placed, not printed.
          An unsigned photo (authorMemberId null) has no hand — it renders
          in the app's own voice only if there is a caption to show.
          The same guard as HeroItem uses (`authorshipOf` first). */}
      {caption !== undefined && (
        <p
          className={`mt-4 ml-5 max-w-[12rem] leading-snug text-ink ${
            authorship.signed
              ? authorship.slug === "eva"
                ? "font-eva text-[19px]"
                : "font-adam text-[15px]"
              : "font-display italic text-[15px]"
          }`}
          style={
            authorship.signed
              ? undefined
              : { fontVariationSettings: '"opsz" 24, "SOFT" 0, "WONK" 0', fontWeight: 400 }
          }
        >
          {caption}
        </p>
      )}
    </div>
  );
}
