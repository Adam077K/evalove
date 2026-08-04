import type { Member, Photo, SharedDay } from "@/lib/types";
import { runningHeadDate } from "@/lib/time";
import { ADAM, EVA, memberById } from "@/lib/fixtures/members";
import { photoSrc } from "@/lib/fixtures/resolve";
import { postedAtLocal } from "@/lib/fixtures/photos";
import { LiveLocalTime } from "./LiveLocalTime";

/**
 * The daily spread — the most-repeated page in the product.
 *
 * Eva's plate first, always — including in the DOM. No avatars, no
 * name badges on finished plates: two pixels of ink down the left
 * edge say who. Each plate is a double-bezel card — white stock
 * holding the photograph — with the caption in their own voice and
 * the hour in their own city beneath. The gap between the two plates
 * is the time difference, and nothing here says so.
 *
 * Three states, unchanged from the day model:
 *   completed pair   both plates, side by side
 *   half pair (live) one plate and one prepared place — an empty
 *                    plate the same size, name, that person's own
 *                    hour ticking. A clock, never a counter.
 *   single plate     a day that closed half-finished keeps its one
 *                    photograph as a full, legitimate page.
 */

type SpreadProps = {
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
  /**
   * True only while this shared day is still open. A prepared place
   * may exist ONLY in a live spread — nothing in the finished book
   * is ever waiting for anyone.
   */
  live?: boolean;
  /** Plays the drop-into-place entrance on that side, on pair completion. */
  dropIn?: "eva" | "adam";
};

export function Spread({ day, evaPhoto, adamPhoto, live = false, dropIn }: SpreadProps) {
  /* Neither posted: the book skips the date in silence. No marker. */
  if (!evaPhoto && !adamPhoto) return null;

  const head = runningHeadDate(day.date);

  /* One posted and the day has closed: the photograph is kept. */
  const only = evaPhoto && adamPhoto ? undefined : (evaPhoto ?? adamPhoto);
  if (only && !live) return <SinglePlate photo={only} head={head} />;

  return (
    <section aria-label={head} className="relative">
      <DateChip head={head} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Eva before Adam — including in the DOM. */}
        <PlateOrPlace member={EVA} photo={evaPhoto} live={live} drop={dropIn === "eva"} />
        <PlateOrPlace member={ADAM} photo={adamPhoto} live={live} drop={dropIn === "adam"} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The date chip — the spread's running head, floating above it.
 * ------------------------------------------------------------------ */

function DateChip({ head }: { head: string }) {
  return (
    <p
      aria-hidden="true"
      className="type-micro card mx-auto mb-4 w-fit rounded-full px-4 py-1.5 text-mute"
    >
      {head}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * One side of the spread: a plate, or a place prepared.
 * ------------------------------------------------------------------ */

function PlateOrPlace({
  member,
  photo,
  live,
  drop,
}: {
  member: Member;
  photo?: Photo;
  live: boolean;
  drop: boolean;
}) {
  if (photo) return <Plate photo={photo} drop={drop} />;
  if (live) return <PreparedPlace member={member} />;
  return null;
}

/* ------------------------------------------------------------------ *
 * A plate — the double-bezel photograph card.
 * ------------------------------------------------------------------ */

function Plate({
  photo,
  drop,
  wide = false,
}: {
  photo: Photo;
  drop: boolean;
  wide?: boolean;
}) {
  const author = memberById(photo.authorMemberId);
  const isEva = author.slug === "eva";
  /* The tray used to be a wash of that person's colour behind the
     photograph. A tinted mat competes with the thing it is framing,
     and the whole point of this product is that the photograph is
     the only saturated thing on the page. White stock, and the
     author's ink down the left edge instead. */
  const edge = isEva ? "edge-eva" : "edge-adam";

  return (
    <figure
      className={`card ${edge} rounded-[1.25rem] p-1.5 shadow-e2 ${
        drop ? "[animation:photo-drop_var(--dur-3)_var(--ease-out)_both]" : ""
      }`}
    >
      <div className="overflow-hidden rounded-[1rem]">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixture
            sources are remote seeds; the wired app swaps resolve.ts only. */}
        <img
          src={photoSrc(photo)}
          alt={photo.caption ?? `A photograph from ${author.displayName}'s day`}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          className={`photo block h-auto w-full object-cover ${wide ? "" : "aspect-[3/4]"}`}
        />
      </div>
      <figcaption className="min-h-[3.4rem] px-3 pt-2.5 pb-2">
        {photo.caption ? (
          <p className="type-quote text-[0.9375rem] text-ink">
            {photo.caption}
          </p>
        ) : null}
        <p className="type-caption mt-0.5 text-mute">{postedAtLocal(photo)}</p>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * The prepared place — one has posted, the other hasn't yet.
 *
 * An empty plate the same size as a full one, their name, and the
 * hour in their own city, live. No spinner, no elapsed anything — a
 * clock, never a counter. The dot in that person's ink is the only
 * thing that moves, and it moves like breathing.
 *
 * This is Tuesday afternoon: for most of the day one of these two
 * places is empty, so it has to read as a place set at a table, not
 * as a slot waiting to be filled.
 * ------------------------------------------------------------------ */

function PreparedPlace({ member }: { member: Member }) {
  /* No edge and no dot. A prepared place is by definition the one
     thing on the page nobody has made yet, and the ink means "made
     by". The name and the live hour carry the identity here. */
  return (
    <div className="card rounded-[1.25rem] p-1.5">
      <div
        role="img"
        aria-label={`A place prepared for ${member.displayName}'s photograph`}
        className="well flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-[1rem]"
      >
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span
            className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-mute"
            style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
          />
          <span className="relative h-1.5 w-1.5 rounded-full bg-mute" />
        </span>
        <p className="type-micro normal-case text-mute">{member.displayName}</p>
        <p className="type-caption -mt-2 text-mute">
          <LiveLocalTime tz={member.homeTimezone} />
        </p>
      </div>
      <div className="min-h-[3.4rem] px-3 pt-2.5 pb-2" aria-hidden="true" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The single plate — a day that closed half-finished.
 *
 * The photograph is kept and re-laid as one wider plate, centred,
 * caption and hour beneath. A single plate is a legitimate complete
 * page, not half of a broken spread — so it carries no empty twin
 * and no dashed ring, only its own quiet weight.
 * ------------------------------------------------------------------ */

function SinglePlate({ photo, head }: { photo: Photo; head: string }) {
  return (
    <section aria-label={head} className="mx-auto max-w-[26rem]">
      <DateChip head={head} />
      <Plate photo={photo} drop={false} wide />
    </section>
  );
}
