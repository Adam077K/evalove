import { describe, expect, it } from "vitest";

import {
  MS_MINUTE,
  SHARED_DAY_OPEN_TZ,
  WINDOWS,
  boundsOf,
  containsInstant,
  localPartsOf,
  startOfLocalDay,
} from "@/lib/shared-day";
import {
  OVERLAP_WINDOW_IDS,
  bothClocksAt,
  firstInstantOfLocalMinute,
  isOverlapWindow,
  placeWindow,
  sharedDaysFrom,
} from "../instants";

import type { WindowId } from "@/lib/shared-day";

/**
 * The two days this module exists for.
 *
 * On 2026-03-27 the opening zone's clock goes 01:59 → 03:00; on 2026-10-25 it
 * goes 02:59 → 02:00. Both transitions sit inside `w8` (minutes 0–180), so on
 * both days the naive `startOfLocalDay + minutes` arithmetic is wrong by
 * exactly one hour — silently, and in opposite directions. The `naive is
 * wrong` tests below assert that gap directly, so that a regression which
 * quietly reverts this module to arithmetic cannot leave the suite green.
 */
const SPRING_FORWARD = "2026-03-27";
const FALL_BACK = "2026-10-25";
/** A day with no transition in either zone, as the control. */
const ORDINARY = "2026-08-14";

function openZoneClock(at: Date): string {
  const p = localPartsOf(at, SHARED_DAY_OPEN_TZ);
  return `${p.date} ${p.time}`;
}

function naiveInstant(day: string, minute: number): Date {
  return new Date(startOfLocalDay(day, SHARED_DAY_OPEN_TZ).getTime() + minute * MS_MINUTE);
}

