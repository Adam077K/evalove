/* eslint-disable @next/next/no-img-element -- content photographs are
   fixture-resolved URLs composited into material mounts; the optimizer
   must never re-encode them and `.photo` law forbids any filter. */

/**
 * The today object — the opening thing on the table.
 *
 * Three states, one server component, none of them an edge case
 * (HANDOFF-BUILD-PHASE §3):
 *
 * The pair:    two photographs from the same shared day, one each.
 *              Unequal on purpose (§4: never two equals) — the newest
 *              is larger, bleeds off ONE edge, and sits physically on
 *              top; the other tucks under its edge, corner-taped,
 *              at its own rotation. The most differentiated object
 *              in the product.
 *
 * One item:    the hero photograph bleeding off one edge only, at its
 *              own aspect, torn-mounted, seeded rotation −5°…+5°,
 *              capped max-h-[70dvh] (dvh, never vh). Caption beneath
 *              in their hand — different measure, offset, never
 *              centred under the photo.
 *
 * The Tuesday: 15:00 her time, nothing arrived. The screen shows the
 *              LAST thing left, unchanged, still there. Nothing is
 *              ever consumed: no read state, no clearing, no "nothing
 *              new today". A lamp on since yesterday is still on.
 *              Faint impressions of earlier writing pressed through
 *              the paper — someone was here, without adding anything
 *              or asking for anything.
 *
 * Hard rules enforced here:
 *   - Photographs are never dimmed, tinted or washed. `.photo` stays
 *     `filter: none`; no mount, mode or lamp may touch the <img>.
 *   - No slot, no prepared place, no plus-in-a-well. A side that has
 *     not posted simply is not on the table. Nothing is shaped like
 *     an absence.
 *   - Server component, always. No useEffect at or above the pair.
 *   - The object does not animate in — <Mounted settled> renders
 *     pre-settled. An entrance on the thing she opened for is a
 *     delay charged to the product's only arrival.
 *   - Eva before Adam in the DOM, always. Physical stacking (who is
 *     on top) is carried by elevation, not by reordering her out of
 *     first position.
 *   - Rotation seeds from the photo's stable id, never an array
 *     index (<Mounted> enforces; §4 explains the silent re-roll).
 *
 * Exports:
 *   TodayPair         — reads FIXTURE_TODAY. Used on /today.
 *   TodayPairContent  — explicit photos. Used by /review/today-pair.
 *   todaysObject      — the state selection, shared with the page so
 *                       the DECO stamp below the seam describes the
 *                       same item the table shows.
 */

import type { Photo } from "@/lib/types";
import { EVA, ADAM } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Mounted, Taped, Torn } from "@/components/materials";

/* ------------------------------------------------------------------ *
 * State selection — one place, two readers (this file and the page)
 * ------------------------------------------------------------------ */

export interface TodayObject {
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /** The most recent daily from a prior day — the Tuesday fallback. */
  lastLeft?: Photo;
  /** The item the DECO stamp below the seam describes. */
  stampPhoto?: Photo;
}

/**
 * What is on the table today. Today's photographs when they exist;
 * otherwise the last thing left, unchanged, still there.
 */
export function todaysObject(): TodayObject {
  const today = SHARED_DAYS.find((d) => d.date === FIXTURE_TODAY);
  const dailies = Object.values(PHOTOS).filter((p) => p.kind === "daily");

  const todays = dailies.filter((p) => p.sharedDay === FIXTURE_TODAY);
  const evaPhoto = today?.evaPosted
    ? todays.find((p) => p.authorMemberId === EVA.id)
    : undefined;
  const adamPhoto = today?.adamPosted
    ? todays.find((p) => p.authorMemberId === ADAM.id)
    : undefined;

  const lastLeft = dailies
    .filter((p) => p.sharedDay < FIXTURE_TODAY)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const stampPhoto =
    evaPhoto !== undefined && adamPhoto !== undefined
      ? evaPhoto.createdAt > adamPhoto.createdAt
        ? evaPhoto
        : adamPhoto
      : (evaPhoto ?? adamPhoto ?? lastLeft);

  return { evaPhoto, adamPhoto, lastLeft, stampPhoto };
}

/* ------------------------------------------------------------------ *
 * Public components
 * ------------------------------------------------------------------ */

/** The today object as rendered on /today, from fixture state. */
export function TodayPair() {
  const { evaPhoto, adamPhoto, lastLeft } = todaysObject();
  return (
    <TodayPairContent
      evaPhoto={evaPhoto}
      adamPhoto={adamPhoto}
      lastLeft={lastLeft}
    />
  );
}

/**
 * The today object with explicit photos — /review/today-pair renders
 * all three states through this without touching FIXTURE_TODAY.
 */
