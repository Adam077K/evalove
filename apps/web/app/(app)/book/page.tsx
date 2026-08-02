import type { Metadata } from "next";
import { BookOpen, ChevronLeft } from "lucide-react";
import type { Photo, SharedDay } from "@/lib/types";
import { Spread } from "@/components/spread/Spread";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { ADAM, EVA } from "@/lib/fixtures/members";
import { PHOTOS } from "@/lib/fixtures/photos";
import { completeDays } from "@/lib/shared-day";
import { spellNumber } from "@/lib/words";

export const metadata: Metadata = {
  title: "The book — Eva & Adam",
};

/**
 * The book — the days that happened, kept.
 *
 * Closed days only; today still belongs to Today. The leaves sit in
 * a horizontal snap rail, newest first: swiping is turning pages,
 * which is the founder's own gesture for this surface. (A true bent-
 * paper turn with a cast shadow is the next iteration; the snap rail
 * carries the same spatial model today.)
 *
 * The day-count appears once, in prose, and never breaks: a missed
 * day is silently not counted. No marker, no gap, no rebuke.
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

export default function BookPage() {
  const pages = leaves();
  const kept = completeDays(SHARED_DAYS).length;

  return (
    <div>
      <header className="mb-8">
        <p className="type-micro text-mute">Eva &amp; Adam</p>
        <h1 className="type-hero mt-1.5 text-ink">The book</h1>
        {kept > 0 ? (
          <p className="type-body mt-1 text-mute">
            {capitalise(spellNumber(kept))} days, kept.
          </p>
        ) : null}
      </header>

      {pages.length === 0 ? <EmptyBook /> : <LeafRail pages={pages} />}
    </div>
  );
}

function LeafRail({ pages }: { pages: Leaf[] }) {
  return (
    <div>
      <div
        className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8"
        style={{ scrollbarWidth: "none" }}
        aria-label="The kept days — swipe to turn"
      >
        {pages.map((leaf) => (
          <div key={leaf.day.date} className="w-[88%] shrink-0 snap-center sm:w-full">
            <Spread
              day={leaf.day}
              evaPhoto={leaf.evaPhoto}
              adamPhoto={leaf.adamPhoto}
            />
          </div>
        ))}
      </div>
      <p className="type-caption mt-2 flex items-center justify-center gap-1.5 text-mute">
        <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
        newest first — swipe to turn back
      </p>
    </div>
  );
}

/** The first page is waiting — an invitation, not an absence. */
function EmptyBook() {
  return (
    <section className="card flex flex-col items-center rounded-[1.75rem] px-8 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-us-soft text-us-deep">
        <BookOpen size={24} strokeWidth={1.7} />
      </span>
      <h2 className="type-title mt-5 text-ink">The first page is waiting</h2>
      <p className="type-body measure mt-2 text-mute">
        When Eva and Adam have both posted a photograph on the same day,
        that day is bound in here — and stays forever.
      </p>
    </section>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
