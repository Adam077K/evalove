/* eslint-disable @next/next/no-img-element -- the thumb is a content
   photograph resolved from fixtures; `.photo` law forbids the
   optimizer re-encoding it and any filter ever touching it. */

/**
 * The doorway to The Book — a physical page corner at the bottom edge.
 *
 * The Book is always PAPER (§1: "The Book is an object they made.
 * Always paper, no exceptions"), and at night the two surfaces are one
 * room: moving Today → Book is turning away from the window and
 * looking down at your lap. So the doorway is not a link row — it is
 * the corner of the book itself, a paper sheet intruding from the
 * bottom edge of the screen, mostly out of frame, resurfacing one
 * thing from the archive. Tapping the corner lifts the book.
 *
 * The sheet bleeds off the bottom AND right — a corner is the meeting
 * of two edges, and a sheet clipped at both reads as "there is more
 * of this below" rather than as a card that happens to touch the
 * viewport. It runs under the dock's transparent gutters on purpose;
 * the tappable content sits above `--dock-footprint`.
 *
 * `whatCameBack(now)` is the live wiring and must survive any re-skin.
 * When it returns null (genuinely empty archive) nothing renders — no
 * empty corner, no "the book is empty" copy.
 */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { whatCameBack } from "@/lib/resurface";
import { thumbSrc } from "@/lib/fixtures/resolve";
import { memberById } from "@/lib/fixtures/members";
import { Mounted } from "@/components/materials";

type Returned = NonNullable<ReturnType<typeof whatCameBack>>;

interface TodayDoorwayProps {
  /** The same instant the rest of Today rendered with. Keeps surfaces in sync. */
  now: Date;
}

export function TodayDoorway({ now }: TodayDoorwayProps) {
  const returned = whatCameBack(now);
  if (returned === null) return null;
  return <DoorwayCorner returned={returned} />;
}

function DoorwayCorner({ returned }: { returned: Returned }) {
  const { label, photo } = returned;
  const author = memberById(photo.authorMemberId);
  const hand =
    author.slug === "eva" ? "font-eva text-[21px]" : "font-adam text-[17px]";
  const hasImage = photo.width > 0 && photo.height > 0;

  return (
    <Link
      href="/book"
      aria-label={`${label} — open the book`}
      className="press block"
    >
      {/* The sheet: white stock under the room's light (bg-surface
          dims with the night tokens — the Book's amber reading lamp
          is Wave 2). Seeded note rotation; the pb runs the paper
          on under the dock so the corner is clipped by the screen,
          never finished above it. */}
      <Mounted
        id={photo.id}
        context="note"
        elevation={3}
        className="ml-10 -mr-6"
      >
        {/* pr-12, not px-5: the sheet's right side runs off the screen
            (-mr-6 plus rotation), and a symmetric padding put "The
            book ↗" straight into the cut. The label must sit clear of
            the clipped edge. */}
        {/* pb: the tray's footprint plus 0.5rem — the sheet is seeded
            with up to ±5° of note rotation, and a rotated corner dips
            ~17px below where the flat measure ends. Without the buffer
            the label's corner can graze the tray's rim on some seeds. */}
        <div className="bg-surface pb-[calc(var(--dock-footprint)+0.5rem)] pl-5 pr-12 pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="type-micro text-mute">{label}</p>
            <span className="type-micro flex shrink-0 items-center gap-1 text-mute">
              The book{" "}
              <ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />
            </span>
          </div>

          {(hasImage || photo.caption !== undefined) && (
            <div className="mt-3 flex items-start gap-4">
              {hasImage && (
                <div className="w-[26%] shrink-0 overflow-hidden">
                  <img
                    src={thumbSrc(photo)}
                    alt={photo.caption ?? `A photograph by ${author.displayName}`}
                    className="photo block h-auto w-full"
                    loading="lazy"
                  />
                </div>
              )}
              {photo.caption !== undefined && (
                <p className={`${hand} min-w-0 flex-1 leading-snug text-ink`}>
                  {photo.caption}
                </p>
              )}
            </div>
          )}
        </div>
      </Mounted>
    </Link>
  );
}
