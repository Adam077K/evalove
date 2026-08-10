import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Paper } from "@/components/materials";
import { TodayPairContent } from "@/components/home/TodayPair";
import { SealedCard } from "@/components/home/SealedCard";
import { SignOut } from "@/components/auth/SignOut";
import { photoDeps } from "@/lib/data";
import { liveTodayObject } from "@/lib/data/today";
import { liveWhatCameBack } from "@/lib/data/archive";
import { MemoryOnTable } from "@/components/home/MemoryOnTable";
import { parseProfile, PROFILE_KEY } from "@/lib/session/profile";
import type { MemberSlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Today — Eva & Adam",
};

/**
 * Which of the two is holding the phone, for `todaySnapshot`'s day
 * boundary. Reads the same `profile` cookie `lib/viewer.ts` reads
 * client-side and `getIdentity()` falls back to server-side —
 * attribution, not authentication (see `lib/session/profile.ts`), so a
 * bare cookie read is the documented way to get at it; there is nothing
 * here for a fourth reader to protect. A day boundary is a display
 * choice, so the cookie is the right source even now that the session
 * carries a proven `mid`: the two agree, because signing in writes this
 * cookie from the same answer the token got. Eva-first when nobody has
 * tapped a name yet, matching `useViewer()`'s own fallback.
 */
async function currentViewerSlug(): Promise<MemberSlug> {
  const jar = await cookies();
  return parseProfile(jar.get(PROFILE_KEY)?.value) ?? "eva";
}

/**
 * Today — one continuous paper world (design law §1, revised
 * 2026-08-08):
 *
 *   PAPER — the table: the photograph(s), the caption in their hand,
 *           the sealed note, and the memory below. What they made.
 *
 * The Seam and the DECO window (the stamp, the window sentence, the two
 * cities) moved to Dates, which is where night belongs: a calendar of
 * things-to-do is a window onto the distance; a table of what happened
 * is not. Today is the room the app opens into — paper runs to the dock.
 *
 * Live wiring that must survive any re-skin: `liveWhatCameBack`
 * (feeds `MemoryOnTable`) and `liveTodayObject` (`lib/data/today.ts`)
 * reads `todaySnapshot`/`listPhotos` against the database.
 *
 * No masthead, no greeting, nothing above the item (§0). The
 * photograph is Today's masthead.
 */
export default async function TodayPage() {
  const viewerSlug = await currentViewerSlug();
  const now = new Date();
  const [today, returned] = await Promise.all([
    liveTodayObject(photoDeps(), { slug: viewerSlug }),
    liveWhatCameBack(photoDeps(), now),
  ]);

  return (
    /* Paper runs to the bottom: min-h fills the screen below the band,
       pb-[calc(var(--dock-footprint)+1rem)] reserves the dock's tray
       with the +1rem that matches scroll-pb in app/layout.tsx, so the
       visible and scroll-focus reservations line up. overflow-x-clip
       contains the photograph mount's ml-12 -mr-12 bleed (TodayPair.tsx
       lines 217 and 307) — same job /book/page.tsx's outer clip does
       for its spine bleed. dvh, never vh — on iOS Safari vh is the
       expanded viewport and pushes the last row out of reach. */
    <Paper
      stock="coldpress"
      className="overflow-x-clip min-h-[calc(100dvh-var(--band-height))] px-5 pb-[calc(var(--dock-footprint)+1rem)] md:px-8"
    >
      <TodayPairContent
        evaPhoto={today.evaPhoto}
        adamPhoto={today.adamPhoto}
        lastLeft={today.lastLeft}
        recentDailies={today.recentDailies}
      />

      {/* The memory — a photograph from the archive placed on the table
          below the main item. The founder asked for "under it, picture
          of us from twenty fourth of July, is memory we bring up."
          `returned` is from `liveWhatCameBack` (above), which uses the
          real archive — the same selection the Book corner has always
          used, now surfaced here where it can be seen.
          The label above it ("Left at this hour, in July") is the text
          the founder asked for: a fact in the app's own voice, never a
          prompt. Renders only when the archive is non-empty. */}
      {returned !== null && <MemoryOnTable returned={returned} />}

      {/* The sealed thing, when one is waiting. An object among
          objects — its own offset, never a full-width row. ml-8
          keeps the washi tape's torn end on the table instead of
          being sliced by the viewport's left edge (design-lead
          2026-08-06 §2). */}
      <div className="ml-8 mr-12 mt-12">
        <SealedCard />
      </div>

      {/* The way out, after the last object on the table. Until now
          there was none: `DELETE /api/session` worked and nothing in
          the app called it, so handing the phone to someone meant
          clearing site data in Safari. It is one line of text at the
          foot of the one screen you always land on, deliberately below
          everything worth reading. See components/auth/SignOut.tsx. */}
      <SignOut />
    </Paper>
  );
}
