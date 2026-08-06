import type { Metadata } from "next";
import type { Return } from "@/lib/resurface";
import type { Photo, SharedDay } from "@/lib/types";
import { PHOTOS } from "@/lib/fixtures/photos";
import { SHARED_DAYS } from "@/lib/fixtures/book";
import { BookCover } from "@/components/book/BookCover";
import { BookObject } from "@/components/book/BookObject";
import { BookSheet } from "@/components/book/BookSheet";
import type { BookLeaf } from "@/components/book/leaves";
import { ResurfacedItem } from "@/components/book/ResurfacedItem";
import { Spread } from "@/components/spread/Spread";

export const metadata: Metadata = {
  title: "Review: book states — dev",
};

/**
 * Development review surface — not reachable from the dock.
 *
 * Renders every state of The Book so they can be captured without
 * modifying any production route or fixture. `?mode=day|night`
 * previews both rooms; night here must read as the amber-lit reading
 * lamp, never the city sky.
 *
 * States:
 *   1  The closed book — day one (thin), current, and year-three
 *      (thick): the fore-edge is the anti-counter and its growth is
 *      the thing to look at. No number may appear in any of them.
 *   2  The opening — resurfaced photo, date match
 *   3  The opening — resurfaced photo, hour match (different mount)
 *   4  The opening — text only (no photograph anywhere: the Tuesday
 *      test's hardest case, an ordinary afternoon)
 *   5  The opening — day one, bare paper (clear table, no copy)
 *   6  A finished pair spread (unequal, tucked, taped)
 *   7  A single-photograph day (a full page, no empty twin)
 *
 * This is a development tool only. Never link it from product surfaces.
 */

// ── Forced states for review ──────────────────────────────────────────

const DATE_MATCH: Return = {
  reason: "date",
  // Absolute — the photograph's own date, matching lib/resurface.ts's
  // "From {longDate}" label. d0729-eva's sharedDay is "2026-07-29".
  label: "From 29 July 2026",
  photo: PHOTOS["d0729-eva"],
};

const HOUR_MATCH: Return = {
  reason: "hour",
  label: "Left at this hour, in July",
  photo: PHOTOS["d0730-adam"],
};

// Text-only entry: width/height 0 so ResurfacedItem takes the
// written-line path. The caption is what came back; no photograph.
const TEXT_ONLY_PHOTO: Photo = {
  ...PHOTOS["d0729-eva"],
  id: "review-text-only",
  clientUuid: "review-text-only",
  caption: "Sudden rain, everyone under the same awning",
  width: 0,
  height: 0,
  storagePathDisplay: "",
  storagePathThumb: "",
};

const TEXT_MATCH: Return = {
  reason: "hour",
  label: "Left in the evening, in July",
  photo: TEXT_ONLY_PHOTO,
};

const PAIR_DAY: SharedDay = SHARED_DAYS.find((d) => d.date === "2026-07-30")!;
const SINGLE_DAY: SharedDay = SHARED_DAYS.find((d) => d.date === "2026-07-31")!;

/* Leaves for the openable book states — a fixed pair so the turn
   inside the object can be exercised against known compositions. */
const REVIEW_LEAVES: BookLeaf[] = [
  { day: SINGLE_DAY, evaPhoto: PHOTOS["d0731-eva"] },
  { day: PAIR_DAY, evaPhoto: PHOTOS["d0730-eva"], adamPhoto: PHOTOS["d0730-adam"] },
];

function Label({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="type-micro mb-4 text-mute">
      {children}
    </h2>
  );
}

// ─────────────────────────────────────────────────────────────────────

