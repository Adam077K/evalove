import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Column } from "@/components/chrome/Column";
import { bookLeaves } from "@/components/book/leaves";
import { DaysTurner } from "./DaysTurner";

export const metadata: Metadata = {
  title: "The days in order — Eva & Adam",
};

/**
 * The days in order — chronological view, reachable but not default.
 *
 * Stays a server component; `bookLeaves()` is fixture data with
 * nothing async or client-only about it. The turn itself
 * (`useBookTurn` is a hook) lives in `DaysTurner`, a client
 * component, and is reachable from The Book's default view; the
 * default view is what came back. The leaves themselves live in
 * `components/book/leaves` because the opened book on /book turns
 * the same pages, on the same BookTurnStage mechanism (turn.ts).
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

export default function DaysPage() {
  const pages = bookLeaves();

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
