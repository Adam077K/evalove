/* eslint-disable @next/next/no-img-element -- content photographs are
   fixture-resolved and under the `.photo` law: no filter, and the
   optimizer must never re-encode them. */

import type { Photo, SharedDay } from "@/lib/types";
import { postedAtLocal, runningHeadDate } from "@/lib/time";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Mounted, Taped, Torn } from "@/components/materials";
import type { TapePlacement, TapeVariant } from "@/components/materials";
import { Polaroid } from "@/components/book/Polaroid";
import {
  authorshipOf,
  chinHandClass,
  handClass,
  isEva,
  mountFor,
  seededIn,
  seededPick,
  unsignedChinHandClass,
  unsignedHandClass,
} from "@/components/book/compose";

/**
 * The daily spread — one leaf of the book, free composition.
 *
 * Rebuilt from the card grid to the material idiom (D4: "Book = pages
 * you turn; inside a page, total freedom. No grid, no slots, no
 * his-side/her-side"). What replaced the two side-by-side plates:
 *
 *   - Each photograph is <Mounted> at book rotation (−8°…+8°, seeded
 *     from ITS OWN stable id) in a seeded real mount — polaroid chin,
 *     polaroid square, torn sheet, or white stock border.
 *   - Unequal pairs (§4 move #2): the newer photograph leads — larger,
 *     elevation 4, physically on top; the other tucks under its edge
 *     at elevation 3, corner-taped. One leads, one follows, never two
 *     equals. Which side of the page leads is seeded from the DAY, so
 *     successive leaves alternate irregularly.
 *   - Captions in each author's own hand, directly on the paper,
 *     different measures, different offsets, never centred. The hour
 *     in that person's own city rides quietly beneath in Outfit —
 *     absolute, never elapsed.
 *   - Eva's photograph and caption come first in the DOM whichever of
 *     them leads. Stacking is elevation's job, not source order's.
 *
 * Day-model states, unchanged in meaning:
 *   completed pair    both photographs, composed unequally
 *   single (closed)   the kept photograph as a full, legitimate page
 *   live half-day     SAME as single. The old "prepared place" — an
 *                     empty plate with the absent one's clock — is a
 *                     slot, and slots are banned (§0: no slot, no
 *                     prepared place, no plus-in-a-well). A side that
 *                     has not posted simply is not on the page. The
 *                     `live` prop survives so existing callers
 *                     compile; it no longer changes what renders.
 *   cluster (curated) a curated page holding several photographs at
 *                     once (`BookLeaf.photos`, 2 to
 *                     `MAX_PHOTOS_PER_CURATED_PAGE`) — any mix of
 *                     authorship, since it groups by day, not by the
 *                     daily ritual's one-each pairing. See
 *                     `ClusterComposition`.
 *   neither posted    null — the book skips the date in silence.
 */

type SpreadProps = {
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /** A curated leaf's deliberately unsigned photo — see `BookLeaf.unsignedPhoto`.
      Never set alongside `evaPhoto`/`adamPhoto`; always renders as a single. */
  unsignedPhoto?: Photo;
  /** A curated leaf holding several photographs — see `BookLeaf.photos`.
      Never set alongside `evaPhoto`/`adamPhoto`/`unsignedPhoto`. */
  photos?: Photo[];
  /**
   * Seeds a `photos` cluster's page-level composition choices (which side
   * leads, the tape variant) — the role `day.date` plays for
   * `PairComposition`. Must be unique PER PAGE, not per day: several
   * cluster pages can share a date (`lib/data/archive.ts`), so callers pass
   * the leaf's own `key`, never `day.date` alone, or every cluster page on
   * a busy day would compose identically.
   */
  pageKey?: string;
  /** Accepted for compatibility; a live day renders like a closed one. */
  live?: boolean;
  /** Plays the drop-into-place entrance on that side, on pair completion. */
  dropIn?: "eva" | "adam";
};

