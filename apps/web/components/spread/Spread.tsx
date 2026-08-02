import type { Member, Photo, SharedDay } from "@/lib/types";
import { runningHeadDate } from "@/lib/time";
import { ADAM, EVA, memberById } from "@/lib/fixtures/members";
import { photoSrc } from "@/lib/fixtures/resolve";
import { postedAtLocal } from "@/lib/fixtures/photos";
import { LiveLocalTime } from "./LiveLocalTime";

/**
 * The daily spread — the most-repeated page in the book.
 *
 * Verso (left) is always Eva's leaf. Recto (right) is always Adam's.
 * Fixed, whoever posted first. No avatars, no name badges: the ink
 * says who. Beneath each caption, the hour in that person's own city
 * — the gutter between the two photographs is the time difference,
 * and nothing in this file ever says so out loud.
 *
 * On a portrait phone the spread is two consecutive leaves, Eva's
 * first, each carrying the running head so a leaf is never orphaned
 * from its day.
 */

type SpreadProps = {
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /**
   * True only while this shared day is still open. A prepared leaf
   * (corners alone on the paper) may exist ONLY in a live spread —
   * nothing in the finished book is ever waiting for anyone.
   */
  live?: boolean;
  /** Plays the drop-into-corners entrance on that side, on pair completion. */
  dropIn?: "eva" | "adam";
};