export function TodayPairContent({
  evaPhoto,
  adamPhoto,
  lastLeft,
}: {
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  lastLeft?: Photo;
}) {
  if (evaPhoto !== undefined && adamPhoto !== undefined) {
    return (
      <div role="region" aria-label="Today">
        <PairSpread evaPhoto={evaPhoto} adamPhoto={adamPhoto} />
      </div>
    );
  }

  const only = evaPhoto ?? adamPhoto;
  if (only !== undefined) {
    return (
      <div role="region" aria-label="Today">
        <HeroItem photo={only} />
      </div>
    );
  }

  /* The Tuesday. The last thing left is still on the table —
     unchanged, not marked as old, not wrapped in an empty-state.
     The faint impressions are the only difference: someone was
     here since, without adding anything or asking for anything. */
  if (lastLeft !== undefined) {
    return (
      <div role="region" aria-label="Today">
        <HeroItem photo={lastLeft} impression={impressionFor(lastLeft)} />
      </div>
    );
  }

  /* Genuinely empty archive: the table is bare paper, and bare paper
     is a clear table, not an empty container (§4, the Tuesday test
     consequence). Nothing renders — no dashed rectangle, no copy. */
  return <div role="region" aria-label="Today" />;
}

/* ------------------------------------------------------------------ *
 * Internals
 * ------------------------------------------------------------------ */

const isEvasId = (memberId: string) => memberId === EVA.id;

/** Their hand, per the register table (§2). Never swapped. */
function handClass(memberId: string): string {
  /* Caveat runs smaller on the eye than Patrick Hand at equal px —
     the sizes compensate so neither hand shouts. */
  return isEvasId(memberId)
    ? "font-eva text-[25px]"
    : "font-adam text-[19px]";
}

/**
 * Earlier writing to press through the paper on a Tuesday: the most
 * recent daily caption that is not the shown item's own. Deterministic
 * — same archive, same impression.
 */
function impressionFor(shown: Photo): Photo | undefined {
  return Object.values(PHOTOS)
    .filter(
      (p) =>
        p.kind === "daily" &&
        p.id !== shown.id &&
        p.caption !== undefined &&
        p.createdAt < shown.createdAt,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** djb2 → [min, max]. Same idea as <Mounted>'s seed, kept local so
    tape angles are deterministic per item without exporting PRNG
    internals from the primitive. */
function seededAngle(id: string, min: number, max: number): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) hash = (hash * 33) ^ id.charCodeAt(i);
  return min + ((hash >>> 0) % 1000) / 1000 * (max - min);
}

/**
 * The hero photograph — one item on the table.
 *
 * Bleeds off the RIGHT edge only. The torn mount's tear runs on the
 * left (the only tear asset keyed so far), so the bleed edge is the
 * clean one and the tear keeps its air — a left bleed would clip the
 * tear off-screen and leave a plain rectangle. When mirrored tear
 * assets arrive the bleed side can seed per item; until then this is
 * asset-gated, like the missing Taped variants.
 *
 * Three edges stay visible — the mount, the rotation and the paper
 * beneath are what say "object, not background" (§4 move #1).
 */
function HeroItem({
  photo,
  impression,
}: {
  photo: Photo;
  impression?: Photo;
}) {
  const caption = photo.caption;

  return (
    <div>
      {/* ml-12 lands the mount's torn left edge at the table edge the
          Book also uses (~34px, design-lead 2026-08-06 §2); -mr-12
          keeps the mount's clean right side bleeding off the viewport.
          The page root carries overflow-x-clip so the bleed never
          becomes a horizontal scroll. */}
      <Mounted
        id={photo.id}
        context="today-hero"
        elevation={4}
        className="ml-12 -mr-12"
      >
        <Torn variant={8}>
          <img
            src={photoSrc(photo)}
            alt={caption ?? "The last photograph left"}
            width={photo.width}
            height={photo.height}
            className="photo block h-auto w-full max-h-[70dvh] object-cover"
            loading="eager"
          />
        </Torn>
      </Mounted>

      {/* The caption — type directly on paper, in their hand, at a
          narrower measure than the photograph and off its axis.
          Never centred under the photo, never in a container. */}
      {caption !== undefined && (
        <p
          className={`${handClass(photo.authorMemberId)} mt-7 ml-10 max-w-[15rem] leading-snug text-ink`}
        >
          {caption}
        </p>
      )}

      {/* Tuesday only: earlier writing pressed through from the sheet
          above. Transparent fill, a highlight below and a shade above
          each stroke — pressure without ink. This is typography, not
          a drawn material: the letterforms are the real hand fonts.
          Decorative and unreadable by design; hidden from readers.

          The highlight rides the lamp: a literal white at night read
          as glowing ghost-writing on the dimmed paper (night capture,
          pass 5). An impression is carved by light, so when the lamp
          goes low it must fade with everything else on the table. */}
      {impression?.caption !== undefined && (
        <p
          aria-hidden="true"
          className={`${handClass(impression.authorMemberId)} mt-14 ml-16 max-w-[13rem] -rotate-2 select-none leading-snug`}
          style={{
            color: "transparent",
            textShadow:
              "0 1px 1px rgb(255 255 255 / calc(0.45 - var(--lamp-dim, 0) * 0.28)), 0 -1px 1px rgba(25,21,18,0.10)",
          }}
        >
          {impression.caption}
        </p>
      )}
    </div>
  );
}

