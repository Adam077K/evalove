/**
 * The golden set for the shared-day model.
 *
 * The model under test, in one line:
 *
 *   A shared day D is a named calendar date. A photo belongs to D if its
 *   author's own local date was D when they posted it.
 *
 *   sharedDay = (createdAt AT TIME ZONE <author's IANA zone>)::date
 *
 * The rejected alternative anchored the day at a fixed instant (08:00 UTC). It
 * disagreed with this model on 44.1% of Adam's posts and 15.2% of Eva's, every
 * single day — structural, not a DST edge case — because it files Adam's local
 * 00:00-10:00 under the previous date. His 08:00 Saturday photo would land on
 * Friday, a day that may already hold a photo from both of us. That is the
 * disqualifying failure, and `golden 4` below is the test that decides it.
 *
 * The rejected model is described here and NOT implemented, even as a fixture:
 * writing it down would mean writing a numeric UTC offset into this repository,
 * which is the precise regression these tests exist to prevent.
 */
import { describe, expect, it } from "vitest";

import {
  MEMBER_PROFILES,
  SHARED_DAY_CLOSE_TZ,
  SHARED_DAY_OPEN_TZ,
  boundsOf,
  containsInstant,
  dualLocalDates,
  localPartsOf,
  resolveTz,
  sharedDayLengthMs,
  sharedDayOf,
  startOfLocalDay,
} from "../index";
import {
  MS_HOUR,
  MS_MINUTE,
  MS_SECOND,
  coDateOverlap,
  contiguousRuns,
  datesOfYear,
  lcg,
  localDaySpan,
  nextDate,
} from "./helpers";

import type { MemberSlug } from "../../types";

const YEAR = 2026;
const DATES = datesOfYear(YEAR);

const ADAM_TZ = MEMBER_PROFILES.adam.homeTimezone;
const EVA_TZ = MEMBER_PROFILES.eva.homeTimezone;

const SLUGS: readonly MemberSlug[] = ["eva", "adam"];
const TZ_OF: Record<MemberSlug, string> = { eva: EVA_TZ, adam: ADAM_TZ };

/**
 * All four 2026 DST transitions, each with the day before and the day after.
 *
 *   2026-03-08  New York springs forward
 *   2026-03-27  Israel springs forward   (Friday before the last Sunday in March)
 *   2026-10-25  Israel falls back        (last Sunday in October)
 *   2026-11-01  New York falls back
 */
const TRANSITION_DATES: readonly string[] = [
  "2026-03-07",
  "2026-03-08",
  "2026-03-09",
  "2026-03-26",
  "2026-03-27",
  "2026-03-28",
  "2026-10-24",
  "2026-10-25",
  "2026-10-26",
  "2026-10-31",
  "2026-11-01",
  "2026-11-02",
];

/** The three wall-clock edges we probe on every transition date, in each zone. */
const EDGE_LABELS = ["23:59", "00:00", "00:01"] as const;

function edgeInstant(d: string, tz: string, label: (typeof EDGE_LABELS)[number]) {
  if (label === "00:00") return startOfLocalDay(d, tz).getTime();
  if (label === "00:01") return startOfLocalDay(d, tz).getTime() + MS_MINUTE;
  return startOfLocalDay(nextDate(d), tz).getTime() - MS_MINUTE;
}

/* ------------------------------------------------------------------ *
 * Zone plumbing
 * ------------------------------------------------------------------ */

describe("the two zones", () => {
  it("opens on Israel and closes on New York, by IANA id", () => {
    expect(SHARED_DAY_OPEN_TZ).toBe("Asia/Jerusalem");
    expect(SHARED_DAY_CLOSE_TZ).toBe("America/New_York");
    expect(ADAM_TZ).toBe("Asia/Jerusalem");
    expect(EVA_TZ).toBe("America/New_York");
  });
});

/* ------------------------------------------------------------------ *
 * The DST transition matrix — every assertion below also runs here
 * ------------------------------------------------------------------ */

