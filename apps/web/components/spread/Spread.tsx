/* eslint-disable @next/next/no-img-element -- content photographs are
   fixture-resolved and under the `.photo` law: no filter, and the
   optimizer must never re-encode them. */

import type { Photo, SharedDay } from "@/lib/types";
import { runningHeadDate } from "@/lib/time";
import { postedAtLocal } from "@/lib/fixtures/photos";
import { photoSrc } from "@/lib/fixtures/resolve";
import { Mounted, Taped, Torn } from "@/components/materials";
import { Polaroid } from "@/components/book/Polaroid";
import {
  chinHandClass,
  handClass,
  isEva,
  seededIn,
  seededPick,
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
 *   neither posted    null — the book skips the date in silence.
 */

type SpreadProps = {
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /** Accepted for compatibility; a live day renders like a closed one. */
  live?: boolean;
  /** Plays the drop-into-place entrance on that side, on pair completion. */
  dropIn?: "eva" | "adam";
};

export function Spread({ day, evaPhoto, adamPhoto, dropIn }: SpreadProps) {
  /* Neither posted: the book skips the date in silence. No marker. */
  if (!evaPhoto && !adamPhoto) return null;

  const head = runningHeadDate(day.date);
  const headIndent = Math.round(seededIn(`${day.date}:h`, 0, 44));

  const only = evaPhoto && adamPhoto ? undefined : (evaPhoto ?? adamPhoto);

  return (
    <section aria-label={head} className="relative">
      {/* The running head — typeset, absolute, its offset seeded per
          leaf so no two leaves open on the same axis. */}
      <p className="type-micro mb-5 text-mute" style={{ marginLeft: headIndent }}>
        {head}
      </p>

      {only ? (
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

type MountKind = "chin" | "square" | "torn" | "stock";

function MountedFigure({
  photo,
  elevation,
  className,
  drop,
}: {
  photo: Photo;
  elevation: 3 | 4;
  className?: string;
  drop?: boolean;
}) {
  const mount = seededPick<MountKind>(photo.id, ["chin", "square", "torn", "stock"]);
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

  return (
    <Mounted
      id={photo.id}
      context="book-photo"
      elevation={elevation}
      className={`${dropClass} ${className ?? ""}`}
      /* Polaroids cast along their keyed cut, not a rectangle. */
      style={mount === "chin" || mount === "square" ? { boxShadow: "none" } : undefined}
    >
      {mount === "torn" ? (
        <Torn variant={8}>{img}</Torn>
      ) : mount === "stock" ? (
        <div className="bg-surface p-1.5">{img}</div>
      ) : (
        <Polaroid photo={photo} variant={mount} alt={alt}>
          {photo.caption !== undefined && (
            <p
              className={`${chinHandClass(photo.authorMemberId)} leading-tight text-ink`}
              style={{ transform: `rotate(${seededIn(`${photo.id}:c`, -2, 1.2)}deg)` }}
            >
              {photo.caption}
            </p>
          )}
        </Polaroid>
      )}
    </Mounted>
  );
}

/** Does this photo's seeded mount put the caption on a chin? */
function hasChin(photo: Photo): boolean {
  return seededPick<MountKind>(photo.id, ["chin", "square", "torn", "stock"]) === "chin";
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
          className={`${handClass(photo.authorMemberId)} max-w-[15rem] leading-snug text-ink`}
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
  /* The two washi assets that exist. Main still names them by the
     patterns they are NOT (houndstooth/kraft); Wave 1's QA-gate rename
     (832d685) fixes the union on its branch — when it merges, these
     two identifiers become "washi-ochre-dots" / "washi-terracotta".
     Kept as main's names here so this branch stands alone. */
  const tape = seededPick(`${daySeed}:tape`, ["houndstooth", "kraft"] as const);

  const row = (photo: Photo, secondInDom: boolean) => {
    const isLead = photo === lead;
    const onLeft = isLead ? leadLeft : !leadLeft;
    const width = isLead ? leadWidth : followWidth;
    const drop =
      dropIn !== undefined && (dropIn === "eva") === isEva(photo.authorMemberId);

    const figure = isLead ? (
      <MountedFigure photo={photo} elevation={4} drop={drop} />
    ) : (
      /* The follower fastens with washi across its inner top corner —
         the strip lands on open paper, where tape can actually hold. */
      <Taped
        variant={tape}
        placement={onLeft ? "top-right" : "top-left"}
        angle={seededIn(`${photo.id}:t`, -5, 5)}
      >
        <MountedFigure photo={photo} elevation={3} drop={drop} />
      </Taped>
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
