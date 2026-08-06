/**
 * The thin-window empty state used to lowercase the whole window
 * string, which took the two names down with it — "eva's just off
 * work, adam's fading". The law never lowercases either name.
 * `midSentence` is the fix: lowercase for grammatical flow, then
 * restore "Eva"/"Adam" specifically. Table-driven over every real
 * `WINDOW_STRINGS` entry so a ninth window added later gets checked
 * automatically rather than by remembering to add a case.
 */
import { describe, expect, it } from "vitest";

import { WINDOW_STRINGS } from "@/lib/fixtures/members";
import { midSentence } from "../DatesExplorer";

describe("midSentence", () => {
  const expected: Record<string, string> = {
    w1: "Eva’s in bed, Adam’s awake",
    w2: "Eva’s up early",
    w3: "Eva’s commute",
    w4: "Eva’s lunch break",
    // The exact founder-facing sentence from the reported bug.
    w5: "Eva’s just off work, Adam’s fading",
    w6: "worth staying up for",
    w7: "saturday — Eva and Adam both off",
    w8: "Eva’s at work, Adam’s day is free",
    w9: "Eva’s day is free, Adam’s at work",
  };

  it.each(Object.keys(WINDOW_STRINGS))(
    "keeps Eva/Adam capitalized and lowercases the rest of %s",
    (id) => {
      expect(midSentence(WINDOW_STRINGS[id] ?? "")).toBe(expected[id]);
    },
  );

  it("covers every id WINDOW_STRINGS actually has", () => {
    expect(Object.keys(WINDOW_STRINGS).sort()).toEqual(
      Object.keys(expected).sort(),
    );
  });

  it("restores names regardless of the case they arrive in", () => {
    expect(midSentence("EVA is loud, ADAM is quiet")).toBe(
      "Eva is loud, Adam is quiet",
    );
  });

  it("never leaves a lowercase eva or adam in its output", () => {
    for (const id of Object.keys(WINDOW_STRINGS)) {
      const out = midSentence(WINDOW_STRINGS[id] ?? "");
      expect(out).not.toMatch(/\beva\b/);
      expect(out).not.toMatch(/\badam\b/);
    }
  });
});
