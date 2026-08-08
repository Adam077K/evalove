/**
 * Tests for lib/stamp.ts — Brief A, success criteria §a.
 *
 * Required coverage:
 *   - Both asleep-directions (Eva asleep / Adam asleep)
 *   - The both-awake case (falls back to time-of-day)
 *   - Author in each zone
 *   - A date inside each of the two 2026 DST-mismatch windows
 *     (US spring-forward 8 March → IL 27 March;
 *      IL fall-back 25 Oct → US 1 Nov)
 *
 * Instants used (all UTC, annotated with local clock reading):
 *
 *   "2026-08-02T03:20:00Z"
 *     → IL  06:20 (Adam — IDT = UTC+3, working Sunday-Thursday, Aug 2 is Sunday ✓)
 *     → NY  23:20 (Eva  — EDT = UTC-4) → asleep (≥23h)
 *
 *   "2026-08-03T03:00:00Z"
 *     → NY  23:00 (Eva) → she is posting at 11pm
 *     → IL  06:00 (Adam — IDT) → before 07:00 → asleep
 *
 *   "2026-08-03T13:00:00Z"
 *     → NY  09:00 (Eva) → she is posting at 9am
 *     → IL  16:00 (Adam — IDT) → within work hours 09-18 on a Monday → working
 *       (Adam's workdays = [0,1,2,3,4]; Aug 3 2026 is a Monday = 1 ✓)
 *
 *   "2026-08-03T19:00:00Z"
 *     → NY  15:00 (Eva) → she is posting at 3pm
 *     → IL  22:00 (Adam — IDT) → before 23h → awake (not working; past 18h)
 *     → falls back to author time-of-day: 15h = "left in the afternoon"
 */

import { describe, expect, it } from "vitest";
import { stampFor, offsetNote, STAMP_STRINGS } from "@/lib/stamp";
import { RELATIVE_TIME_PATTERN } from "@/lib/copy-law";

/* ------------------------------------------------------------------
 * stampFor — condition line
 * ------------------------------------------------------------------ */

describe("stampFor — condition", () => {
  it("produces 'left while Eva was asleep' when Adam posts at w1 (Eva night)", () => {
    // 2026-08-02T03:20:00Z → IL 06:20 (Adam), NY 23:20 (Eva — asleep ≥23h)
    const stamp = stampFor("2026-08-02T03:20:00Z", "adam");
    expect(stamp.condition).toBe(STAMP_STRINGS.leftWhileAsleep("Eva"));
  });

  it("produces 'left while Adam was asleep' when Eva posts at his pre-dawn", () => {
    // 2026-08-03T03:00:00Z → NY 23:00 (Eva posting), IL 06:00 (Adam — before 07h → asleep)
    const stamp = stampFor("2026-08-03T03:00:00Z", "eva");
    expect(stamp.condition).toBe(STAMP_STRINGS.leftWhileAsleep("Adam"));
  });

  it("produces 'left while Adam was at work' when Eva posts mid-afternoon and Adam is on duty", () => {
    // 2026-08-03T13:00:00Z → NY 09:00 (Eva), IL 16:00 (Adam — work day, within 09-18h)
    const stamp = stampFor("2026-08-03T13:00:00Z", "eva");
    expect(stamp.condition).toBe(STAMP_STRINGS.leftWhileAtWork("Adam"));
  });

  it("falls back to time-of-day when the partner is awake outside work hours", () => {
    // 2026-08-03T19:00:00Z → NY 15:00 (Eva posting), IL 22:00 (Adam — awake, not working)
    const stamp = stampFor("2026-08-03T19:00:00Z", "eva");
    // "awake" → time-of-day based on Eva's local hour (15h = afternoon)
    expect(stamp.condition).toBe(STAMP_STRINGS.leftThisAfternoon);
  });
});

/* ------------------------------------------------------------------
 * stampFor — author/other strings (Rule 4: names not pronouns)
 * ------------------------------------------------------------------ */

describe("stampFor — author and other lines", () => {
  it("puts the author's name first on line 2 when Adam is the author", () => {
    const stamp = stampFor("2026-08-02T03:20:00Z", "adam");
    expect(stamp.author).toMatch(/^Adam /);
    expect(stamp.other).toMatch(/^Eva /);
  });

  it("puts the author's name first on line 2 when Eva is the author", () => {
    const stamp = stampFor("2026-08-03T03:00:00Z", "eva");
    expect(stamp.author).toMatch(/^Eva /);
    expect(stamp.other).toMatch(/^Adam /);
  });

  it("renders local time in 12-hour format for Adam posting at 06:20 IL", () => {
    // 2026-08-02T03:20:00Z → IL 06:20 am (IDT), NY 11:20 pm (EDT)
    const stamp = stampFor("2026-08-02T03:20:00Z", "adam");
    expect(stamp.author).toContain("6:20 am");
    expect(stamp.other).toContain("11:20 pm");
  });

  it("renders local time in 12-hour format for Eva posting at 23:00 NY", () => {
    // 2026-08-03T03:00:00Z → NY 11:00 pm (EDT), IL 6:00 am (IDT)
    const stamp = stampFor("2026-08-03T03:00:00Z", "eva");
    expect(stamp.author).toContain("11:00 pm");
    expect(stamp.other).toContain("6:00 am");
  });
});