export default function ReviewBookStatesPage() {
  return (
    <div>
      <header className="mb-10 flex items-baseline justify-between gap-4">
        <h1 className="type-hero text-ink">Review — book states</h1>
        <nav aria-label="Mode" className="flex gap-1.5">
          <a
            className="type-micro card press rounded-full px-3.5 py-1.5 text-mute"
            href="?mode=day"
          >
            day
          </a>
          <a
            className="type-micro card press rounded-full px-3.5 py-1.5 text-mute"
            href="?mode=night"
          >
            night
          </a>
        </nav>
      </header>

      <div className="space-y-24">
        <section aria-labelledby="s-cover-day-one" className="overflow-x-clip pb-16">
          <Label id="s-cover-day-one">State 1a — the closed book, day one (thin)</Label>
          <div className="pr-6">
            <BookCover leafCount={0} begun="2026-08-02" />
          </div>
        </section>

        <section aria-labelledby="s-cover-now" className="overflow-x-clip pb-16">
          <Label id="s-cover-now">State 1b — the closed book, current archive</Label>
          <div className="pr-6">
            <BookCover leafCount={6} begun="2026-08-02" />
          </div>
        </section>

        <section aria-labelledby="s-cover-year3" className="overflow-x-clip pb-16">
          <Label id="s-cover-year3">State 1c — the closed book, year three (thick)</Label>
          {/* 1095, not 200: under the new log fore-edge curve (ceiling
              60px) 200 leaves yields only 49px — the harness would
              silently stop testing the widest state. 1095 clears the
              ceiling (proportion spec §4). */}
          <div className="pr-6">
            <BookCover leafCount={1095} begun="2026-08-02" />
          </div>
        </section>

        <section aria-labelledby="s-date">
          <Label id="s-date">State 2 — the opening, date match</Label>
          <BookSheet>
            <ResurfacedItem returned={DATE_MATCH} />
          </BookSheet>
        </section>

        <section aria-labelledby="s-hour">
          <Label id="s-hour">State 3 — the opening, hour match</Label>
          <BookSheet>
            <ResurfacedItem returned={HOUR_MATCH} />
          </BookSheet>
        </section>

        <section aria-labelledby="s-text">
          <Label id="s-text">State 4 — the opening, text only (no photograph anywhere)</Label>
          <BookSheet>
            <ResurfacedItem returned={TEXT_MATCH} />
          </BookSheet>
        </section>

        <section aria-labelledby="s-empty">
          <Label id="s-empty">State 5 — the opening, day one (bare paper)</Label>
          <BookSheet>
            <div className="h-[42dvh]" aria-hidden="true" />
          </BookSheet>
        </section>

        <section aria-labelledby="s-pair">
          <Label id="s-pair">State 6 — a finished pair (unequal, tucked, taped)</Label>
          <BookSheet>
            <Spread
              day={PAIR_DAY}
              evaPhoto={PHOTOS["d0730-eva"]}
              adamPhoto={PHOTOS["d0730-adam"]}
            />
          </BookSheet>
        </section>

        <section aria-labelledby="s-single">
          <Label id="s-single">State 7 — a single-photograph day (a full page)</Label>
          <BookSheet>
            <Spread day={SINGLE_DAY} evaPhoto={PHOTOS["d0731-eva"]} />
          </BookSheet>
        </section>

        {/* The openable object itself — tap the cover. State 8 forces
            the Tuesday test (text-only held page) through the whole
            interaction; state 9 is day one, opening to bare paper. */}
        <section aria-labelledby="s-book-open" className="overflow-x-clip pb-16">
          <Label id="s-book-open">
            State 8 — the book, openable (tap; text-only held page)
          </Label>
          <div className="pr-6">
            <BookObject
              returned={TEXT_MATCH}
              leaves={REVIEW_LEAVES}
              leafCount={6}
              begun="2026-08-02"
            />
          </div>
        </section>

        <section aria-labelledby="s-book-day-one" className="overflow-x-clip pb-16">
          <Label id="s-book-day-one">
            State 9 — the book, day one (opens to bare paper)
          </Label>
          <div className="pr-6">
            <BookObject returned={null} leaves={[]} leafCount={0} begun="2026-08-02" />
          </div>
        </section>
      </div>
    </div>
  );
}
