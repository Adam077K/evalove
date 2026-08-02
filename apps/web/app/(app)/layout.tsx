import type { ReactNode } from "react";
import { AuroraBackdrop } from "@/components/chrome/AuroraBackdrop";
import { Dock } from "@/components/chrome/Dock";

/**
 * The shell every surface lives in: the aurora sky behind, the dock
 * in front, and a phone-first column between them. On a desktop the
 * column widens but never becomes a dashboard — this is a two-person
 * app and it keeps a hand-held scale on purpose.
 *
 * The bottom padding is not a guessed number. The dock is fixed, so
 * it takes no room in the flow, and the column has to reserve that
 * room itself or the last card scrolls under the glass. The reserve
 * is the dock's own footprint — 4rem of pill plus the offset it sits
 * at, `max(1rem, env(safe-area-inset-bottom))`, which grows over the
 * iOS home indicator — and then 4rem of air, so the last card stops
 * clear of the dock instead of against it. See DOCK_FOOTPRINT in
 * `components/chrome/Dock.tsx`; change it there and here together.
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
      <main className="relative mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(8rem+max(1rem,env(safe-area-inset-bottom)))] sm:max-w-lg md:max-w-2xl md:px-8">
        {children}
      </main>
      <Dock />
    </>
  );
}