export function Spread({ day, evaPhoto, adamPhoto, live = false, dropIn }: SpreadProps) {
  /* Neither posted: the book skips the date in silence. No marker. */
  if (!evaPhoto && !adamPhoto) return null;

  const head = runningHeadDate(day.date);

  /* One posted and the day has closed: the photograph is kept, the
     corners go. Corners-empty is a live state only — nothing in the
     finished book is ever waiting for anyone. */
  const only = evaPhoto && adamPhoto ? undefined : (evaPhoto ?? adamPhoto);
  if (only && !live) return <SinglePlate photo={only} head={head} />;

  return (
    <section
      aria-label={head}
      className="relative grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-0 md:paper-page"
    >
      {/* Eva before Adam — including in the DOM. */}
      <Leaf side="verso" member={EVA} photo={evaPhoto} head={head} live={live} drop={dropIn === "eva"} />
      <Leaf side="recto" member={ADAM} photo={adamPhoto} head={head} live={live} drop={dropIn === "adam"} />

      {/* The running head, at the foot of the gutter. One per spread. */}
      <footer
        aria-hidden="true"
        className="type-eyebrow pointer-events-none absolute inset-x-0 bottom-5 hidden text-center text-ink-soft md:block"
      >
        {head}
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * One leaf of the spread
 * ------------------------------------------------------------------ */

function Leaf({
  side,
  member,
  photo,
  head,
  live,
  drop,
}: {
  side: "verso" | "recto";
  member: Member;
  photo?: Photo;
  head: string;
  live: boolean;
  drop: boolean;
}) {
  const ink = member.slug === "eva" ? "text-ink-eva" : "text-ink-adam";

  return (
    <article className="relative rounded-[var(--radius-page)] bg-paper px-6 pt-6 pb-12 shadow-[var(--shadow-page)] sm:px-8 sm:pt-8 md:rounded-none md:bg-transparent md:pb-16 md:shadow-none">
      {/* The gutter — the book's valley. It never moves. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 hidden w-10 md:block ${
          side === "verso" ? "gutter-right right-0" : "gutter-left left-0"
        }`}
      />

      {photo ? (
        <Plate photo={photo} ink={ink} drop={drop} />
      ) : live ? (
        <PreparedLeaf member={member} ink={ink} />
      ) : null}

      {/* On a phone each leaf carries the running head itself. */}
      <footer
        aria-hidden="true"
        className="type-eyebrow pointer-events-none absolute inset-x-0 bottom-4 text-center text-ink-soft md:hidden"
      >
        {head}
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * A mounted photograph: the plate, its corners, its caption, and the
 * hour in its author's own city.
 * ------------------------------------------------------------------ */

function Plate({
  photo,
  ink,
  drop,
  mounted = true,
}: {
  photo: Photo;
  ink: string;
  drop: boolean;
  /** False on a single plate: the photograph is bound in, not mounted. */
  mounted?: boolean;
}) {
  const author = memberById(photo.authorMemberId);

  return (
    <figure>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixture
            sources are remote seeds; the wired app swaps resolve.ts only. */}
        <img
          src={photoSrc(photo)}
          alt={photo.caption ?? `A photograph from ${author.displayName}'s day`}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          className={`photo-mounted block h-auto w-full ${
            drop ? "[animation:photo-drop_var(--dur-drop)_var(--ease-page)_both]" : ""
          }`}
        />
        {mounted ? <Corners /> : null}
      </div>
      <figcaption className="mt-3 min-h-[2.4rem]">
        {photo.caption ? (
          <p className={`type-caption italic ${ink}`}>{photo.caption}</p>
        ) : null}
        <p className="type-caption text-ink-soft">{postedAtLocal(photo)}</p>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * The single plate — a day that closed half-finished.
 *
 * The photograph is kept and re-laid as one plate centred on one
 * leaf, generous margins, caption and hour beneath, corners removed.
 * A single plate is a legitimate complete book page, not half of a
 * broken spread.
 * ------------------------------------------------------------------ */

function SinglePlate({ photo, head }: { photo: Photo; head: string }) {
  const author = memberById(photo.authorMemberId);
  const ink = author.slug === "eva" ? "text-ink-eva" : "text-ink-adam";

  return (
    <section aria-label={head} className="mx-auto max-w-[26rem]">
      <article className="paper-page relative px-8 pt-8 pb-14 sm:px-10 sm:pt-10 sm:pb-16">
        <Plate photo={photo} ink={ink} drop={false} mounted={false} />
        <footer
          aria-hidden="true"
          className="type-eyebrow pointer-events-none absolute inset-x-0 bottom-4 text-center text-ink-soft sm:bottom-5"
        >
          {head}
        </footer>
      </article>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The prepared leaf — one has posted, the other hasn't yet.
 *
 * Photo corners, alone, on the paper; the name beneath in that
 * person's ink; the hour in their city, live. Nothing else. No
 * outline, no grey box, no spinner, no elapsed anything — a clock,
 * never a counter. Four crisp corners with nothing in them are
 * unambiguously a place prepared for something.
 * ------------------------------------------------------------------ */

function PreparedLeaf({ member, ink }: { member: Member; ink: string }) {
  return (
    <div>
      <div className="relative aspect-[3/4]" role="img" aria-label={`A place prepared for ${member.displayName}'s photograph`}>
        <Corners />
      </div>
      <div className="mt-3 min-h-[2.4rem]">
        <p className={`type-caption ${ink}`}>{member.displayName}</p>
        <p className="type-caption text-ink-soft">
          <LiveLocalTime tz={member.homeTimezone} />
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Photo corners — four mounted pockets. Drawn crisp, at full opacity,
 * always: a faded corner reads as spent, a crisp one reads as ready.
 * They overlap the photograph exactly the way real pockets do, which
 * is what lets a photograph "drop into" them.
 * ------------------------------------------------------------------ */

const CORNER = {
  tl: { cls: "top-0 left-0", deg: 0 },
  tr: { cls: "top-0 right-0", deg: 90 },
  br: { cls: "bottom-0 right-0", deg: 180 },
  bl: { cls: "bottom-0 left-0", deg: 270 },
} as const;

function Corners() {
  return (
    <>
      {(Object.keys(CORNER) as Array<keyof typeof CORNER>).map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 22 22"
          className={`absolute ${CORNER[pos].cls} h-[22px] w-[22px]`}
        >
          <g transform={`rotate(${CORNER[pos].deg} 11 11)`}>
            <path d="M0 0 H22 L0 22 Z" fill="var(--paper-edge)" />
            <path d="M22 0 L0 22" stroke="var(--ink-soft)" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      ))}
    </>
  );
}
