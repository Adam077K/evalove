"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { currentWindow } from "@/lib/shared-day";
import { WINDOW_STRINGS } from "@/lib/fixtures/members";
import { runningHeadDate } from "@/lib/time";
import { localDate } from "@/lib/time";
import { useViewer } from "@/lib/viewer";

/**
 * Home's opening line is the current window, in the couple's own
 * words — "Saturday — Eva and Adam both off". Not a greeting, not a
 * dashboard title: a sentence about where the two of them are right
 * now. The pocket's lock sits quietly in the corner; it is the only
 * way in.
 */
export function HomeHeader() {
  const { member } = useViewer();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dateLine =
    now === null ? "" : runningHeadDate(localDate(now, member.homeTimezone));
  const w = now === null ? null : currentWindow(now);
  const windowLine = w === null ? null : (WINDOW_STRINGS[w] ?? null);

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-h-[4.25rem]">
        <p className="type-micro text-mute" aria-hidden={dateLine === ""}>
          {dateLine || " "}
        </p>
        <h1 className="type-hero mt-1.5 text-ink">
          {windowLine ?? <span className="opacity-0">Eva &amp; Adam</span>}
        </h1>
      </div>
      <Link
        href="/pocket"
        aria-label="The pocket — private, opens with a passphrase"
        className="card press mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink"
      >
        <Lock size={18} strokeWidth={1.9} />
      </Link>
    </header>
  );
}
