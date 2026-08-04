/**
 * layout.test.ts — tests for the pure layout/path functions
 *
 * Fixtures only. No database, no filesystem reads, no network.
 */

import { describe, it, expect } from "vitest";

import {
  toHHMM,
  shortId,
  buildPhotoFilename,
  buildPhotoRelativePath,
  buildVaultRelativePath,
} from "../layout.ts";

describe("toHHMM", () => {
  it("returns the correct HHMM in the given timezone", () => {
    // 2026-08-03T14:30:00Z in America/New_York is 10:30 (UTC-4 in summer)
    expect(toHHMM("2026-08-03T14:30:00Z", "America/New_York")).toBe("1030");
  });

  it("returns the correct HHMM for Asia/Jerusalem", () => {
    // 2026-08-03T07:00:00Z in Asia/Jerusalem is 10:00 (UTC+3 in summer)
    expect(toHHMM("2026-08-03T07:00:00Z", "Asia/Jerusalem")).toBe("1000");
  });

  it("returns 0000 for null timestamp", () => {
    expect(toHHMM(null, "America/New_York")).toBe("0000");
  });

  it("returns 0000 for an unparseable timestamp", () => {
    expect(toHHMM("not-a-date", "America/New_York")).toBe("0000");
  });

  it("handles midnight correctly (no '24' output)", () => {
    // 2026-08-04T04:00:00Z is 00:00 in America/New_York (UTC-4)
    const result = toHHMM("2026-08-04T04:00:00Z", "America/New_York");
    // Must be '0000', never '2400'
    expect(result).toBe("0000");
    expect(result).not.toBe("2400");
  });

  it("zero-pads single-digit hours and minutes", () => {
    // 2026-08-03T03:05:00Z in America/New_York is 23:05 previous day...
    // Use a known simple case: 01:05 local
    // 2026-08-03T05:05:00Z in America/New_York is 01:05 (UTC-4)
    expect(toHHMM("2026-08-03T05:05:00Z", "America/New_York")).toBe("0105");
  });
});

describe("shortId", () => {
  it("returns the first 8 hex characters stripping dashes", () => {
    expect(shortId("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe("a1b2c3d4");
  });

  it("handles a uuid without dashes", () => {
    expect(shortId("a1b2c3d4e5f67890abcdef1234567890")).toBe("a1b2c3d4");
  });
});

describe("buildPhotoFilename", () => {
  it("produces the correct filename shape", () => {
    const name = buildPhotoFilename(
      "2026-08-03",          // shared_day
      "eva",                 // author slug
      "2026-08-03T14:30:00Z", // taken_at
      "2026-08-03T14:31:00Z", // created_at (fallback, not used when taken_at is present)
      "America/New_York",   // member timezone
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // photo id
    );
    // In America/New_York, 14:30 UTC is 10:30 local (UTC-4 in summer)
    expect(name).toBe("2026-08-03--eva--1030--a1b2c3d4.jpg");
  });

  it("uses created_at when taken_at is null", () => {
    const name = buildPhotoFilename(
      "2026-08-03",
      "adam",
      null, // no taken_at
      "2026-08-03T07:00:00Z",
      "Asia/Jerusalem",
      "feedbeef-0000-0000-0000-000000000000",
    );
    // 07:00 UTC = 10:00 in Asia/Jerusalem (UTC+3 summer)
    expect(name).toBe("2026-08-03--adam--1000--feedbeef.jpg");
  });

  it("produces filenames with eva or adam, never a or b", () => {
    const evaName = buildPhotoFilename(
      "2026-01-01", "eva", null, "2026-01-01T00:00:00Z", "UTC", "aaaaaaaa-0000-0000-0000-000000000000",
    );
    const adamName = buildPhotoFilename(
      "2026-01-01", "adam", null, "2026-01-01T00:00:00Z", "UTC", "bbbbbbbb-0000-0000-0000-000000000000",
    );
    expect(evaName).toContain("--eva--");
    expect(adamName).toContain("--adam--");
    // Crucially: never 'a' or 'b' as the author segment
    expect(evaName).not.toMatch(/--a--/);
    expect(adamName).not.toMatch(/--b--/);
  });
});

describe("buildPhotoRelativePath", () => {
  it("places photos under photos/YYYY-MM-DD/", () => {
    const rel = buildPhotoRelativePath(
      "2026-08-03",
      "2026-08-03--eva--1030--a1b2c3d4.jpg",
    );
    // path.join normalises separators
    expect(rel.replace(/\\/g, "/")).toBe("photos/2026-08-03/2026-08-03--eva--1030--a1b2c3d4.jpg");
  });
});

describe("buildVaultRelativePath", () => {
  it("places vault items under private/, never under photos/", () => {
    const rel = buildVaultRelativePath(
      "2026-08-03",
      "2026-08-03--eva--1030--a1b2c3d4.jpg",
    );
    const normalised = rel.replace(/\\/g, "/");
    expect(normalised).toContain("private/");
    expect(normalised).not.toContain("photos/");
  });
});
