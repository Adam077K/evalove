"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Clock, MonitorOff, Sparkles } from "lucide-react";
import { currentWindow } from "@/lib/shared-day";
import { WINDOW_STRINGS } from "@/lib/fixtures/members";
import { SUGGESTIONS } from "@/lib/fixtures/suggestions";

/**
 * The idea shelf — the researched library, browsed by window.
 *
 * The rail lists the nine windows in the couple's own words; the one
 * happening right now is selected on arrival and marked "now". A
 * violet pill slides between selections on a spring. Below, the
 * entries that fit. A window with nothing on its shelf says so
 * honestly — it is a thin window, not a broken screen.
 */

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };
const WINDOW_IDS = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9"];

/**
 * Window strings read grammatically mid-sentence lowercased ("fits
 * saturday — …") — except the two names, which the law never
 * lowercases. `\b` still finds "Eva"/"Adam" inside the curly-quote
 * possessive ("eva’s") because the apostrophe is a non-word
 * character, so the boundary falls exactly where the name ends.
 */
export function midSentence(windowString: string): string {
  return windowString
    .toLowerCase()
    .replace(/\beva\b/gi, "Eva")
    .replace(/\badam\b/gi, "Adam");
}

export function DatesExplorer() {
  const [nowWindow, setNowWindow] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const w = currentWindow(new Date());
    setNowWindow(w);
    setSelected((s) => s ?? w);
  }, []);

  /* Bring the selected window into view — centred, no page jump. */
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selected]);

  const active = selected ?? "w1";
  const entries = Object.values(SUGGESTIONS).filter((s) =>
    s.windowFit.includes(active),
  );

  return (
    <section aria-labelledby="shelf-title">
      <h2 id="shelf-title" className="type-micro mb-4 text-mute">
        The idea shelf
      </h2>

      {/* The window rail. */}
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 md:-mx-8 md:px-8"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
        aria-label="Windows"
      >
        {WINDOW_IDS.map((id) => {
          const isActive = id === active;
          const isNow = id === nowWindow;
          return (
            <button
              key={id}
              ref={isActive ? activeRef : undefined}
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelected(id)}
              className={`press relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition-colors duration-200 ${
                isActive ? "text-on-ink" : "card text-mute"
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="window-pill"
                  transition={SPRING}
                  className="pill-ink absolute inset-0 rounded-full"
                />
              ) : null}
              <span className="type-label relative flex items-center gap-1.5">
                {WINDOW_STRINGS[id]}
                {isNow ? (
                  <span
                    className={`rounded-full border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ${
                      isActive ? "border-current/40" : "border-line text-ink"
                    }`}
                  >
                    now
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* The shelf. */}
      {nowWindow === null ? (
        <div className="space-y-3 pt-2" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="card h-24 overflow-hidden rounded-[1.125rem] p-5">
              <div className="well relative h-4 w-44 overflow-hidden rounded-full">
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--shimmer), transparent)",
                    animation: "shimmer 1.6s var(--ease-io) infinite",
                  }}
                />
              </div>
              <div className="well mt-3 h-3.5 w-64 max-w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="card rounded-[1.125rem] px-6 py-10 text-center">
          <p className="type-card text-ink">A thin window</p>
          <p className="type-caption mx-auto mt-1.5 max-w-[28rem] text-mute">
            Nothing on the shelf fits{" "}
            {midSentence(WINDOW_STRINGS[active] ?? "")} —
            some windows are for sleeping, not planning. Another window has more.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 pt-2">
          {entries.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: i * 0.05 }}
              className="card hover-lift rounded-[1.125rem] p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center well rounded-full text-ink">
                  <Sparkles size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h3 className="type-card text-ink">{s.title}</h3>
                  <p className="type-caption mt-0.5 text-mute">{s.description}</p>
                  <p className="type-caption mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-mute">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} strokeWidth={2} aria-hidden="true" />
                      {s.durationMin} min
                    </span>
                    {s.costTier === "free" ? <span>free</span> : null}
                    {s.screenFree ? (
                      <span className="inline-flex items-center gap-1">
                        <MonitorOff size={13} strokeWidth={2} aria-hidden="true" />
                        screens down
                      </span>
                    ) : null}
                    {s.verificationTier === "plausible-unverified" ? (
                      <span className="rounded-full bg-surface-2 px-2 py-px">
                        unverified
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
