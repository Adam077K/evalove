"use client";

import { useEffect, useState } from "react";
import { partnerPresence } from "@/lib/shared-day";
import { localTime } from "@/lib/time";
import { CITY, MEMBERS } from "@/lib/fixtures/members";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

/**
 * The masthead — DECO, and the one §0 exception (design law, revised
 * 2026-08-06): nothing above the item may be about the item, except
 * this. It renders once, in `app/(app)/layout.tsx`, above every route,
 * fixed — the founder's own framing is "paper is what they made; the
 * clocks are the distance BETWEEN them, which is DECO," so a clock
 * printed on the paper below would be a claim about what they made
 * that isn't true. It sits outside the paper on purpose, on its own
 * material: solid `--night-sky`, day and night alike (place, not
 * time — the same rule Seam already holds).
 *
 * CONTENTS ARE BYTE-IDENTICAL ON EVERY ROUTE. No per-route branching,
 * no contents map — this file does not read `usePathname`.
 *
 * The logic is `DualClocks.tsx`'s, reused rather than reinvented: the
 * 10s tick, `partnerPresence` (lib/shared-day, untouchable), the
 * breathing presence dot. The *presentation* is new — DualClocks was a
 * tall vertical rail built for a "Home" surface that never shipped;
 * this is one compact row, sized for a 56px band that runs on every
 * screen rather than one.
 *
 * HYDRATION. DualClocks rendered a shimmer-in-a-`.well` before its
 * first client tick — a skeleton, which the one-exception rule above
 * forbids outright for this element (never empty, never loading). So
 * this follows `LiveLocalTime.tsx`'s proven pattern instead: a lazy
 * `useState(() => new Date())` initializer means there is always a
 * real clock reading, even in the server-rendered HTML — it may be a
 * few seconds stale until the client's own tick catches up, and
 * `suppressHydrationWarning` accepts that rather than papering over it
 * with an empty first paint.
 *
 * Text only, no `font-deco` — Poiret One is reserved for DECO titling
 * ≥32px (Today's two full-size city names); at this scale the band
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
      className="fixed inset-x-0 top-0 z-30 bg-night-sky"
      style={{ height: "var(--band-height)", paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 w-full items-center justify-between px-5 md:px-8">
        <ClockReading member={MEMBERS[0]} now={now} tone="text-night-gold" />
        <ClockReading member={MEMBERS[1]} now={now} tone="text-night-mute" />
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
      className="type-micro flex items-baseline gap-1.5 normal-case text-night-ink"
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
          className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-night-mute"
          style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
        />
      )}
      <span className="relative h-1.5 w-1.5 rounded-full bg-night-mute" />
    </span>
  );
}
