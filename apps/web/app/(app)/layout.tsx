import type { ReactNode } from "react";
import { Band } from "@/components/chrome/Band";
import { Dock } from "@/components/chrome/Dock";

/**
 * The shell every surface lives in, and the single authority for it.
 * Every route used to receive an identical padded column from here,
 * then Today and The Book each cancelled it with a hand-rolled
 * negative-margin escape hatch (to go edge-to-edge) and re-applied
 * their own, slightly different top inset — three numbers
 * (1.5rem/1.75rem/2.25rem) doing the same job three ways, which is
 * exactly the "the layouts always switch and tweak" the founder named.
 * So the shell is edge-to-edge BY DEFAULT now: no column, no
 * max-width, no horizontal padding at this level. `components/chrome/
 * Column.tsx` is the column, and Dates and Send opt into it
 * explicitly; Today and The Book stay full-bleed underneath, which is
 * what they wanted all along.
 *
 * The one thing every route gets unconditionally is the masthead:
 * `<Band />`, fixed, rendered ONCE here rather than per route. Next's
 * App Router does not remount a shared layout between sibling routes —
 * `<Dock />`'s `layoutId="dock-active"` pill already depends on this
 * being true — so the band is the same DOM node across every navigation
 * in this group, never re-mounted, never re-fetching its own clock state.
 *
 * The Band is now paper — same canvas/line tokens as the surfaces below
 * it (founder, 2026-08-08). The Seam that used to sit here belonged to
 * the paper-to-window transition and now lives on Dates, which is the
 * one route where paper meets the distance. Today is one continuous
 * paper world and has no seam of its own.
 *
 * `--band-height` is reserved as `pt-[var(--band-height)]` here, the
 * same way `--dock-footprint` was already reserved as a `pb-` further
 * down this tree — both declared once, on `<html>`, in `app/layout.tsx`.
 *
 * Vertical measures in this app use dvh, never vh: on iOS Safari vh
 * is the *expanded* viewport, so a vh-based column is taller than the
 * screen by the height of the toolbar and pushes its own last row out
 * of reach.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Band />
      <main className="relative pt-[var(--band-height)]">
        {children}
      </main>
      <Dock />
    </>
  );
}
