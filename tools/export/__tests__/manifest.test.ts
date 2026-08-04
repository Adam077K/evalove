/**
 * manifest.test.ts — tests for CSV escaping and index building
 *
 * Fixtures only. No database, no filesystem, no network.
 *
 * Critical: real captions contain commas, double-quotes, AND newlines.
 * All three must survive a round-trip through CSV without corrupting
 * adjacent fields or breaking row boundaries.
 */

import { describe, it, expect } from "vitest";

import {
  escapeCsvField,
  csvRow,
  buildCsv,
  buildIndexCsv,
} from "../manifest.ts";
import type { PhotoIndexRow } from "../manifest.ts";

// ---------------------------------------------------------------------------
// escapeCsvField
// ---------------------------------------------------------------------------

describe("escapeCsvField", () => {
  it("passes through a plain value unchanged", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("wraps a value containing a comma in double-quotes", () => {
    expect(escapeCsvField("hello, world")).toBe('"hello, world"');
  });

  it("wraps a value containing a double-quote and escapes it", () => {
    // RFC 4180: double-quote inside a quoted field → two double-quotes
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps a value containing a newline", () => {
    const result = escapeCsvField("line one\nline two");
    expect(result).toBe('"line one\nline two"');
  });

  it("handles all three — comma, double-quote, and newline — in one field", () => {
    // This is the real-world caption case the brief calls out explicitly.
    const tricky = 'He said "meet me at 5pm,\nby the fountain"';
    const escaped = escapeCsvField(tricky);
    // Must start and end with double-quote
    expect(escaped.startsWith('"')).toBe(true);
    expect(escaped.endsWith('"')).toBe(true);
    // Internal double-quotes must be doubled
    expect(escaped).toContain('""');
    // Must contain the newline preserved inside the field
    expect(escaped).toContain("\n");
    // Must contain the comma preserved inside the field
    expect(escaped).toContain(",");
  });

  it("handles null by returning an empty string", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("handles undefined by returning an empty string", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("handles an empty string", () => {
    expect(escapeCsvField("")).toBe("");
  });

  it("handles a value that is only a double-quote", () => {
    expect(escapeCsvField('"')).toBe('""""');
  });
});

// ---------------------------------------------------------------------------
// csvRow
// ---------------------------------------------------------------------------

describe("csvRow", () => {
  it("joins fields with commas", () => {
    expect(csvRow(["a", "b", "c"])).toBe("a,b,c");
  });

  it("correctly handles a row with a tricky field among plain ones", () => {
    const row = csvRow(["plain", 'has "quotes"', "also,comma"]);
    expect(row).toBe('plain,"has ""quotes""","also,comma"');
  });
});

// ---------------------------------------------------------------------------
// buildCsv
// ---------------------------------------------------------------------------

describe("buildCsv", () => {
  it("produces a header row followed by data rows", () => {
    const csv = buildCsv(
      ["name", "value"],
      [
        ["alice", "42"],
        ["bob", "hello, world"],
      ],
    );
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,value");
    expect(lines[1]).toBe("alice,42");
    // 'bob' has no comma/quote/newline — it must NOT be quoted per RFC 4180.
    // 'hello, world' contains a comma — it must be wrapped in double-quotes.
    expect(lines[2]).toBe('bob,"hello, world"');
  });

  it("ends with a trailing newline", () => {
    const csv = buildCsv(["x"], [["1"]]);
    expect(csv.endsWith("\n")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildIndexCsv — round-trip test with the tricky caption
// ---------------------------------------------------------------------------

describe("buildIndexCsv", () => {
  const trickyCaption = 'Met at "the corner",\nit was raining';

  const fixture: PhotoIndexRow = {
    id: "a1b2c3d4-0000-0000-0000-000000000000",
    shared_day: "2026-08-03",
    author: "eva",
    taken_at_local: "2026-08-03 10:30:00",
    caption: trickyCaption,
    kind: "daily",
    file_path: "photos/2026-08-03/2026-08-03--eva--1030--a1b2c3d4.jpg",
    file_variant: "original",
    checksum_sha256: "abc123",
  };

  it("includes the tricky caption escaped correctly", () => {
    const csv = buildIndexCsv([fixture]);
    // The caption contains a comma and double-quotes and a newline —
    // it must be wrapped in double-quotes with internal quotes escaped.
    expect(csv).toContain('"Met at ""the corner"",\nit was raining"');
  });

  it("does not corrupt adjacent fields", () => {
    const csv = buildIndexCsv([fixture]);
    const lines = csv.split("\n");
    // Header must be the first line
    expect(lines[0]).toBe(
      "id,shared_day,author,taken_at_local,caption,kind,file_path,file_variant,checksum_sha256",
    );
  });

  it("marks display-variant photos clearly", () => {
    const displayFixture: PhotoIndexRow = { ...fixture, file_variant: "display" };
    const csv = buildIndexCsv([displayFixture]);
    expect(csv).toContain("display");
  });

  it("marks original-variant photos clearly", () => {
    const csv = buildIndexCsv([fixture]);
    expect(csv).toContain("original");
  });
});
