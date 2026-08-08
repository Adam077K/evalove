"use client";

import { useEffect, useState } from "react";
import { partnerPresence } from "@/lib/shared-day";
import { localTime } from "@/lib/time";
import { CITY, MEMBERS } from "@/lib/fixtures/members";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

/**
 * The masthead — paper now, and the one §0 exception (design law,
 * revised 2026-08-08): nothing above the item may be about the item,
 * except this. It renders once, in `app/(app)/layout.tsx`, above every
 * route, fixed.
 *
 * Material change (founder, 2026-08-08): the Band moved off the
 * `--night-*` scale and onto the paper scale (`--canvas` ground with a
 * `--line` hairline bottom edge). The clocks are still the distance
 * between the two cities — DECO as instrumentation — but the masthead
 * now sits on the same substrate as the paper world below it. The night
 * window belongs to Dates; the Band is the room's header, not the sky.
 *
 * EVA-FIRST. Eva's city reads at full `--ink` (the darker reading);
 * Adam's reads at `--mute` (the receded reading). Weight and darkness
 * carry the distinction — never hue, never `--eva`/`--adam` (those are
 * authorship inks and a city label is not authorship). The product law
 * that Eva's name precedes Adam's is held by `MEMBERS[0] = EVA` in
 * `lib/fixtures/members.ts`; this component inherits it, never
 * re-asserts it.
 *
 * CONTENTS ARE BYTE-IDENTICAL ON EVERY ROUTE. No per-route branching,
 * no contents map — this file does not read `usePathname`.
 *
 * HYDRATION. This follows `LiveLocalTime.tsx`'s proven pattern: a lazy
 * `useState(() => new Date())` initializer means there is always a
 * real clock reading, even in the server-rendered HTML — it may be a
 * few seconds stale until the client's own tick catches up, and
 * `suppressHydrationWarning` accepts that rather than papering over it
 * with an empty first paint.
 *
 * Text only, no `font-deco` — Poiret One is reserved for DECO titling
 * ≥32px (Dates' two full-size city names); at this scale the band
 * reads as instrumentation the app is producing, not authored titling,
 * so it stays in the sans, same register as the gap stamp.
 */
export function Band() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      aria-label="Where Eva and Adam are right now"
      className="fixed inset-x-0 top-0 z-30 border-b border-line bg-canvas"
      style={{ height: "var(--band-height)", paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 w-full items-center justify-between px-5 md:px-8">
        <ClockReading member={MEMBERS[0]} now={now} tone="text-ink" />
        <ClockReading member={MEMBERS[1]} now={now} tone="text-mute" />
      </div>
    </header>
  );
}

function ClockReading({
  member,
  now,
  tone,
}: {
  member: Member;
  now: Date;
  tone: string;
}) {
  const presence = partnerPresence(member.slug, now);
  return (
    <p
      suppressHydrationWarning
      className="type-micro flex items-baseline gap-1.5 normal-case text-ink"
    >
      <PresenceDot presence={presence.presence} />
      <span className={cn("tracking-[0.14em]", tone)}>
        {CITY[member.slug].toUpperCase()}
      </span>
      <span>{localTime(now, member.homeTimezone)}</span>
    </p>
  );
}

/** The exact breathing dot `DualClocks` uses — an inference, never either person's ink. */
function PresenceDot({ presence }: { presence: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
      {presence !== "unknown" && (
        <span
          className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-mute"
          style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
        />
      )}
      <span className="relative h-1.5 w-1.5 rounded-full bg-mute" />
    </span>
  );
}
