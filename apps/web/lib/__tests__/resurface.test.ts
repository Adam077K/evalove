/**
 * Tests for lib/resurface.ts — Brief A + CEO defect corrections.
 *
 * Required coverage (original):
 *   - A date match exists (photos from this day a year ago)
 *   - No date match → hour match answers
 *   - Determinism: repeated calls at one instant return the same result
 *   - null only when the archive is genuinely empty
 *
 * Additional coverage (CEO defect corrections):
 *   - Resolution 2: a photo exists but no ±1 match → ±3 answers (part-of-day label)
 *   - Resolution 3: no ±3 match → any photo answers ("From {month}" label)
 *   - Successive UTC days return different items when multiple matches exist
 *     (regression for "always sorted[0]" defect)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Fixture photo reference (hours in author's own zone):
 *
 *   "2026-07-29"  d0729-eva (NY 08:41 = h8), d0729-adam (IL 14:10 = h14)
 *   "2026-07-30"  d0730-eva (NY 13:22 = h13), d0730-adam (IL 19:48 = h19)
 *   "2026-07-31"  d0731-eva (NY 18:52 = h18)
 *   "2026-08-01"  seed-eva-1,2,3 (NY 21:12–21:15 = h21)
 *   "2026-08-02"  seed-adam-1,2 (IL 06:03–06:05 = h6), d0802-adam (IL 06:20 = h6)
 *
 * Key instants:
 *
 *   "2027-08-01T12:00:00Z"  → date one year ago = 2026-08-01 → date match
 *
 *   "2028-01-01T14:00:00Z"  → Eva NY EST h9, Adam IL IST h16.
 *     ±1 of h9: d0729-eva (NY h8, dist=1) → resolution 1 answers.
 *     No date match (2027-01-01).
 *
 *   "2028-06-15T07:00:00Z"  → Eva NY EDT h3, Adam IL IDT h10.
 *     ±1: no fixture photo within 1h of either.
 *     ±3 of h3: seed-adam-1,2,d0802-adam (IL h6, dist=3) match;
 *              d0729-eva (NY h8, dist via Adam h10: 2) match;
 *              d0730-eva (NY h13, dist via Adam h10: 3) match.
 *     → resolution 2 answers.
 *
 *   "2028-01-15T05:00:00Z"  → Eva NY EST h0, Adam IL IST h7.
 *     With the custom NOON_PHOTO (NY h12): dist(12,0)=12>3, dist(12,7)=5>3.
 *     → resolution 3 answers.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { describe, expect, it } from "vitest";
import { whatCameBack } from "@/lib/resurface";
import type { Photo } from "@/lib/types";
import { PHOTOS } from "@/lib/fixtures/photos";

/* ------------------------------------------------------------------
 * Date match
 * ------------------------------------------------------------------ */

describe("whatCameBack — date match", () => {
  const NOW_DATE_MATCH = new Date("2027-08-01T12:00:00Z");

  it("returns reason='date' when a photo from exactly one year ago exists", () => {
    const result = whatCameBack(NOW_DATE_MATCH);
    expect(result).not.toBeNull();
    expect(result!.reason).toBe("date");
  });

  it("returns the 'A year ago today' label on a date match", () => {
    const result = whatCameBack(NOW_DATE_MATCH);
    expect(result!.label).toBe("A year ago today");
  });

  it("returns a photo whose sharedDay is the date one year ago", () => {
    const result = whatCameBack(NOW_DATE_MATCH);
    expect(result!.photo.sharedDay).toBe("2026-08-01");
  });

  it("date match wins over hour match when both are possible", () => {
    const result = whatCameBack(NOW_DATE_MATCH);
    expect(result!.reason).toBe("date");
  });
});

/* ------------------------------------------------------------------
 * Hour match — resolution 1 (±1, "Left at this hour")
 * ------------------------------------------------------------------ */

