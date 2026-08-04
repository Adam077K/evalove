/* eslint-disable @next/next/no-img-element -- the ribbon is a keyed
   material composite; the optimizer must never re-encode its alpha. */

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
 * `ribbon` lays the sage bookmark across the top corner — the ribbon
 * that held this place, moved aside when the book opened to it. Only
 * the opening spread (what came back) carries it: one ribbon, one
 * place held.
 *
 * Free composition happens INSIDE this frame (D4: pages you turn;
 * inside a page, total freedom). The sheet clips nothing — children
 * may overhang its edges the way a mounted photograph overhangs a
 * real page — so no overflow-hidden here, ever.
 */

export interface BookSheetProps {
  /** Lay the moved-aside ribbon across the top-right corner. */
  ribbon?: boolean;
  children: ReactNode;
  className?: string;
}

export function BookSheet({ ribbon = false, children, className }: BookSheetProps) {
  return (
    <div className={cn("relative", className)}>
      <Paper
        stock="bone"
        className="rounded-[2px] border border-line shadow-e2"
      >
        <div className="px-4 pb-8 pt-6">{children}</div>
      </Paper>

      {ribbon && (
        <img
          src="/materials/book-ribbon-sage-standin.webp"
          alt=""
          aria-hidden="true"
          width={220}
          height={1500}
          className="pointer-events-none absolute -top-7 right-6 z-10 h-auto w-[24px]"
          style={{
            transform: "rotate(-14deg)",
            filter:
              "drop-shadow(0 2px 4px rgba(41,32,24,0.25)) brightness(calc(1 - var(--lamp-dim, 0) * var(--lamp-brightness-drop, 0.27))) sepia(calc(var(--lamp-dim, 0) * var(--lamp-sepia-saturation, 0.22)))",
          }}
        />
      )}
    </div>
  );
}
