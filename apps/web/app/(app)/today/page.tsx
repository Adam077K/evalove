import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { TodayPair } from "@/components/home/TodayPair";
import { TodayDoorway } from "@/components/home/TodayDoorway";
import { WINDOW_STRINGS } from "@/lib/fixtures/members";
import { FIXTURE_TODAY } from "@/lib/fixtures/clock";
import { currentWindow } from "@/lib/shared-day";
import { offsetNote } from "@/lib/stamp";

export const metadata: Metadata = {
  title: "Today — Eva & Adam",
};

/**
 * Today — the room the app opens into.
 *
 * Composition (pair → sentence → doorway, nothing else):
 *   The pair leads at y=0 when photographs exist. No header, no masthead, no navigation above it.
 *   Two sections below, separated by hairlines with widening gaps.
 *
 * No card on this surface. No Echo tile (belongs in The Book). No pocket lock
 * (Brief B placed it in The Book; two signposts to the private drawer is one
 * too many on the surface opened most often). No SealedCard, no TonightCard.
 *
 * Rhythm — explicit per-section, not a uniform utility:
 *   The gap expresses distance of relation.
 *   caption → window sentence : 2rem gap + hairline + 1rem padding
 *   window sentence → doorway : 2.5rem gap + hairline + 1.125rem padding
 *
 * Layout opt-out: the (app) layout adds pt-[max(1.5rem,env(safe-area-inset-top))].
 * TodayPairContent cancels it on the grid, gated on hasAny, so photographs
 * reach y=0. When neither has posted the pair sits at the normal layout position.
 */

const stagger = (i: number): CSSProperties =>
  ({ "--i": i }) as CSSProperties;

export default function TodayPage() {
  const now = new Date();
  const windowId = currentWindow(now);
  const windowLine = windowId !== null ? (WINDOW_STRINGS[windowId] ?? null) : null;
  const dst = offsetNote(FIXTURE_TODAY);

  return (
    <div>
      {/* The pair — y=0 when photographs exist, normal layout padding otherwise.
          The bleed-up is conditional: see TodayPairContent, gated on hasAny. */}
      <TodayPair />

      {/* Window sentence — 2rem gap + hairline + 1rem padding. */}
      {windowLine !== null && (
        <div
          className="stagger-child mt-8 border-t border-line pt-4"
          style={stagger(0)}
        >
          <p className="type-title text-ink">{windowLine}</p>
          {dst !== null && (
            <p className="type-micro mt-1 text-mute">{dst}</p>
          )}
        </div>
      )}

      {/* Doorway — 2.5rem gap + hairline + 1.125rem padding. */}
      <div
        className="stagger-child mt-10 border-t border-line pt-[1.125rem]"
        style={stagger(1)}
      >
        <TodayDoorway now={now} />
      </div>
    </div>
  );
}