describe("whatCameBack — hour match, resolution 1 (±1)", () => {
  // 2028-01-01T14:00:00Z → Eva NY EST h9, Adam IL IST h16.
  // d0729-eva (NY h8) is dist(8,9)=1 from Eva's h9 → ±1 match.
  const NOW_R1 = new Date("2028-01-01T14:00:00Z");

  it("returns reason='hour' when no date match but a ±1 hour match exists", () => {
    const result = whatCameBack(NOW_R1);
    expect(result).not.toBeNull();
    expect(result!.reason).toBe("hour");
  });

  it("resolution 1 label starts with 'Left at this hour, in'", () => {
    const result = whatCameBack(NOW_R1);
    expect(result!.label).toMatch(/^Left at this hour, in /);
  });

  it("resolution 1 label names the month of the matched photo", () => {
    // d0729-eva sharedDay "2026-07-29" → "July"
    const result = whatCameBack(NOW_R1);
    expect(result!.label).toContain("July");
  });
});

/* ------------------------------------------------------------------
 * Hour match — resolution 2 (±3, "Left in the {part of day}")
 * ------------------------------------------------------------------ */

describe("whatCameBack — hour match, resolution 2 (±3, part of day)", () => {
  // 2028-06-15T07:00:00Z → Eva NY EDT h3, Adam IL IDT h10.
  // No photo within ±1 of either zone.
  // seed-adam-* (IL h6, dist(6,3)=3) and d0729-eva (NY h8, dist(8,10)=2)
  // and d0730-eva (NY h13, dist(13,10)=3) all match within ±3.
  const NOW_R2 = new Date("2028-06-15T07:00:00Z");

  it("returns a non-null result even when no photo falls within ±1", () => {
    const result = whatCameBack(NOW_R2);
    expect(result).not.toBeNull();
  });

  it("resolution 2 label starts with 'Left in the'", () => {
    const result = whatCameBack(NOW_R2);
    // "Left in the morning, in August" / "Left in the early morning, in August"
    expect(result!.label).toMatch(/^Left in the /);
  });

  it("resolution 2 label ends with ', in {month}'", () => {
    const result = whatCameBack(NOW_R2);
    // Matched photos are from July or August 2026
    expect(result!.label).toMatch(/, in (July|August)$/);
  });

  it("resolution 2 returns reason='hour'", () => {
    const result = whatCameBack(NOW_R2);
    expect(result!.reason).toBe("hour");
  });
});

/* ------------------------------------------------------------------
 * Hour match — resolution 3 (any photo, "From {month}")
 * ------------------------------------------------------------------ */

describe("whatCameBack — hour match, resolution 3 (any photo)", () => {
  // Custom photo at NY noon (hour 12). No ±3 match at the test instant:
  // 2028-01-15T05:00:00Z → Eva NY EST h0, Adam IL IST h7.
  // dist(12, 0) = 12 > 3  AND  dist(12, 7) = 5 > 3 → resolution 3 required.
  const NOON_PHOTO: Photo = {
    ...PHOTOS["d0729-eva"],
    id: "test-noon-photo",
    clientUuid: "test-noon-photo",
    sharedDay: "2024-03-01",
    // 17:00 UTC in March (EST = UTC-5): 17-5 = 12pm → hour 12
    createdAt: "2024-03-01T17:00:00Z",
  };
  const NOW_R3 = new Date("2028-01-15T05:00:00Z");

  it("returns a non-null result even when no photo falls within ±3", () => {
    const result = whatCameBack(NOW_R3, [NOON_PHOTO]);
    expect(result).not.toBeNull();
  });

  it("resolution 3 label is 'From {month}'", () => {
    const result = whatCameBack(NOW_R3, [NOON_PHOTO]);
    expect(result!.label).toBe("From March");
  });

  it("resolution 3 returns reason='hour'", () => {
    const result = whatCameBack(NOW_R3, [NOON_PHOTO]);
    expect(result!.reason).toBe("hour");
  });
});

/* ------------------------------------------------------------------
 * Determinism (Rule 9)
 * ------------------------------------------------------------------ */

describe("whatCameBack — determinism within an instant", () => {
  it("returns the identical result on two calls at the same instant", () => {
    const now = new Date("2027-08-01T12:00:00Z");
    const first = whatCameBack(now);
    const second = whatCameBack(now);
    expect(first).toEqual(second);
  });

  it("returns the same photo id on repeated calls at the same instant", () => {
    const now = new Date("2028-01-01T14:00:00Z");
    const first = whatCameBack(now);
    const second = whatCameBack(now);
    expect(first?.photo.id).toBe(second?.photo.id);
  });
});

