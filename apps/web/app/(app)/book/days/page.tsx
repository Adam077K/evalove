import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Photo, SharedDay } from "@/lib/types";
import { Spread } from "@/components/spread/Spread";
import { BookSheet } from "@/components/book/BookSheet";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { ADAM, EVA } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";

export const metadata: Metadata = {
  title: "The days in order — Eva & Adam",
};

/**
 * The days in order — chronological view, reachable but not default.
 *
 * The existing Spread snap rail moves here unchanged. It is reachable
 * from The Book's default view; the default view is what came back.
 *
 * The guarantee that makes this view safe is already in the fixture:
 * `SHARED_DAYS` is a list of days that happened, never a date range
 * iterated into a grid. A missed day has no row. Nothing here may
 * iterate a date range.
 */

interface Leaf {
  day: SharedDay;
  evaPhoto?: Photo;
  adamPhoto?: Photo;
}

function leaves(): Leaf[] {
  const daily = Object.values(PHOTOS).filter((p) => p.kind === "daily");
  return SHARED_DAYS.filter(
    (d) => d.date !== FIXTURE_TODAY && (d.evaPosted || d.adamPosted),
  )
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((day) => ({
      day,
      evaPhoto: daily.find(
        (p) => p.sharedDay === day.date && p.authorMemberId === EVA.id,
      ),
      adamPhoto: daily.find(
        (p) => p.sharedDay === day.date && p.authorMemberId === ADAM.id,
      ),
    }));
}

export default function DaysPage() {
  const pages = leaves();

  return (
    <div>
      <header className="mb-8">
        <Link
          href="/book"
          className="type-micro text-mute inline-flex items-center gap-1 mb-4 press"
          aria-label="Back to The book"
        >
          <ChevronLeft size={12} strokeWidth={2.2} aria-hidden="true" />
          The book
        </Link>
        <h1 className="type-title text-ink">The days in order</h1>
      </header>

      {pages.length === 0 ? (
        /* Unreachable in practice — the door here suppresses when the
           archive is empty. Bare paper: no "yet", no waiting copy. */
        <div aria-hidden="true" />
      ) : (
        <div>
          {/* The turn follows the thumb: each leaf's tilt, lift,
              shadow and sheen are a pure function of its scroll
              position (`.leaf-turn`, globals §8b), and scroll is
              the finger while it is down. The shared perspective
              sits on the rail so every leaf turns in one room; the
              vertical padding is headroom for lifted corners
              (overflow-x auto forces overflow-y auto, which would
              clip them). */}
          <div
            className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 pt-3 [perspective:1200px] md:-mx-8 md:px-8"
            style={{ scrollbarWidth: "none" }}
            aria-label="The kept days — swipe to turn"
          >
            {pages.map((leaf) => (
              <div
                key={leaf.day.date}
                className="leaf-turn w-full shrink-0 snap-center"
              >
                {/* Each day is a leaf of the book — bone stock, free
                    composition inside (the evolved Spread). w-full,
                    not 88%: the rail's own px is then exactly the
                    inset snap-center needs, so the open page RESTS
                    FLAT at 0° (measured: an 88% slot could never
                    quite centre and held a permanent -3.7° tilt —
                    paper at rest lies flat, law §5). The next leaf
                    waits just offscreen instead of peeking. */}
                <BookSheet>
                  <Spread
                    day={leaf.day}
                    evaPhoto={leaf.evaPhoto}
                    adamPhoto={leaf.adamPhoto}
                  />
                </BookSheet>
              </div>
            ))}
          </div>
          <p className="type-caption mt-2 flex items-center justify-center gap-1.5 text-mute">
            <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
            newest first — swipe to turn back
          </p>
        </div>
      )}
    </div>
  );
}