/* ------------------------------------------------------------------
 * offsetNote — DST-mismatch windows
 * ------------------------------------------------------------------ */

describe("offsetNote — DST mismatch detection", () => {
  it("returns the DST note during the US-only spring-forward window (March 15, 2026)", () => {
    // US sprung forward March 8; IL has not yet (springs ~March 27)
    // → 6h difference → 30h shared day → show note
    const note = offsetNote("2026-03-15");
    expect(note).toBe(STAMP_STRINGS.dstNote);
  });

  it("returns null after both zones are on summer time (April 1, 2026)", () => {
    // Both US and IL are on DST → 7h difference → 31h shared day → no note
    const note = offsetNote("2026-04-01");
    expect(note).toBeNull();
  });

  it("returns the DST note during the IL-only fall-back window (October 28, 2026)", () => {
    // IL fell back October 25; US has not yet (falls back November 1)
    // → 6h difference → 30h shared day → show note
    const note = offsetNote("2026-10-28");
    expect(note).toBe(STAMP_STRINGS.dstNote);
  });

  it("returns null after both zones are back on standard time (November 5, 2026)", () => {
    // Both on standard time (US fell back Nov 1, IL fell back Oct 25) → 7h → no note
    const note = offsetNote("2026-11-05");
    expect(note).toBeNull();
  });
});

/* ------------------------------------------------------------------
 * Rule enforcement: no pronouns (Rule 4)
 * ------------------------------------------------------------------ */

describe("Rule 4 — no pronouns in stamp strings", () => {
  const pronounPattern = /\b(he|she|his|her|him|they|them|their)\b/i;

  it("stampFor produces no pronouns when Adam is author", () => {
    const stamp = stampFor("2026-08-02T03:20:00Z", "adam");
    expect(stamp.condition).not.toMatch(pronounPattern);
    expect(stamp.author).not.toMatch(pronounPattern);
    expect(stamp.other).not.toMatch(pronounPattern);
  });

  it("stampFor produces no pronouns when Eva is author", () => {
    const stamp = stampFor("2026-08-03T03:00:00Z", "eva");
    expect(stamp.condition).not.toMatch(pronounPattern);
    expect(stamp.author).not.toMatch(pronounPattern);
    expect(stamp.other).not.toMatch(pronounPattern);
  });

  it("STAMP_STRINGS has no pronouns in any static string", () => {
    const staticStrings: string[] = [
      STAMP_STRINGS.leftEarlyMorning,
      STAMP_STRINGS.leftThisMorning,
      STAMP_STRINGS.leftThisAfternoon,
      STAMP_STRINGS.leftThisEvening,
      STAMP_STRINGS.leftLate,
      STAMP_STRINGS.dstNote,
    ];
    for (const s of staticStrings) {
      expect(s).not.toMatch(pronounPattern);
    }
  });
});

/* ------------------------------------------------------------------
 * Rule 1 — absolute, never relative
 * ------------------------------------------------------------------ */

describe("Rule 1 — no relative time expressions", () => {
  it("stamp condition is never a relative expression", () => {
    const cases: [string, "eva" | "adam"][] = [
      ["2026-08-02T03:20:00Z", "adam"],
      ["2026-08-03T03:00:00Z", "eva"],
      ["2026-08-03T13:00:00Z", "eva"],
      ["2026-08-03T19:00:00Z", "eva"],
    ];
    for (const [leftAt, slug] of cases) {
      const stamp = stampFor(leftAt, slug);
      expect(stamp.condition).not.toMatch(RELATIVE_TIME_PATTERN);
    }
  });

  /**
   * Regression: `leftThisMorning` / `leftThisAfternoon` / `leftThisEvening`
   * / `leftEarlyMorning` used to read "left this morning" etc. — "this"
   * before a time-of-day noun implies today, which is false for an item
   * The Book resurfaces from any date (components/book/ResurfacedItem.tsx
   * renders this same stamp on year-old photographs). The guard pattern
   * must fail on the old wording and pass on the current one.
   */
  it("catches the historical 'this {part of day}' wording were it reintroduced", () => {
    const historical = [
      "left this morning",
      "left this afternoon",
      "left this evening",
      "left early this morning",
    ];
    for (const s of historical) {
      expect(s).toMatch(RELATIVE_TIME_PATTERN);
    }
  });

  it("the current time-of-day fallback strings all pass the guard", () => {
    const current: string[] = [
      STAMP_STRINGS.leftEarlyMorning,
      STAMP_STRINGS.leftThisMorning,
      STAMP_STRINGS.leftThisAfternoon,
      STAMP_STRINGS.leftThisEvening,
      STAMP_STRINGS.leftLate,
    ];
    for (const s of current) {
      expect(s).not.toMatch(RELATIVE_TIME_PATTERN);
    }
  });
});