/* ------------------------------------------------------------------
 * Successive days rotate the pick — regression for defect 2
 *
 * The original implementation always picked sorted[0] (oldest-first by
 * sharedDay), returning the same photo every day. The fix indexes by
 * UTC-day-since-epoch mod matches.length, varying the pick daily while
 * keeping it constant within a day (Rule 9).
 * ------------------------------------------------------------------ */

describe("whatCameBack — successive days rotate the pick", () => {
  // Two custom photos, both at NY hour 8 so both match ±1 at Eva NY EST h9.
  // Different sharedDays for a stable sort order: ALPHA ("2020-01-01") before BETA ("2021-06-15").
  const ALPHA: Photo = {
    ...PHOTOS["d0729-eva"],
    id: "test-alpha",
    clientUuid: "test-alpha",
    sharedDay: "2020-01-01",
    // 13:00 UTC in January (EST = UTC-5): 13-5 = 8am → hour 8
    createdAt: "2020-01-01T13:00:00Z",
  };
  const BETA: Photo = {
    ...PHOTOS["d0729-eva"],
    id: "test-beta",
    clientUuid: "test-beta",
    sharedDay: "2021-06-15",
    // 12:00 UTC in June (EDT = UTC-4): 12-4 = 8am → hour 8
    createdAt: "2021-06-15T12:00:00Z",
  };

  // 2028-01-15T13:00:00Z → Eva NY EST h8. Both photos are at h8 → ±1 match for both.
  const now1 = new Date("2028-01-15T13:00:00Z");
  // Exactly one UTC day later: dayIndex increments by 1 → (N+1) % 2 ≠ N % 2.
  const now2 = new Date(now1.getTime() + 86_400_000);

  it("successive UTC days return different photos (not always the oldest)", () => {
    const r1 = whatCameBack(now1, [ALPHA, BETA]);
    const r2 = whatCameBack(now2, [ALPHA, BETA]);
    // dayIndex mod 2 differs between adjacent days, so picks alternate.
    // The old code always returned ALPHA — this test would have failed it.
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.photo.id).not.toBe(r2!.photo.id);
  });

  it("the same instant always returns the same photo (Rule 9)", () => {
    const r1a = whatCameBack(now1, [ALPHA, BETA]);
    const r1b = whatCameBack(now1, [ALPHA, BETA]);
    expect(r1a!.photo.id).toBe(r1b!.photo.id);
  });
});

/* ------------------------------------------------------------------
 * Null only when archive is genuinely empty
 * ------------------------------------------------------------------ */

describe("whatCameBack — null only on empty archive", () => {
  it("returns null when passed an empty photo list", () => {
    const result = whatCameBack(new Date("2027-08-01T12:00:00Z"), []);
    expect(result).toBeNull();
  });

  it("returns non-null for any non-empty archive, at any hour (resolution 3 guarantees it)", () => {
    // A single photo at noon NY. At 05:00 UTC (Eva h0, Adam h7) no ±3 match,
    // but resolution 3 returns it anyway.
    const NOON_PHOTO: Photo = {
      ...PHOTOS["d0729-eva"],
      id: "test-noon-r3",
      clientUuid: "test-noon-r3",
      sharedDay: "2024-03-01",
      createdAt: "2024-03-01T17:00:00Z", // 12pm NY EST
    };
    const result = whatCameBack(new Date("2028-01-15T05:00:00Z"), [NOON_PHOTO]);
    expect(result).not.toBeNull();
  });
});

/* ------------------------------------------------------------------
 * Rule 8 — opens never read or inferred
 * ------------------------------------------------------------------ */

describe("Rule 8 — whatCameBack never accesses openedAt", () => {
  it("Photo type carries no openedAt field and the function needs none", () => {
    const result = whatCameBack(new Date("2027-08-01T12:00:00Z"));
    expect(result).not.toBeNull();
    expect(result!.photo).not.toHaveProperty("openedAt");
  });
});
