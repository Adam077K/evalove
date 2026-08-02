import type { ReactNode } from "react";
import { AuroraBackdrop } from "@/components/chrome/AuroraBackdrop";
import { Dock } from "@/components/chrome/Dock";

/**
 * The shell every surface lives in: the aurora sky behind, the dock
 * in front, and a phone-first column between them. On a desktop the
 * column widens but never becomes a dashboard — this is a two-person
 * app and it keeps a hand-held scale on purpose.
 *
 * The bottom padding reserves the dock's footprint plus 4rem of air,
 * so the last card ends clear of the glass rather than against it.
 * `--dock-footprint` is declared once on `<html>` in `app/layout.tsx`;
 * nothing in this tree restates the pill's height as a number.
 *
 * Note what this padding does and does not do. It is *document*
 * geometry: it lengthens the column, which guarantees clearance at
 * the end of the scroll and nowhere else. The guarantee at every
 * other scroll offset comes from `scroll-padding-bottom` on the
 * scroll container — see the note in `app/layout.tsx`. Both are
 * needed: the padding gives the last card somewhere to be, the
 * scroll padding stops the browser parking anything under the dock
 * on its way there.
 *
 * Vertical measures in this app use dvh, never vh: on iOS Safari vh
 * is the *expanded* viewport, so a vh-based column is taller than the
 * screen by the height of the toolbar and pushes its own last row out
 * of reach.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuroraBackdrop />
      <main className="relative mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(var(--dock-footprint)+4rem)] sm:max-w-lg md:max-w-2xl md:px-8">
        {children}
      </main>
      <Dock />
    </>
  );
}
