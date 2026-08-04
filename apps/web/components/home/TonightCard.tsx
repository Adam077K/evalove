"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { currentWindow } from "@/lib/shared-day";
import { WINDOW_STRINGS } from "@/lib/fixtures/members";
import { SUGGESTIONS } from "@/lib/fixtures/suggestions";
import type { ActivityIndexEntry } from "@/lib/types";

/**
 * One idea that fits the window the two of them are in right now,
 * drawn from the researched library — never invented. Tapping goes
 * to Dates, where the full shelf lives.
 */
export function TonightCard() {
  const [windowId, setWindowId] = useState<string | null>(null);

  useEffect(() => {
    setWindowId(currentWindow(new Date()));
  }, []);

  if (windowId === null) {
    return (
      <div className="card rounded-[1.25rem] p-5">
        <div className="well relative h-4 w-40 overflow-hidden rounded-full">
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--shimmer), transparent)",
              animation: "shimmer 1.6s var(--ease-io) infinite",
            }}
          />
        </div>
        <div className="well mt-3 h-3.5 w-56 rounded-full" />
      </div>
    );
  }

  const all = Object.values(SUGGESTIONS);
  const pick: ActivityIndexEntry | undefined =
    all.find((s) => s.windowFit.includes(windowId)) ?? all[0];

  if (!pick) {
    return (
      <div className="card rounded-[1.25rem] p-5">
        <h2 className="type-card text-ink">The shelf is empty</h2>
        <p className="type-caption mt-1 text-mute">
          The date library hasn&rsquo;t been loaded on this device yet.
        </p>
      </div>
    );
  }

  const windowLabel = WINDOW_STRINGS[windowId] ?? "";

  return (
    <Link
      href="/dates"
      className="card hover-lift block rounded-[1.25rem] p-5"
      aria-label={`For this window: ${pick.title}`}
    >
      <div className="flex items-start gap-4">
        <span className="well flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink">
          <Sparkles size={19} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-micro text-mute">{windowLabel}</p>
          <h2 className="type-card mt-1 text-ink">{pick.title}</h2>
          <p className="type-caption mt-0.5 text-mute">{pick.description}</p>
          <p className="type-caption mt-2 flex gap-3 text-mute">
            <span>{pick.durationMin} min</span>
            {pick.costTier === "free" ? <span>free</span> : null}
            {pick.screenFree ? <span>screens down</span> : null}
          </p>
        </div>
        <ArrowUpRight size={18} strokeWidth={1.9} className="mt-1 shrink-0 text-mute" />
      </div>
    </Link>
  );
}
