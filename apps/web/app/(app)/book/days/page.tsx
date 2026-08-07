import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Column } from "@/components/chrome/Column";
import { photoDeps } from "@/lib/data";
import { liveBookLeaves } from "@/lib/data/archive";
import { DaysTurner } from "./DaysTurner";

export const metadata: Metadata = {
  title: "The days in order — Eva & Adam",
};

/**
 * The days in order — chronological view, reachable but not default.
 *
 * A server component that awaits `liveBookLeaves` (`lib/data/archive.ts`) —
 * the real equivalent of the fixture `bookLeaves()` that used to read
 * straight from `lib/fixtures/book.ts`. The turn itself (`useBookTurn` is a
 * hook) lives in `DaysTurner`, a client component, and is reachable from
 * The Book's default view; the default view is what came back. The leaves'
 * SHAPE lives in `components/book/leaves` (`BookLeaf`) because the opened
 * book on /book turns the same pages, on the same BookTurnStage mechanism
 * (turn.ts) — only the shape is shared now; the fixture builder is not.
 *
 * Column, not full-bleed like /book. Every `BookSheet` already
 * carries its own bone-stock `<Paper>` (see BookSheet.tsx) — this
 * route isn't a "room" the way /book and Today are (no table stock,
 * no lamp, no spine to bleed off the left edge for); it's a header
 * plus a reader, the same shape as Dates. `Column` also supplies the
 * `--dock-footprint` bottom clearance `BookTurnControls` (the Prev/
 * Next pair, the WCAG 2.5.7 path) needs so the fixed dock can't cover
 * it — reimplementing that figure by hand here would just be Column
 * with extra steps. See `app/(app)/__tests__/route-classification.
 * test.ts` for the exhaustiveness check this choice satisfies.
 */

export default async function DaysPage() {
  const { leaves: pages } = await liveBookLeaves(photoDeps());

  return (
    <Column>
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
        <DaysTurner pages={pages} />
      )}
    </Column>
  );
}
