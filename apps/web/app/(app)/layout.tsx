import type { ReactNode } from "react";
import { AuroraBackdrop } from "@/components/chrome/AuroraBackdrop";
import { Dock } from "@/components/chrome/Dock";

/**
 * The shell every surface lives in: the aurora sky behind, the dock
 * in front, and a phone-first column between them. On a desktop the
 * column widens but never becomes a dashboard — this is a two-person
 * app and it keeps a hand-held scale on purpose.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuroraBackdrop />
      <main className="relative mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-36 sm:max-w-lg md:max-w-2xl md:px-8">
        {children}
      </main>
      <Dock />
    </>
  );
}
