/**
 * The relative-time guard itself, under test.
 *
 * Every other test that imports RELATIVE_TIME_PATTERN checks it against a
 * live function's output. This file checks the pattern directly against
 * fixed strings, so the guard's own correctness never depends on the
 * source it happens to be wired into today.
 */
import { describe, expect, it } from "vitest";
import { RELATIVE_TIME_PATTERN } from "@/lib/copy-law";
import { HOW_IT_WORKS, SHELVES } from "@/lib/fixtures/suggestions";

describe("RELATIVE_TIME_PATTERN — historical breaches (must fail)", () => {
  const cases: [string, string][] = [
    ["lib/resurface.ts — date-match label", "A year ago today"],
    ["components/send/QuickSend.tsx — outbox heading", "Sent today"],
    ["components/send/QuickSend.tsx — empty state", "Nothing yet today"],
    ["lib/stamp.ts — time-of-day fallback", "left this morning"],
    ["lib/stamp.ts — time-of-day fallback", "left this afternoon"],
    ["lib/stamp.ts — time-of-day fallback", "left this evening"],
    ["lib/stamp.ts — time-of-day fallback", "left early this morning"],
    ["baseline — digit-led elapsed", "3 days ago"],
    ["baseline — digit-led elapsed", "5 hours ago"],
    ["baseline", "yesterday"],
    ["baseline", "just now"],
    ["baseline", "recently"],
  ];

  it.each(cases)("%s: %j matches", (_site, text) => {
    expect(text).toMatch(RELATIVE_TIME_PATTERN);
  });
});

describe("RELATIVE_TIME_PATTERN — category cases (must pass)", () => {
  /**
   * Four phrases, live from lib/fixtures/suggestions.ts, that name a kind
   * of moment rather than time-stamp a specific record. Sourced from the
   * real export (not copied) so a future edit to this fixture re-runs the
   * same check against whatever the string becomes.
   */
  it("HOW_IT_WORKS 't2-read-aloud-bedtime-book' step 1 does not match ('tonight' as category)", () => {
    const text = HOW_IT_WORKS["t2-read-aloud-bedtime-book"]?.[0] ?? "";
    expect(text).not.toBe(""); // fails loudly if the fixture entry moves
    expect(text).not.toMatch(RELATIVE_TIME_PATTERN);
  });

  it("HOW_IT_WORKS 't7-lunch-break-discreet-anticipation' step 1 does not match (bare 'now')", () => {
    const text = HOW_IT_WORKS["t7-lunch-break-discreet-anticipation"]?.[0] ?? "";
    expect(text).not.toBe("");
    expect(text).not.toMatch(RELATIVE_TIME_PATTERN);
  });

  it("HOW_IT_WORKS 'b1-mirrored-errand' step 3 does not match ('tonight' as category)", () => {
    const text = HOW_IT_WORKS["b1-mirrored-errand"]?.[2] ?? "";
    expect(text).not.toBe("");
    expect(text).not.toMatch(RELATIVE_TIME_PATTERN);
  });

  it("SHELVES 'zero-setup' name does not match ('right now' as category)", () => {
    const shelf = SHELVES.find((s) => s.slug === "zero-setup");
    expect(shelf).toBeDefined();
    expect(shelf!.name).not.toMatch(RELATIVE_TIME_PATTERN);
  });
});

describe("RELATIVE_TIME_PATTERN — word-boundary safety", () => {
  it("does not fire on a word that merely contains 'ago' as a substring", () => {
    // The near-miss this guards against: a naive /ago/ pattern with no
    // boundary would have flagged "imago" and words like it on sight.
    expect("Chicago").not.toMatch(RELATIVE_TIME_PATTERN);
    expect("imago").not.toMatch(RELATIVE_TIME_PATTERN);
    expect("agony").not.toMatch(RELATIVE_TIME_PATTERN);
  });

  it("does not fire on 'this hour', only on 'this' + a time-of-day noun", () => {
    expect("Left at this hour, in June").not.toMatch(RELATIVE_TIME_PATTERN);
  });
});
