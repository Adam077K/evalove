import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The padded page — Dates and Send opt into this explicitly. Today
 * and The Book do not: they are full-bleed rooms (paper stock / night
 * sky running to the screen edge), and both pass their own content
 * the same horizontal figures this component uses (`px-5` /
 * `md:px-8`) directly, so the visible margin lines up either way.
 *
 * This replaces the column that used to live on `app/(app)/layout.tsx`
 * itself, wrapping every route whether it wanted it or not — which is
 * what made Today and The Book carry a matching negative-margin escape
 * hatch each. The shell is edge-to-edge by default now; this is the
 * one place that opts back in.
 *
 * `--dock-footprint` is the one thing this component reserves for
 * itself: the tray is fixed, so a padded page needs the same bottom
 * clearance every full-bleed route needs too. Today doesn't take it —
 * its DECO floor runs under the tray on purpose — and The Book takes
 * its own, slightly smaller figure directly on its `<Paper>`. There is
 * deliberately no top padding here: `app/(app)/layout.tsx` reserves
 * `--band-height` for the fixed masthead already, and content starts
 * flush against the torn edge below it on every route, full-bleed or
 * not — see the shell's own note on why that flushness matters.
 */
export function Column({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md px-5 pb-[calc(var(--dock-footprint)+4rem)] sm:max-w-lg md:max-w-2xl md:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