export function Spread({
  day,
  evaPhoto,
  adamPhoto,
  unsignedPhoto,
  photos,
  pageKey,
  dropIn,
}: SpreadProps) {
  const cluster = photos !== undefined && photos.length >= 2;

  /* Nothing posted, nothing curated: the book skips the date in silence.
     No marker. */
  if (!evaPhoto && !adamPhoto && !unsignedPhoto && !cluster) return null;

  const head = runningHeadDate(day.date);
  const headIndent = Math.round(seededIn(`${day.date}:h`, 0, 44));

  const only = evaPhoto && adamPhoto ? undefined : (evaPhoto ?? adamPhoto ?? unsignedPhoto);

  return (
    <section aria-label={head} className="relative">
      {/* The running head — typeset, absolute, its offset seeded per
          leaf so no two leaves open on the same axis. */}
      <p className="type-micro mb-5 text-mute" style={{ marginLeft: headIndent }}>
        {head}
      </p>

      {cluster ? (
        <ClusterComposition photos={photos!} pageSeed={pageKey ?? day.date} />
      ) : only ? (
        <SingleFigure photo={only} />
      ) : (
        <PairComposition
          evaPhoto={evaPhoto!}
          adamPhoto={adamPhoto!}
          daySeed={day.date}
          dropIn={dropIn}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * One photograph in its seeded mount. The chin variant carries the
 * caption on its own paper; the others hand it back to the page.
 * ------------------------------------------------------------------ */

function MountedFigure({
  photo,
  elevation,
  className,
  drop,
  tape,
}: {
  photo: Photo;
  elevation: 3 | 4;
  className?: string;
  drop?: boolean;
  /** Washi across a corner — INSIDE the rotation, so the strip rides
      the figure and actually crosses its edge. Wrapping Taped outside
      Mounted left the strip bridging air beside the rotated frame
      (first pair capture). */
  tape?: { variant: TapeVariant; placement: TapePlacement; angle: number };
}) {
  const mount = mountFor(photo.id);
  const alt = photo.caption ?? "A kept photograph";
  const dropClass = drop
    ? "[animation:photo-drop_var(--dur-3)_var(--ease-out)_both]"
    : "";

  const img = (
    <img
      src={photoSrc(photo)}
      alt={alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      className="photo block h-auto max-h-[52dvh] w-full object-cover"
    />
  );

  const mounted =
    mount === "torn" ? (
      <Torn variant={8}>{img}</Torn>
    ) : mount === "stock" ? (
      <div className="bg-surface p-1.5">{img}</div>
    ) : (
      <Polaroid photo={photo} variant={mount === "square" ? "square" : "chin"} alt={alt}>
        {photo.caption !== undefined && (
          <p
            className={`${
              authorshipOf(photo).signed ? chinHandClass(photo) : unsignedChinHandClass()
            } leading-tight text-ink`}
            style={{ transform: `rotate(${seededIn(`${photo.id}:c`, -2, 1.2)}deg)` }}
          >
            {photo.caption}
          </p>
        )}
      </Polaroid>
    );

  return (
    <Mounted
      id={photo.id}
      context="book-photo"
      elevation={elevation}
      className={`${dropClass} ${className ?? ""}`}
      /* Polaroids cast along their keyed cut, not a rectangle. */
      style={mount === "chin" || mount === "square" ? { boxShadow: "none" } : undefined}
    >
      {tape ? (
        <Taped variant={tape.variant} placement={tape.placement} angle={tape.angle}>
          {mounted}
        </Taped>
      ) : (
        mounted
      )}
    </Mounted>
  );
}

/** Does this photo's seeded mount put the caption on a chin? */
function hasChin(photo: Photo): boolean {
  return mountFor(photo.id) === "chin";
}

/* ------------------------------------------------------------------ *
 * A caption in their hand, with their hour beneath. On the page, off
 * the figure's axis, never in a container.
 * ------------------------------------------------------------------ */

function PageCaption({ photo, className }: { photo: Photo; className?: string }) {
  return (
    <div className={className}>
      {photo.caption !== undefined && !hasChin(photo) && (
        <p
          className={`${
            authorshipOf(photo).signed ? handClass(photo) : unsignedHandClass()
          } max-w-[15rem] leading-snug text-ink`}
        >
          {photo.caption}
        </p>
      )}
      <p className="type-caption mt-1 text-mute">{postedAtLocal(photo)}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The pair — unequal by law. The newer leads; the other tucks under.
 * ------------------------------------------------------------------ */

/**
 * The washi assets that exist, by their post-rename names (Wave 1's
 * QA-gate rename, now on main; floral-pressed/floral-blue added Wave
 * 5). Exported so the coverage test in `__tests__/tape-pick-list.test.ts`
 * can assert every entry here resolves to a registered TAPE_ASSETS
 * plate without duplicating this list — a variant added here with no
 * matching plate renders no strip at all, silently.
 *
 * Going from 2 options to 4 changes seededPick's result for
 * essentially every existing day — accepted deliberately here and
 * only here, while the archive is entirely fixtures with no real
 * photograph in it yet. Once real posts exist, changing this list
 * again would silently rewrite what the past looked like; do not
 * touch it casually after that point.
 */
export const SPREAD_TAPE_VARIANTS = [
  "washi-ochre-dots",
  "washi-terracotta",
  "floral-pressed",
  "floral-blue",
] as const satisfies readonly TapeVariant[];

function PairComposition({
  evaPhoto,
  adamPhoto,
  daySeed,
  dropIn,
}: {
  evaPhoto: Photo;
  adamPhoto: Photo;
  daySeed: string;
  dropIn?: "eva" | "adam";
}) {
  const evaLeads = evaPhoto.createdAt > adamPhoto.createdAt;
  const lead = evaLeads ? evaPhoto : adamPhoto;

  /* Page-level choices seed from the DAY: which side the lead sits
     on, how deep the follower tucks. Item-level choices (rotation,
     mount) seed from each photo's own id inside MountedFigure. */
  const leadLeft = seededIn(`${daySeed}:side`, 0, 1) < 0.5;
  const leadWidth = Math.round(seededIn(`${daySeed}:lw`, 66, 76));
  const followWidth = Math.round(seededIn(`${daySeed}:fw`, 46, 55));
  const tuck = Math.round(seededIn(`${daySeed}:tk`, 56, 88));
  const tape = seededPick(`${daySeed}:tape`, SPREAD_TAPE_VARIANTS);

  const row = (photo: Photo, secondInDom: boolean) => {
    const isLead = photo === lead;
    const onLeft = isLead ? leadLeft : !leadLeft;
    const width = isLead ? leadWidth : followWidth;
    const drop = dropIn !== undefined && (dropIn === "eva") === isEva(photo);

    const figure = isLead ? (
      <MountedFigure photo={photo} elevation={4} drop={drop} />
    ) : (
      /* The follower fastens with washi across its OUTER top corner —
         the corner on open paper. The inner corner tucks under the
         lead, and tape under the lead is a strip of washi doing
         nothing (caught in the first pair capture, and by Wave 1
         before that). */
      <MountedFigure
        photo={photo}
        elevation={3}
        drop={drop}
        tape={{
          variant: tape,
          placement: onLeft ? "top-left" : "top-right",
          angle: seededIn(`${photo.id}:t`, -5, 5),
        }}
      />
    );

    return (
      <div
        className={onLeft ? "" : "flex justify-end"}
        /* Whichever figure renders second carries the tuck — the
           overlap belongs to the meeting of the two, not to a person. */
        style={secondInDom ? { marginTop: -tuck } : undefined}
      >
        <div style={{ width: `${width}%` }}>{figure}</div>
      </div>
    );
  };

  /* Eva first in the DOM, always. The second figure carries the tuck. */
  return (
    <div>
      {row(evaPhoto, false)}
      {row(adamPhoto, true)}

      {/* Two captions, two hands, two measures, two offsets. Eva's
          first. Nothing here repeats — that is the point. */}
      <PageCaption
        photo={evaPhoto}
        className={`mt-7 ${leadLeft ? "ml-7 mr-24" : "ml-16 mr-6"}`}
      />
      <PageCaption
        photo={adamPhoto}
        className={`mt-4 ${leadLeft ? "ml-24 mr-5" : "ml-5 mr-24"}`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The cluster — a curated page holding several photographs (2 to
 * `MAX_PHOTOS_PER_CURATED_PAGE`, `lib/data/archive.ts`) rather than
 * the daily ritual's fixed eva/adam pair. Unlike `PairComposition`
 * this has no fixed authorship shape — a cluster groups by DAY, so it
 * can hold two of Eva's, one unsigned and one Adam's, any mix — so
 * every seed here comes from the page itself (`pageSeed`) or a
 * photo's own stable id, never from a side.
 *
 * One leads (largest, elevation 4, no tape — same "the newer
 * photograph leads" rule PairComposition uses). Every other
 * photograph follows at elevation 3, alternating sides against the
 * lead, tucked up to overlap the row above it and corner-taped, same
 * primitives PairComposition already proved — extended from one
 * follower to several rather than reinvented. Never a grid: sizes are
 * unequal and seeded per photo, not per slot index (§4).
 * ------------------------------------------------------------------ */

function ClusterComposition({
  photos,
  pageSeed,
}: {
  photos: Photo[];
  pageSeed: string;
}) {
  // Chronological order, oldest first — the page still reads as the
  // evening actually happened even though several photographs now
  // share it. The newest leads (PairComposition's own rule); everyone
  // else follows in the order they were taken.
  const ordered = [...photos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const lead = ordered.reduce((newest, p) => (p.createdAt > newest.createdAt ? p : newest), ordered[0]!);
  const followers = ordered.filter((p) => p !== lead);

  const leadLeft = seededIn(`${pageSeed}:side`, 0, 1) < 0.5;
  const leadWidth = Math.round(seededIn(`${pageSeed}:lw`, 62, 74));
  const tape = seededPick(`${pageSeed}:tape`, SPREAD_TAPE_VARIANTS);

  return (
    <div>
      <div className={leadLeft ? "" : "flex justify-end"}>
        <div style={{ width: `${leadWidth}%` }}>
          <MountedFigure photo={lead} elevation={4} />
        </div>
      </div>

      {followers.map((photo, i) => {
        // Alternate against the lead's side so nothing stacks straight
        // down the page's centre. Each follower's own id seeds its own
        // width, tuck and tape corner — never the loop index (§4:
        // never seed from a position that can shift on insert).
        const onLeft = i % 2 === 0 ? !leadLeft : leadLeft;
        const width = Math.round(seededIn(`${photo.id}:w`, 40, 54));
        const tuck = Math.round(seededIn(`${photo.id}:tk`, 48, 96));
        return (
          <div key={photo.id} className={onLeft ? "" : "flex justify-end"} style={{ marginTop: -tuck }}>
            <div style={{ width: `${width}%` }}>
              <MountedFigure
                photo={photo}
                elevation={3}
                tape={{
                  variant: tape,
                  placement: onLeft ? "top-left" : "top-right",
                  angle: seededIn(`${photo.id}:t`, -5, 5),
                }}
              />
            </div>
          </div>
        );
      })}

      {/* One caption per photograph, lead first then the followers in
          the order they were laid — varied vertical rhythm (§4 move
          #5), each offset seeded from its own photo so no two land on
          the same margin. */}
      {ordered.map((photo, i) => (
        <PageCaption
          key={photo.id}
          photo={photo}
          className={`${i === 0 ? "mt-7" : "mt-4"} ${
            seededIn(`${photo.id}:cx`, 0, 1) < 0.5 ? "ml-7 mr-24" : "ml-16 mr-6"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The single figure — a day that kept one photograph. A full page
 * with its own quiet weight: no empty twin, no dashed ring.
 * ------------------------------------------------------------------ */

function SingleFigure({ photo }: { photo: Photo }) {
  const leftward = seededIn(`${photo.id}:x`, 0, 1) < 0.5;
  const width = Math.round(seededIn(`${photo.id}:w`, 74, 84));

  return (
    <div>
      <div className={leftward ? "" : "flex justify-end"}>
        <div style={{ width: `${width}%` }}>
          <MountedFigure photo={photo} elevation={4} />
        </div>
      </div>
      <PageCaption
        photo={photo}
        className={`mt-6 ${leftward ? "ml-12 mr-5" : "ml-5 mr-14"}`}
      />
    </div>
  );
}
