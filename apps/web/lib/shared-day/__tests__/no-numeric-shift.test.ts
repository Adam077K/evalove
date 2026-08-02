/**
 * Golden 8 — a source-level assertion that no numeric-shift arithmetic exists
 * in this module.
 *
 * The rejected model anchored the shared day at a fixed instant. Resurrecting
 * it does not look like a redesign — it looks like one line: a `- interval '8
 * hours'`, a `+ 7 * 60 * 60 * 1000`, a `'+03:00'` slipped into a config. This
 * test reads the module's own source and refuses all of them.
 *
 * It also enforces the two structural rules the module was given: `Intl` only
 * (no timezone library), and zero runtime dependencies.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const MODULE_DIR = fileURLToPath(new URL("..", import.meta.url));

function moduleSources(): { file: string; text: string }[] {
  return readdirSync(MODULE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => ({
      file: entry.name,
      text: readFileSync(join(MODULE_DIR, entry.name), "utf8"),
    }));
}

interface Rule {
  name: string;
  pattern: RegExp;
}

/**
 * Every one of these is a way the fixed-anchor model has come back before, or
 * a way the host machine's own clock leaks into a zone calculation.
 */
const FORBIDDEN: readonly Rule[] = [
  {
    name: "a numeric UTC shift written as a string literal, e.g. '+03:00'",
    pattern: /(['"`])\s*[+-]\d{1,2}:?\d{2}\s*\1/,
  },
  { name: "UTC+n / GMT-n", pattern: /(?:UTC|GMT)\s*[+-]\s*\d/i },
  { name: "a fixed-shift Etc zone, e.g. Etc/GMT+2", pattern: /Etc\/GMT\s*[+-]?\s*\d/ },
  { name: "the word 'offset' — this module never computes one", pattern: /offset/i },
  { name: "the host clock via Date#getHours and friends", pattern: /\.get(?:Hours|Minutes|Seconds|Date|Day|Month|FullYear)\s*\(/ },
  { name: "the host clock via Date#setHours and friends", pattern: /\.set(?:Hours|Minutes|Seconds|Date|Month|FullYear)\s*\(/ },
  { name: "setUTCHours — an anchor in disguise", pattern: /\bsetUTC[A-Za-z]*\s*\(/ },
  { name: "six, seven or eight hours in seconds", pattern: /\b[678]\s*\*\s*3_?600\b/ },
  { name: "six, seven or eight hours as 60*60", pattern: /\b[678]\s*\*\s*60\s*\*\s*60\b/ },
  { name: "six, seven or eight of an hour constant", pattern: /\b[678]\s*\*\s*[A-Z_]*HOUR[A-Z_]*\b/ },
  { name: "six, seven or eight hours in milliseconds", pattern: /\b(?:21_?600_?000|25_?200_?000|28_?800_?000)\b/ },
  { name: "SQL interval arithmetic", pattern: /\binterval\s*['"`]/i },
  { name: "the rejected 08:00 anchor", pattern: /(['"`])[^'"`]*\b08:00\b[^'"`]*\1/ },
  { name: "a timezone library", pattern: /\b(?:luxon|moment(?:-timezone)?|dayjs|date-fns(?:-tz)?|js-joda|spacetime|timezone-support|temporal-polyfill|@js-temporal)\b/ },
];

describe("golden 8 — no numeric-shift arithmetic in the module", () => {
  it("finds the module source to scan", () => {
    const sources = moduleSources();
    expect(sources.length).toBeGreaterThanOrEqual(6);
    expect(sources.map((s) => s.file)).toContain("index.ts");
  });

  for (const rule of FORBIDDEN) {
    it(`rejects ${rule.name}`, () => {
      const hits: string[] = [];
      for (const { file, text } of moduleSources()) {
        text.split("\n").forEach((line, i) => {
          if (rule.pattern.test(line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
        });
      }
      expect(hits).toEqual([]);
    });
  }

  it("has zero runtime dependencies — every import is relative", () => {
    const nonRelative: string[] = [];
    const importFrom = /\bfrom\s+(['"])([^'"]+)\1/g;

    for (const { file, text } of moduleSources()) {
      for (const match of text.matchAll(importFrom)) {
        const specifier = match[2];
        if (specifier !== undefined && !specifier.startsWith(".")) {
          nonRelative.push(`${file}: ${specifier}`);
        }
      }
    }

    expect(nonRelative).toEqual([]);
  });

  it("names every zone as a plain IANA identifier", () => {
    const bad: string[] = [];
    const quoted = /(['"])((?:(?!\1)[^\\])*)\1/g;
    const looksLikeAPath = /\//;
    const ianaId = /^[A-Za-z][A-Za-z_]*(?:\/[A-Za-z][A-Za-z_-]*)+$/;

    for (const { file, text } of moduleSources()) {
      for (const match of text.matchAll(quoted)) {
        const value = match[2];
        if (value === undefined || !looksLikeAPath.test(value)) continue;
        // Relative import specifiers are the only other slash-bearing strings.
        if (value.startsWith(".")) continue;
        if (!ianaId.test(value)) bad.push(`${file}: ${value}`);
      }
    }

    expect(bad).toEqual([]);
  });

  it("does its zone work with Intl", () => {
    const usesIntl = moduleSources().some(({ text }) => /\bIntl\./.test(text));
    expect(usesIntl).toBe(true);
  });
});
