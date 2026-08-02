"use client";

import { useEffect, useState } from "react";
import type { IanaTimeZone } from "@/lib/types";
import { localTime } from "@/lib/time";

/**
 * The current hour in one person's own city, live. This is a clock,
 * never a counter: it shows what time it is where they are, and
 * nothing about how long anything has taken. Updates on the half
 * minute — a book page does not tick.
 */
export function LiveLocalTime({ tz }: { tz: IanaTimeZone }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{localTime(now, tz)}</span>;
}