/**
 * The pair — two photographs from the same shared day, one each.
 *
 * Unequal by law (§4 move #2): the newest is the lead — larger,
 * bleeding off the right edge, elevation 4, physically on top. The
 * other tucks under its lower edge at elevation 3, corner-taped, at
 * its own seeded rotation. Two captions, two hands, two measures,
 * two offsets. Nothing here repeats, which is the point.
 *
 * Eva's photograph and caption come first in the DOM whichever of
 * them leads — stacking is elevation's job, not source order's.
 */
function PairSpread({
  evaPhoto,
  adamPhoto,
}: {
  evaPhoto: Photo;
  adamPhoto: Photo;
}) {
  const evaLeads = evaPhoto.createdAt > adamPhoto.createdAt;
  const lead = evaLeads ? evaPhoto : adamPhoto;
  const follower = evaLeads ? adamPhoto : evaPhoto;

  /* Whichever figure renders second carries the tuck-under margin —
     the overlap belongs to the meeting of the two, not to a person.
     96px: the first capture's 48px only grazed the lead's mount band
     and the overlap read as stacking, not contact. */
  const overlap = "-mt-24";

  const leadFigure = (
    <Mounted
      id={lead.id}
      context="today-hero"
      elevation={4}
      className={`ml-12 -mr-12 ${evaLeads ? "" : overlap}`}
    >
      <Torn variant={8}>
        <img
          src={photoSrc(lead)}
          alt={lead.caption ?? "Today's newest photograph"}
          width={lead.width}
          height={lead.height}
          className="photo block h-auto w-full max-h-[56dvh] object-cover"
          loading="eager"
        />
      </Torn>
    </Mounted>
  );

  /* The follower is one elevation lighter, so wherever the two meet
     the lead's mount overlaps it — the newest thing was laid down
     last. A white backing sheet (the same paper stock every note
     uses) mounts it; washi across the top-left corner and the right
     edge fastens it. Both strips land on open paper: a tape on the
     tucked-under corner is invisible under the lead (first capture),
     which is a strip of washi doing nothing. */
  const followerFigure = (
    <Mounted
      id={follower.id}
      context="today-hero"
      elevation={3}
      className={`ml-4 w-[58%] ${evaLeads ? overlap : ""}`}
    >
      <Taped
        variant="washi-ochre-dots"
        placement="top-left"
        angle={seededAngle(follower.id, -5, 5)}
      >
        <Taped
          variant="washi-terracotta"
          placement="right"
          angle={seededAngle(follower.id + ":r", -5, 5)}
        >
          <div className="bg-surface p-1.5">
            <img
              src={photoSrc(follower)}
              alt={follower.caption ?? "Today's other photograph"}
              width={follower.width}
              height={follower.height}
              className="photo block h-auto w-full max-h-[40dvh] object-cover"
              loading="eager"
            />
          </div>
        </Taped>
      </Taped>
    </Mounted>
  );

  /* DOM: Eva's figure first, Eva's caption first. Visual stacking
     (lead on top) comes from elevation; vertical order follows the
     DOM, so when Adam leads his larger figure simply sits second
     with the tuck-under margin on Eva's. */
  return (
    <div>
      {evaLeads ? leadFigure : followerFigure}
      {evaLeads ? followerFigure : leadFigure}

      {evaPhoto.caption !== undefined && (
        <p
          className={`${handClass(evaPhoto.authorMemberId)} mt-8 ml-8 max-w-[14rem] leading-snug text-ink`}
        >
          {evaPhoto.caption}
        </p>
      )}
      {adamPhoto.caption !== undefined && (
        <p
          className={`${handClass(adamPhoto.authorMemberId)} mt-5 ml-32 mr-4 max-w-[12rem] leading-snug text-ink`}
        >
          {adamPhoto.caption}
        </p>
      )}
    </div>
  );
}