describe("all four 2026 DST transitions, at 23:59 / 00:00 / 00:01 in both zones", () => {
  for (const d of TRANSITION_DATES) {
    for (const slug of SLUGS) {
      const tz = TZ_OF[slug];
      for (const label of EDGE_LABELS) {
        it(`${d} ${label} ${slug} (${tz})`, () => {
          const at = new Date(edgeInstant(d, tz, label));
          const parts = localPartsOf(at, tz);

          // The instant really is the wall clock we asked for.
          expect(parts.date).toBe(d);
          expect(parts.time).toBe(label);

          // The author's own local date is the shared day. That is the model.
          expect(sharedDayOf(at, tz)).toBe(d);

          // And that shared day contains the instant.
          expect(containsInstant(d, at)).toBe(true);

          // Bounds stay well-ordered across the transition.
          const { open, close } = boundsOf(d);
          expect(open.getTime()).toBeLessThan(close.getTime());
        });
      }
    }
  }
});

/* ------------------------------------------------------------------ *
 * Golden 1 — length
 * ------------------------------------------------------------------ */

describe("golden 1 — shared-day length", () => {
  it("is 31h on 339 days of 2026 and 30h on 26, and never any other value", () => {
    const byLength = new Map<number, string[]>();
    for (const d of DATES) {
      const len = sharedDayLengthMs(d);
      const bucket = byLength.get(len);
      if (bucket === undefined) byLength.set(len, [d]);
      else bucket.push(d);
    }

    const lengths = [...byLength.keys()].sort((a, b) => a - b);
    expect(lengths).toEqual([30 * MS_HOUR, 31 * MS_HOUR]);
    expect(byLength.get(30 * MS_HOUR)?.length).toBe(26);
    expect(byLength.get(31 * MS_HOUR)?.length).toBe(339);
    expect(DATES).toHaveLength(365);
  });

  it("the 30h days are exactly the two stretches where the gap is six hours", () => {
    const thirty = DATES.filter((d) => sharedDayLengthMs(d) === 30 * MS_HOUR);
    const runs = contiguousRuns(thirty);

    expect(runs).toHaveLength(2);
    // New York springs forward on 08 March; Israel not until 27 March.
    expect(runs[0]).toEqual({ from: "2026-03-08", to: "2026-03-27", length: 20 });
    // Israel falls back on 25 October; New York not until 01 November.
    expect(runs[1]).toEqual({ from: "2026-10-26", to: "2026-10-31", length: 6 });

    // "gap" is not stored anywhere — it is length minus a plain 24h day.
    for (const d of DATES) {
      const gap = sharedDayLengthMs(d) - 24 * MS_HOUR;
      const expected = thirty.includes(d) ? 6 * MS_HOUR : 7 * MS_HOUR;
      expect(gap, `gap on ${d}`).toBe(expected);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Golden 2 — well-ordered
 * ------------------------------------------------------------------ */

describe("golden 2 — well-ordered every day of 2026", () => {
  it("opens before it closes, and both edges advance monotonically", () => {
    let previous: { open: number; close: number } | null = null;

    for (const d of DATES) {
      const { open, close } = boundsOf(d);
      const openMs = open.getTime();
      const closeMs = close.getTime();

      expect(openMs, `open < close on ${d}`).toBeLessThan(closeMs);

      if (previous !== null) {
        expect(openMs, `open advances into ${d}`).toBeGreaterThan(previous.open);
        expect(closeMs, `close advances into ${d}`).toBeGreaterThan(previous.close);
      }
      previous = { open: openMs, close: closeMs };
    }
  });

  it("opens at 00:00 in Israel and closes at 23:59:59 in New York", () => {
    for (const d of DATES) {
      const { open, close } = boundsOf(d);
      expect(localPartsOf(open, SHARED_DAY_OPEN_TZ).date, `open date ${d}`).toBe(d);
      expect(localPartsOf(open, SHARED_DAY_OPEN_TZ).time, `open time ${d}`).toBe(
        "00:00",
      );
      expect(localPartsOf(close, SHARED_DAY_CLOSE_TZ).date, `close date ${d}`).toBe(
        d,
      );
      expect(
        localPartsOf(close, SHARED_DAY_CLOSE_TZ).time,
        `close time ${d}`,
      ).toBe("23:59");
      expect(localPartsOf(close, SHARED_DAY_CLOSE_TZ).second).toBe(59);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Golden 3 — containment
 * ------------------------------------------------------------------ */

describe("golden 3 — containment, zero violations", () => {
  it("each person's whole local date sits inside its own shared day", () => {
    const violations: string[] = [];

    for (const slug of SLUGS) {
      const tz = TZ_OF[slug];
      for (const d of DATES) {
        const { start, endExclusive } = localDaySpan(d, tz);
        const last = endExclusive - 1;

        if (sharedDayOf(new Date(start), tz) !== d) {
          violations.push(`${slug} ${d}: first instant is not on ${d}`);
        }
        if (sharedDayOf(new Date(last), tz) !== d) {
          violations.push(`${slug} ${d}: last instant is not on ${d}`);
        }
        if (!containsInstant(d, new Date(start))) {
          violations.push(`${slug} ${d}: local midnight falls outside the day`);
        }
        if (!containsInstant(d, new Date(last))) {
          violations.push(`${slug} ${d}: last local millisecond falls outside`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("neither of us can ever be late: sampled instants always land inside their own day", () => {
    const rand = lcg(0x5eed_1234);
    const from = Date.UTC(YEAR, 0, 1);
    const to = Date.UTC(YEAR + 1, 0, 1);
    const violations: string[] = [];

    for (let i = 0; i < 5000; i += 1) {
      const at = new Date(from + Math.floor(rand() * (to - from)));
      for (const slug of SLUGS) {
        const tz = TZ_OF[slug];
        const day = sharedDayOf(at, tz);
        if (!containsInstant(day, at)) {
          violations.push(`${slug} ${at.toISOString()} -> ${day}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Golden 4 — the deciding test
 * ------------------------------------------------------------------ */

interface Post {
  at: number;
  who: MemberSlug;
  /** The author's own local date at `at`. What the day SHOULD be named. */
  localDate: string;
}

/**
 * One daily photo per person per their own local date, across all of 2026, at
 * an arbitrary but reproducible moment inside that local date — except on the
 * twelve DST-transition dates, where the post is pinned to a wall-clock edge.
 */
function dailyPostHistory(seed: number): Post[] {
  const rand = lcg(seed);
  const posts: Post[] = [];

  for (const who of SLUGS) {
    const tz = TZ_OF[who];
    let edge = 0;
    for (const d of DATES) {
      const { start, endExclusive } = localDaySpan(d, tz);
      const roll = rand();
      const transitionIndex = TRANSITION_DATES.indexOf(d);
      const at =
        transitionIndex === -1
          ? start + Math.floor(roll * (endExclusive - start))
          : edgeInstant(d, tz, EDGE_LABELS[edge++ % EDGE_LABELS.length] ?? "00:00");
      posts.push({ at, who, localDate: d });
    }
  }

  return posts;
}

interface ReplayResult {
  landedOnCompleteDay: string[];
  misnamed: string[];
  completeDays: number;
}

function replay(posts: readonly Post[]): ReplayResult {
  const state = new Map<string, { eva: boolean; adam: boolean }>();
  const landedOnCompleteDay: string[] = [];
  const misnamed: string[] = [];

  for (const post of posts) {
    const tz = TZ_OF[post.who];
    const day = sharedDayOf(new Date(post.at), tz);

    if (day !== post.localDate) {
      misnamed.push(
        `${post.who} posted on their ${post.localDate} but was filed under ${day}`,
      );
    }

    const seen = state.get(day) ?? { eva: false, adam: false };
    if (seen.eva && seen.adam) {
      landedOnCompleteDay.push(
        `${post.who} @ ${new Date(post.at).toISOString()} landed on ${day}, already complete`,
      );
    }
    seen[post.who] = true;
    state.set(day, seen);
  }

  let completeDays = 0;
  for (const seen of state.values()) {
    if (seen.eva && seen.adam) completeDays += 1;
  }

  return { landedOnCompleteDay, misnamed, completeDays };
}

describe("golden 4 — the deciding test", () => {
  it("no photo is ever assigned to a shared day that was already complete", () => {
    const posts = dailyPostHistory(0xc0ff_ee01).sort((a, b) => a.at - b.at);
    const result = replay(posts);

    expect(result.landedOnCompleteDay).toEqual([]);
    expect(result.misnamed).toEqual([]);
    expect(result.completeDays).toBe(365);
  });

  it("holds under out-of-order arrival too — an offline outbox flushing late", () => {
    const posts = dailyPostHistory(0xc0ff_ee02);
    const rand = lcg(0xd15c_0de5);
    const shuffled = [...posts];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      const a = shuffled[i];
      const b = shuffled[j];
      if (a !== undefined && b !== undefined) {
        shuffled[i] = b;
        shuffled[j] = a;
      }
    }

    const inOrder = replay([...posts].sort((a, b) => a.at - b.at));
    const outOfOrder = replay(shuffled);

    expect(outOfOrder.landedOnCompleteDay).toEqual([]);
    expect(outOfOrder.misnamed).toEqual([]);
    expect(outOfOrder.completeDays).toBe(inOrder.completeDays);
  });

  it("structurally: each person has exactly one local date at every instant", () => {
    const rand = lcg(0xa11_1);
    const from = Date.UTC(YEAR, 0, 1);
    const to = Date.UTC(YEAR + 1, 0, 1);

    for (let i = 0; i < 2000; i += 1) {
      const at = new Date(from + Math.floor(rand() * (to - from)));
      const { eva, adam, differ } = dualLocalDates(at);
      expect(sharedDayOf(at, EVA_TZ)).toBe(eva);
      expect(sharedDayOf(at, ADAM_TZ)).toBe(adam);
      expect(differ).toBe(eva !== adam);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Golden 5 — order independence
 * ------------------------------------------------------------------ */

describe("golden 5 — order independence", () => {
  it("posting 12h before or 12h after your partner lands on the same named day", () => {
    for (const d of DATES) {
      const overlap = coDateOverlap(d, EVA_TZ, ADAM_TZ);

      // Precondition: the stretch where we are both on date d must be able to
      // hold a 12h separation at all.
      expect(overlap.lengthMs, `co-date overlap on ${d}`).toBeGreaterThan(
        12 * MS_HOUR,
      );

      const first = new Date(overlap.start);
      const second = new Date(overlap.start + 12 * MS_HOUR);

      // Eva first, Adam 12h later.
      expect(sharedDayOf(first, EVA_TZ), `eva first on ${d}`).toBe(d);
      expect(sharedDayOf(second, ADAM_TZ), `adam +12h on ${d}`).toBe(d);

      // Adam first, Eva 12h later. Same named day.
      expect(sharedDayOf(first, ADAM_TZ), `adam first on ${d}`).toBe(d);
      expect(sharedDayOf(second, EVA_TZ), `eva +12h on ${d}`).toBe(d);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Golden 6 — the visit
 * ------------------------------------------------------------------ */

describe("golden 6 — the visit", () => {
  it("prefers the zone the device reports over the home zone", () => {
    expect(resolveTz("Asia/Jerusalem", "America/New_York")).toBe("Asia/Jerusalem");
  });

  it("puts Eva on Adam's calendar date at every instant, with no special case", () => {
    const visiting = resolveTz("Asia/Jerusalem", EVA_TZ);
    const rand = lcg(0x1_5171);
    const from = Date.UTC(YEAR, 0, 1);
    const to = Date.UTC(YEAR + 1, 0, 1);

    for (let i = 0; i < 3000; i += 1) {
      const at = new Date(from + Math.floor(rand() * (to - from)));
      expect(sharedDayOf(at, visiting)).toBe(sharedDayOf(at, ADAM_TZ));
    }

    const { eva, adam, differ } = dualLocalDates(new Date(Date.UTC(YEAR, 5, 15, 3)), {
      eva: visiting,
    });
    expect(eva).toBe(adam);
    expect(differ).toBe(false);
  });

  it("collapses the shared day to an ordinary 24 hours", () => {
    const visiting = resolveTz("Asia/Jerusalem", EVA_TZ);
    const seen = new Map<number, string[]>();

    for (const d of DATES) {
      const overlap = coDateOverlap(d, visiting, ADAM_TZ);
      const bucket = seen.get(overlap.lengthMs);
      if (bucket === undefined) seen.set(overlap.lengthMs, [d]);
      else bucket.push(d);
    }

    // Two dates in 2026 are not 24h long in Israel, and they are Israel's own
    // DST transitions — not anything this module invented.
    expect(seen.get(23 * MS_HOUR)).toEqual(["2026-03-27"]);
    expect(seen.get(25 * MS_HOUR)).toEqual(["2026-10-25"]);
    expect(seen.get(24 * MS_HOUR)?.length).toBe(363);
    expect([...seen.keys()].sort((a, b) => a - b)).toEqual([
      23 * MS_HOUR,
      24 * MS_HOUR,
      25 * MS_HOUR,
    ]);
  });

  it("leaves the shared-day bounds untouched — the visit changes no boundary", () => {
    const before = DATES.map((d) => {
      const { open, close } = boundsOf(d);
      return `${d}|${open.toISOString()}|${close.toISOString()}`;
    });
    resolveTz("Asia/Jerusalem", EVA_TZ);
    const after = DATES.map((d) => {
      const { open, close } = boundsOf(d);
      return `${d}|${open.toISOString()}|${close.toISOString()}`;
    });
    expect(after).toEqual(before);
  });
});

/* ------------------------------------------------------------------ *
 * Golden 7 — New York's own two edges
 * ------------------------------------------------------------------ */

describe("golden 7 — New York fall-back and spring-forward", () => {
  function minutesOfLocalDay(d: string, tz: string) {
    const { start, endExclusive } = localDaySpan(d, tz);
    const out: { at: number; time: string; date: string }[] = [];
    for (let t = start; t < endExclusive; t += MS_MINUTE) {
      const parts = localPartsOf(new Date(t), tz);
      out.push({ at: t, time: parts.time, date: parts.date });
    }
    return out;
  }

  it("fall-back repeats 01:00-01:59 on 2026-11-01, same date both times", () => {
    const minutes = minutesOfLocalDay("2026-11-01", EVA_TZ);
    expect(minutes).toHaveLength(25 * 60);

    const byTime = new Map<string, number[]>();
    for (const m of minutes) {
      expect(m.date).toBe("2026-11-01");
      expect(sharedDayOf(new Date(m.at), EVA_TZ)).toBe("2026-11-01");
      const bucket = byTime.get(m.time);
      if (bucket === undefined) byTime.set(m.time, [m.at]);
      else bucket.push(m.at);
    }

    const repeated = [...byTime.entries()]
      .filter(([, instants]) => instants.length > 1)
      .map(([time]) => time)
      .sort();
    expect(repeated).toHaveLength(60);
    expect(repeated[0]).toBe("01:00");
    expect(repeated[59]).toBe("01:59");

    for (const time of repeated) {
      const instants = byTime.get(time) ?? [];
      expect(instants).toHaveLength(2);
      const [a, b] = instants;
      if (a === undefined || b === undefined) throw new Error("unreachable");
      expect(b - a).toBe(MS_HOUR);
    }
  });

  it("spring-forward skips 02:00-02:59 on 2026-03-08, still unambiguous", () => {
    const minutes = minutesOfLocalDay("2026-03-08", EVA_TZ);
    expect(minutes).toHaveLength(23 * 60);

    const times = new Set<string>();
    for (const m of minutes) {
      expect(m.date).toBe("2026-03-08");
      expect(m.time.startsWith("02:")).toBe(false);
      // Unambiguous: no wall clock is reachable by two different instants.
      expect(times.has(m.time)).toBe(false);
      times.add(m.time);
    }
    expect(times.size).toBe(23 * 60);
  });

  it("keeps both New York edges inside their own shared day", () => {
    for (const d of ["2026-03-08", "2026-11-01"]) {
      const { start, endExclusive } = localDaySpan(d, EVA_TZ);
      expect(containsInstant(d, new Date(start))).toBe(true);
      expect(containsInstant(d, new Date(endExclusive - MS_SECOND))).toBe(true);
      expect(containsInstant(d, new Date(endExclusive - 1))).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ *
 * The host machine's own zone must not matter
 * ------------------------------------------------------------------ */

describe("host time zone independence", () => {
  it("holds every invariant under a hostile process TZ", () => {
    const original = process.env.TZ;

    // Each probe gets its own year, so no probe is answered from the memoised
    // boundary cache warmed by an earlier one. Years no other test touches.
    const probes: readonly { tz: string; year: number }[] = [
      { tz: "UTC", year: 2031 },
      { tz: "Pacific/Chatham", year: 2032 },
      { tz: "Pacific/Kiritimati", year: 2033 },
    ];

    try {
      for (const { tz, year } of probes) {
        process.env.TZ = tz;

        for (const d of datesOfYear(year).filter((_, i) => i % 17 === 0)) {
          const { open, close } = boundsOf(d);
          const openParts = localPartsOf(open, SHARED_DAY_OPEN_TZ);
          const closeParts = localPartsOf(close, SHARED_DAY_CLOSE_TZ);

          expect(openParts.date, `${tz} ${d} open date`).toBe(d);
          expect(openParts.time, `${tz} ${d} open time`).toBe("00:00");
          expect(closeParts.date, `${tz} ${d} close date`).toBe(d);
          expect(closeParts.time, `${tz} ${d} close time`).toBe("23:59");
          expect(closeParts.second, `${tz} ${d} close second`).toBe(59);
          expect(open.getTime(), `${tz} ${d} ordering`).toBeLessThan(
            close.getTime(),
          );
        }
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});
