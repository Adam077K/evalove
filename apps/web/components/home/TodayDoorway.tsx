/* eslint-disable @next/next/no-img-element -- the thumb is a content
   photograph resolved via `thumbSrc` (fixture registry, else the real
   `/p/{id}` proxy); `.photo` law forbids the optimizer re-encoding it
   and any filter ever touching it. */

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
 * The same photo appears above on the paper table (MemoryOnTable, 2026-08-08)
 * and here as a navigation thumbnail — the two serve different purposes.
 * MemoryOnTable is the memory itself (content, full size, on the table).
 * This thumbnail is navigation context: "The Book holds this and more."
 * Same subject, different jobs, different scales.
 *
 * `whatCameBack` is the live wiring and must survive any re-skin — the page
 * (`app/(app)/today/page.tsx`) computes it against the real archive and
 * passes the result in, since it needs the whole archive's photographs and
 * that is a database read this component may not make itself (all Supabase
 * access lives in `lib/data/`). When it is null (genuinely empty archive)
 * nothing renders — no empty corner, no "the book is empty" copy.
 */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Return } from "@/lib/resurface";
import { thumbSrc } from "@/lib/fixtures/resolve";
import { Mounted } from "@/components/materials";
import {
  authorshipOf,
  DISPLAY_NAME,
  unsignedHandClass,
} from "@/components/book/compose";

interface TodayDoorwayProps {
  /** From `whatCameBack` against the real archive, computed by the page. */
  returned: Return | null;
}

export function TodayDoorway({ returned }: TodayDoorwayProps) {
  if (returned === null) return null;
  return <DoorwayCorner returned={returned} />;
}

function DoorwayCorner({ returned }: { returned: Return }) {
  const { label, photo } = returned;
  const authorship = authorshipOf(photo);
  const hand = authorship.signed
    ? authorship.slug === "eva"
      ? "font-eva text-[21px]"
      : "font-adam text-[17px]"
    : unsignedHandClass();
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
                    alt={
                      photo.caption ??
                      (authorship.signed
                        ? `A photograph by ${DISPLAY_NAME[authorship.slug]}`
                        : "A photograph from that day")
                    }
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