describe("firstInstantOfLocalMinute", () => {
  it("reads back as the wall clock it was asked for, on an ordinary day", () => {
    // w6 opens at minute 1140 = 19:00 on the opening zone's clock.
    const at = firstInstantOfLocalMinute(ORDINARY, 1140, SHARED_DAY_OPEN_TZ);
    expect(openZoneClock(at)).toBe("2026-08-14 19:00");
  });

  it("treats minute 1440 as midnight of the following local date", () => {
    const at = firstInstantOfLocalMinute(ORDINARY, 1440, SHARED_DAY_OPEN_TZ);
    expect(openZoneClock(at)).toBe("2026-08-15 00:00");
    expect(at.getTime()).toBe(startOfLocalDay("2026-08-15", SHARED_DAY_OPEN_TZ).getTime());
  });

  it("lands on the real 03:00 on the day an hour is skipped", () => {
    const at = firstInstantOfLocalMinute(SPRING_FORWARD, 180, SHARED_DAY_OPEN_TZ);
    expect(openZoneClock(at)).toBe("2026-03-27 03:00");
    expect(at.toISOString()).toBe("2026-03-27T00:00:00.000Z");
  });

  it("naive arithmetic is wrong by an hour on the day an hour is skipped", () => {
    // Not a tautology: this is the bug the module is written to avoid, stated
    // as a fact about the day. If the transition ever moved and this stopped
    // being true, the test above would no longer be proving anything.
    expect(openZoneClock(naiveInstant(SPRING_FORWARD, 180))).toBe("2026-03-27 04:00");
    expect(naiveInstant(SPRING_FORWARD, 180).getTime()).not.toBe(
      firstInstantOfLocalMinute(SPRING_FORWARD, 180, SHARED_DAY_OPEN_TZ).getTime(),
    );
  });

  it("returns the instant the clock reaches a local time that never happens", () => {
    // 02:00 does not exist on 2026-03-27 in the opening zone. The clock reaches
    // it at the transition itself, which reads 03:00.
    const at = firstInstantOfLocalMinute(SPRING_FORWARD, 120, SHARED_DAY_OPEN_TZ);
    expect(at.toISOString()).toBe("2026-03-27T00:00:00.000Z");
    expect(openZoneClock(at)).toBe("2026-03-27 03:00");
  });

  it("lands on the real 03:00 on the day an hour is repeated", () => {
    const at = firstInstantOfLocalMinute(FALL_BACK, 180, SHARED_DAY_OPEN_TZ);
    expect(openZoneClock(at)).toBe("2026-10-25 03:00");
    expect(at.toISOString()).toBe("2026-10-25T01:00:00.000Z");
  });

  it("naive arithmetic is wrong by an hour on the day an hour is repeated", () => {
    expect(openZoneClock(naiveInstant(FALL_BACK, 180))).toBe("2026-10-25 02:00");
    expect(naiveInstant(FALL_BACK, 180).getTime()).not.toBe(
      firstInstantOfLocalMinute(FALL_BACK, 180, SHARED_DAY_OPEN_TZ).getTime(),
    );
  });

  it("takes the earlier instant when a local time happens twice", () => {
    // 01:00 occurs at both 22:00Z and 23:00Z on 2026-10-24. A date set for
    // 01:00 starts the first time 01:00 comes round.
    const at = firstInstantOfLocalMinute(FALL_BACK, 60, SHARED_DAY_OPEN_TZ);
    expect(at.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(openZoneClock(at)).toBe("2026-10-25 01:00");
  });
});

describe("placeWindow", () => {
  it("opens the first band of the day exactly where the shared day opens", () => {
    // w8 starts at minute 0, and `boundsOf` opens the shared day at local
    // midnight in the same zone. Two independent routes to one instant.
    const placed = placeWindow(ORDINARY, "w8");
    expect(placed).not.toBeNull();
    expect(placed?.opensAt.getTime()).toBe(boundsOf(ORDINARY).open.getTime());
  });

  it("tiles the day: every band closes where the next one opens", () => {
    for (const day of [ORDINARY, SPRING_FORWARD, FALL_BACK]) {
      const placed = WINDOWS.map((w) => placeWindow(day, w.id));
      for (let i = 0; i < placed.length - 1; i += 1) {
        const here = placed[i];
        const next = placed[i + 1];
        expect(here).not.toBeNull();
        expect(next).not.toBeNull();
        expect(here?.closesAt.getTime()).toBe(next?.opensAt.getTime());
      }
    }
  });

  it("puts every band inside the shared day it is named for", () => {
    for (const day of [ORDINARY, SPRING_FORWARD, FALL_BACK]) {
      for (const w of WINDOWS) {
        const placed = placeWindow(day, w.id);
        expect(placed).not.toBeNull();
        if (placed === null) continue;
        expect(containsInstant(day, placed.opensAt)).toBe(true);
        // `closesAt` is exclusive: the last band closes at the next local
        // midnight in the opening zone, still well inside the 31-hour day.
        expect(placed.closesAt.getTime()).toBeGreaterThan(placed.opensAt.getTime());
      }
    }
  });

  it("shortens the skipped-hour day and lengthens the repeated-hour one", () => {
    // w8 nominally runs three hours. On the two transition days it does not,
    // and that difference is real: it is what those mornings actually are.
    const span = (day: string): number => {
      const placed = placeWindow(day, "w8");
      if (placed === null) throw new Error(`w8 did not place on ${day}`);
      return placed.closesAt.getTime() - placed.opensAt.getTime();
    };
    const hour = 60 * MS_MINUTE;
    expect(span(ORDINARY)).toBe(3 * hour);
    expect(span(SPRING_FORWARD)).toBe(2 * hour);
    expect(span(FALL_BACK)).toBe(4 * hour);
  });

  it("carries both clocks, and they disagree about the hour", () => {
    const placed = placeWindow(ORDINARY, "w6");
    expect(placed).not.toBeNull();
    expect(placed?.opensAtLocal.adam.time).toBe("19:00");
    expect(placed?.opensAtLocal.eva.time).toBe("12:00");
    // Same instant, same named date for both of them on this particular day.
    expect(placed?.opensAtLocal.eva.date).toBe("2026-08-14");
    expect(placed?.opensAtLocal.adam.date).toBe("2026-08-14");
  });

  it("carries the band's own label, never a clock reading", () => {
    expect(placeWindow(ORDINARY, "w6")?.label).toBe("the long overlap");
    expect(placeWindow(ORDINARY, "w4")?.label).toBe("the first overlap");
  });

  it("refuses a band that is not one of the nine", () => {
    expect(placeWindow(ORDINARY, "w10" as WindowId)).toBeNull();
  });
});

describe("bothClocksAt", () => {
  it("reads the two home zones at one instant", () => {
    const clocks = bothClocksAt(new Date("2026-08-14T16:00:00.000Z"));
    expect(clocks.eva.time).toBe("12:00");
    expect(clocks.adam.time).toBe("19:00");
  });

  it("can put them on different named dates", () => {
    // 2026-08-15T02:00Z: Adam's clock has crossed midnight, Eva's has not.
    const clocks = bothClocksAt(new Date("2026-08-15T02:00:00.000Z"));
    expect(clocks.eva.date).toBe("2026-08-14");
    expect(clocks.adam.date).toBe("2026-08-15");
  });
});

describe("the overlap bands", () => {
  it("names the two bands where both of them are awake", () => {
    expect(OVERLAP_WINDOW_IDS).toEqual(["w4", "w6"]);
    expect(isOverlapWindow("w4")).toBe(true);
    expect(isOverlapWindow("w6")).toBe(true);
    expect(isOverlapWindow("w1")).toBe(false);
  });

  it("puts both of them at a plausible waking hour, read from tzdata", () => {
    for (const id of OVERLAP_WINDOW_IDS) {
      const placed = placeWindow(ORDINARY, id);
      expect(placed).not.toBeNull();
      if (placed === null) continue;
      for (const who of [placed.opensAtLocal.eva, placed.opensAtLocal.adam]) {
        expect(who.hour).toBeGreaterThanOrEqual(7);
        expect(who.hour).toBeLessThanOrEqual(23);
      }
    }
  });
});

describe("sharedDaysFrom", () => {
  it("walks the calendar forward, inclusive of the first day", () => {
    expect(sharedDaysFrom("2026-08-30", 4)).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });

  it("returns nothing when asked for nothing", () => {
    expect(sharedDaysFrom("2026-08-30", 0)).toEqual([]);
  });
});
