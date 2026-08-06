import type { ReactNode } from "react";
import { Band } from "@/components/chrome/Band";
import { Dock } from "@/components/chrome/Dock";
import { Seam } from "@/components/materials";

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
 * `<Band />`, fixed, and the torn edge below it, in that order,
 * rendered ONCE here rather than per route. Next's App Router does not
 * remount a shared layout between sibling routes — `<Dock />`'s
 * `layoutId="dock-active"` pill already depends on this being true —
 * so the band is the same DOM node across every navigation in this
 * group, never re-mounted, never re-fetching its own clock state.
 * `<Seam rotated />` is the geometric inverse of Today's own (lower)
 * seam: night above, paper below, torn DOWN away from the band rather
 * than up away from a table. It is deliberately in the normal
 * document flow, not fixed with the band — it scrolls with the page,
 * so the paper visibly tears away from the (still fixed) night as you
 * scroll, which is the effect the founder described.
 *
 * `--band-height` is reserved as `pt-[var(--band-height)]` here, the
 * same way `--dock-footprint` was already reserved as a `pb-` further
 * down this tree — both declared once, on `<html>`, in `app/layout.tsx`.
 * Content sits FLUSH against the seam's own bottom edge, zero added
 * gap, on every route, full-bleed or columned: the fibre strip's flush
 * edge is tone-matched to the coldpress stock precisely so that join
 * is invisible, and a gap here would just be a second, uglier seam
 * between this component's flush edge and each route's own background.
 * This is also what makes the top offset identical across all four
 * routes — see the shell tests.
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
        <Seam rotated />
        {children}
      </main>
      <Dock />
    </>
  );
}
