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
 *
 * The Paper is h-full so that when a caller stretches the sheet (the
 * opened book's rail passes className="h-full"; its slots stretch to
 * the tallest leaf) the PAGE fills the book: pages of one bound book
 * are the same size, and a short afternoon simply leaves more bare
 * bone below its content. Callers that don't stretch (a sheet in
 * flow) are untouched — h-full of an auto parent is auto.
 */

export interface BookSheetProps {
  children: ReactNode;
  className?: string;
  /**
   * Things that lie ON the page but UNDER everything composed on it:
   * the opened book's gutter shade, the ribbon marking a place. They
   * render between the sheen and the content, so they sit above the
   * stock and below every mounted item and every line of text — a
   * photograph is never covered, a caption is never crossed.
   */
  underlay?: ReactNode;
}

export function BookSheet({ children, className, underlay }: BookSheetProps) {
  return (
    <div className={cn("relative", className)}>
      <Paper
        stock="bone"
        className="h-full rounded-[2px] border border-line shadow-e2"
      >
        {/* The turn's light — hinge shade and grazing highlight,
            painted on the substrate only, below every mounted thing
            (the lamp precedent: light never touches a photograph).
            Inert (opacity 0) unless an ancestor sets
            `--leaf-sheen-opacity` — BookTurnStage.tsx sets it on the
            leaf's own flip wrapper, and it inherits down to here
            without BookSheet needing a prop for it. Both siblings are
            positioned so DOM order keeps content above it. */}
        <div aria-hidden="true" className="leaf-sheen pointer-events-none absolute inset-0" />
        {underlay}
        <div className="relative px-4 pb-8 pt-6">{children}</div>
      </Paper>
    </div>
  );
}
