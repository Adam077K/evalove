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
 * name badges on finished plates: the colour says who. Each plate is
 * a double-bezel card — an outer tray tinted with its author's soft
 * colour holding the photograph — with the caption in the author's
 * hue and the hour in their own city beneath. The gap between the
 * two plates is the time difference, and nothing here says so.
 *
 * Three states, unchanged from the day model:
 *   completed pair   both plates, side by side
 *   half pair (live) one plate and one prepared place — dashed ring,
 *                    name, that person's own hour ticking. A clock,
 *                    never a counter.
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
      className="type-label glass mx-auto mb-4 w-fit rounded-full px-4 py-1.5 text-mute"
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
  const tray = isEva ? "bg-eva-soft" : "bg-adam-soft";
  const inkCls = isEva ? "text-eva" : "text-adam";

  return (
    <figure
      className={`rounded-[1.75rem] p-1.5 shadow-e2 ring-1 ring-line ${tray} ${
        drop ? "[animation:photo-drop_var(--dur-3)_var(--ease-out)_both]" : ""
      }`}
    >
      <div className="overflow-hidden rounded-[1.375rem]">
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
          <p
            className={`${inkCls}`}
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "0.9375rem",
              lineHeight: 1.4,
              fontVariationSettings: '"opsz" 20, "SOFT" 70',
            }}
          >
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
 * A dashed ring in that person's colour around a soft field, their
 * name, and the hour in their own city, live. No spinner, no elapsed
 * anything — a clock, never a counter. The breathing dot is the only
 * thing that moves, and it moves like breathing.
 * ------------------------------------------------------------------ */

function PreparedPlace({ member }: { member: Member }) {
  const isEva = member.slug === "eva";
  const tray = isEva ? "bg-eva-soft" : "bg-adam-soft";
  const ring = isEva ? "border-eva/45" : "border-adam/45";
  const inkCls = isEva ? "text-eva" : "text-adam";
  const dot = isEva ? "bg-eva" : "bg-adam";

  return (
    <div className={`rounded-[1.75rem] p-1.5 ring-1 ring-line ${tray}`}>
      <div
        role="img"
        aria-label={`A place prepared for ${member.displayName}'s photograph`}
        className={`flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-[1.375rem] border-2 border-dashed ${ring}`}
      >
        <span className="relative flex h-3 w-3" aria-hidden="true">
          <span
            className={`absolute inset-0 rounded-full ${dot}`}
            style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
          />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${dot}`} />
        </span>
        <p className={`type-label ${inkCls}`}>{member.displayName}</p>
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
