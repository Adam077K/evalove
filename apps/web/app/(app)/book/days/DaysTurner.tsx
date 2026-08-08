"use client";

import { Spread } from "@/components/spread/Spread";
import { BookSheet } from "@/components/book/BookSheet";
import { BookTurnControls, BookTurnStage } from "@/components/book/BookTurnStage";
import { useBookTurn } from "@/components/book/useBookTurn";
import type { BookLeaf } from "@/components/book/leaves";

/**
 * The client half of /book/days — `useBookTurn` is a hook, so
 * whatever calls it must be a client component; the page itself
 * stays a server component and just hands its fixture-derived
 * `pages` down. Same BookTurnStage/BookTurnControls pair
 * BookObject.tsx composes, so the two call sites the founder's
 * feedback covers (`/book` and `/book/days`) share one mechanism —
 * see turn.ts.
 */
export function DaysTurner({ pages }: { pages: BookLeaf[] }) {
  const turn = useBookTurn(pages.length);

  return (
    <div>
      <BookTurnStage
        ariaLabel="The kept days"
        turn={turn}
        leaves={pages.map((leaf) => (
          // h-full: unlike the old side-by-side rail, every leaf here
          // shares one stacked rect (BookTurnStage.tsx) — a leaf that
          // didn't stretch to the tallest would leave the leaf behind
          // it visible in the gap below its own content.
          <BookSheet key={leaf.key} className="h-full">
            <Spread
              day={leaf.day}
              evaPhoto={leaf.evaPhoto}
              adamPhoto={leaf.adamPhoto}
              unsignedPhoto={leaf.unsignedPhoto}
            />
          </BookSheet>
        ))}
      />
      <BookTurnControls
        turn={turn}
        footer={<p className="type-caption text-mute">newest first</p>}
      />
    </div>
  );
}
