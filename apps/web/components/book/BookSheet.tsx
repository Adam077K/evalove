import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Paper } from "@/components/materials";

/**
 * One open page of the book, lying on the table.
 *
 * The book's pages are bone stock; the table is coldpress. The sheet
 * is a real <Paper> — never a colour fill — with a hairline and the
 * resting shadow of a page block under your gaze. It sits at 0°: the
 * many things ON pages scatter (±8°), but the open book itself is
 * squarely in front of you — you turned to face it.
 *
 * There is deliberately NO ribbon here. The product has one ribbon
 * and it belongs to the cover, hanging toward the opening below it —
 * a second ribbon lying on the sheet made the same object appear
 * twice on one screen (verified in the first day capture) and read
 * as two ribbons, so it was removed rather than aligned.
 *
 * Free composition happens INSIDE this frame (D4: pages you turn;
 * inside a page, total freedom). The sheet clips nothing — children
 * may overhang its edges the way a mounted photograph overhangs a
 * real page — so no overflow-hidden here, ever.
 */

export interface BookSheetProps {
  children: ReactNode;
  className?: string;
}

export function BookSheet({ children, className }: BookSheetProps) {
  return (
    <div className={cn("relative", className)}>
      <Paper
        stock="bone"
        className="rounded-[2px] border border-line shadow-e2"
      >
        {/* The turn's light — hinge shade and grazing highlight,
            painted on the substrate only, below every mounted thing
            (the lamp precedent: light never touches a photograph).
            Inert opacity-0 outside the days rail; `.leaf-turn`
            drives it from scroll position. Both siblings are
            positioned so DOM order keeps content above it. */}
        <div aria-hidden="true" className="leaf-sheen pointer-events-none absolute inset-0" />
        <div className="relative px-4 pb-8 pt-6">{children}</div>
      </Paper>
    </div>
  );
}
