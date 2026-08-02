"use client";

import { useEffect, useState } from "react";
import { partnerPresence, type PresenceGuess } from "@/lib/shared-day";
import { CITY, MEMBERS } from "@/lib/fixtures/members";
import type { Member } from "@/lib/types";

/**
 * The two clocks — Home's signature. Eva's first.
 *
 * Each card is glass with that person's aura bleeding in from a
 * corner, their local time in large tabular digits, and an honest
 * guess at what they're doing — inferred from the wall clock and
 * their working week, never from the device. The presence dot
 * breathes; it does not blink.
 *
 * Before the first client tick the cards render as shimmering
 * skeletons — the digits never hydrate wrong.
 */

const PRESENCE_COPY: Record<PresenceGuess, string> = {
  asleep: "probably asleep",
  working: "at work",
  awake: "awake now",
  unknown: "no clock to read",
};

export function DualClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <section aria-label="Where Eva and Adam are in their days" className="grid grid-cols-2 gap-3">
      {MEMBERS.map((m) => (
        <ClockCard key={m.slug} member={m} now={now} />
      ))}
    </section>
  );
}

function ClockCard({ member, now }: { member: Member; now: Date | null }) {
  const isEva = member.slug === "eva";
  const auraClass = isEva ? "bg-eva/25" : "bg-adam/25";
  const nameClass = isEva ? "text-eva" : "text-adam";
  const dotClass = isEva ? "bg-eva" : "bg-adam";

  if (now === null) {
    return (
      <div className="glass relative overflow-hidden rounded-[1.5rem] p-4">
        <div className="relative space-y-3">
          <div className="well h-4 w-16 overflow-hidden rounded-full">
            <Shimmer />
          </div>
          <div className="well h-9 w-24 overflow-hidden rounded-xl">
            <Shimmer />
          </div>
          <div className="well h-3.5 w-28 overflow-hidden rounded-full">
            <Shimmer />
          </div>
        </div>
      </div>
    );
  }

  const p = partnerPresence(member.slug, now);
  const [time, meridiem] = splitClock(p.localTime, member.homeTimezone, now);

  return (
    <article className="glass relative overflow-hidden rounded-[1.5rem] p-4">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-10 ${isEva ? "-left-10" : "-right-10"} h-32 w-32 rounded-full blur-2xl ${auraClass}`}
      />
      <div className="relative">
        <header className="flex items-center justify-between">
          <h3 className={`type-label ${nameClass}`}>{member.displayName}</h3>
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span
              className={`absolute inset-0 rounded-full ${dotClass}`}
              style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
            />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
          </span>
        </header>

        <p className="mt-2.5 flex items-baseline gap-1">
          <span className="type-clock">{time}</span>
          <span className="type-label text-mute">{meridiem}</span>
        </p>

        <p className="type-caption mt-1.5 text-mute">
          {CITY[member.slug]} · {PRESENCE_COPY[p.presence]}
        </p>
      </div>
    </article>
  );
}

/** `11:48 pm` → ["11:48", "pm"], recomputed live so the digits tick. */
function splitClock(fromPresence: string, tz: string, now: Date): [string, string] {
  if (fromPresence === "") return ["--:--", ""];
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  })
    .format(now)
    .toLowerCase();
  const parts = formatted.split(/\s/);
  return [parts[0] ?? formatted, parts[1] ?? ""];
}

function Shimmer() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 block"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
        animation: "shimmer 1.6s var(--ease-io) infinite",
      }}
    />
  );
}
