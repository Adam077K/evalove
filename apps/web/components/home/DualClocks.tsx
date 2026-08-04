"use client";

import { useEffect, useState } from "react";
import { partnerPresence, type PresenceGuess } from "@/lib/shared-day";
import { CITY, MEMBERS } from "@/lib/fixtures/members";
import type { Member } from "@/lib/types";

/**
 * The two clocks — Home's masthead. Eva's first.
 *
 * This is the single most identifying object in the product: two
 * cities side by side, one of them showing a person asleep. Nobody
 * else has it. It was rendered as two 50/50 rounded cards, which is
 * the most templated shape in the kit, with the hours at 38px — large
 * enough to be accidentally the biggest type in the app, not large
 * enough to be the point.
 *
 * So it is a rail: two full-width rows on hairline rules, the hour
 * sitting directly on the paper with no card around it, the city and
 * the presence guess as 11px meta beside it.
 *
 * It is not the largest thing on the page, and that is a correction.
 * The first version set the hour at masthead scale, which quietly
 * rebuilt the surface PRODUCT-VISION-V2 §3.1 deleted: the gap was cut
 * as a room precisely because a clock is correct on day one and on day
 * four hundred, and 59px is a claim that something is the most
 * important object present. What is large on Home now is the live
 * window sentence above this rail — the thing that changes. The hours
 * are the evidence underneath it.
 *
 * Both rows are identical in weight. The hour is the only thing
 * allowed to be large and both of them get it; this product must never
 * render one partner larger than the other.
 *
 * The presence guess is inferred from the wall clock and their working
 * week, never from the device. The dot is `--mute`, not either
 * person's ink: nobody *made* a clock, and the authorship inks are
 * reserved for authored things. It breathes; it does not blink.
 *
 * The name is an <h3> and must stay one. The rail rebuild briefly
 * demoted it to a <p>, which took Eva and Adam out of the heading
 * outline and cost a screen-reader user their navigation stop. The
 * section's aria-label still announced the content, so nothing was
 * unreachable — it was the *structure* that went. Of every string in
 * this product, theirs are the ones that should be navigable.
 *
 * Before the first client tick the rows render as shimmering
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
    <section
      aria-label="Where Eva and Adam are in their days"
      className="border-t border-line"
    >
      {MEMBERS.map((m) => (
        <ClockRow key={m.slug} member={m} now={now} />
      ))}
    </section>
  );
}

function ClockRow({ member, now }: { member: Member; now: Date | null }) {
  if (now === null) {
    return (
      <div className="border-b border-line py-3.5">
        <div className="well relative h-3 w-14 overflow-hidden rounded-full">
          <Shimmer />
        </div>
        <div className="well relative mt-2 h-12 w-40 overflow-hidden rounded-[0.625rem]">
          <Shimmer />
        </div>
      </div>
    );
  }

  const p = partnerPresence(member.slug, now);
  const [time, meridiem] = splitClock(p.localTime, member.homeTimezone, now);

  return (
    <article className="border-b border-line py-3.5">
      <h3 className="type-micro normal-case text-mute">{member.displayName}</h3>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="flex items-baseline gap-1.5">
          <span className="type-clock">{time}</span>
          <span className="type-micro text-mute">{meridiem}</span>
        </p>
        <p className="type-micro flex items-center gap-1.5 pb-1 text-mute">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span
              className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-mute"
              style={{ animation: "breathe 3.2s var(--ease-io) infinite" }}
            />
            <span className="relative h-1.5 w-1.5 rounded-full bg-mute" />
          </span>
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
          "linear-gradient(90deg, transparent, var(--shimmer), transparent)",
        animation: "shimmer 1.6s var(--ease-io) infinite",
      }}
    />
  );
}
