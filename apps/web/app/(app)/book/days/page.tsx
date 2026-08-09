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
 * Rendered per request, never prerendered. Deploy-only bug, found by reading
 * `next build`'s route table rather than the source (2026-08-10).
 *
 * This page awaits `liveBookLeaves` — a real database read — and touches no
 * request-scoped API: no `cookies()`, no `headers()`, no `searchParams`. Next
 * therefore classified it `○ (Static)` and PRERENDERED IT AT BUILD TIME,
 * baking whatever the archive held during the deploy into a static artefact
 * on the CDN. It would then serve exactly that, unchanged, until the next
 * deploy: Eva adds a photograph in New York, this page never learns.
 *
 * `next dev` renders every request dynamically, so on the LAN this was
 * invisible. It appears only once deployed, which is why it survived to here.
 *
 * Compare `app/(app)/today/page.tsx`, which is `ƒ (Dynamic)` for free —
 * it reads the `profile` cookie, and that opts it out. Nothing about this
 * page's data is more cacheable than Today's; it just lacked the accident.
 * `supabase-js` issues an ordinary `fetch` that Next is free to cache, so
 * a live read is not on its own enough to make a route dynamic. Say so.
 *
 * `/book` has the same shape and the same line, for the same reason.
 */
export const dynamic = "force-dynamic";

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
