/**
 * plan.ts — `resolveAuthor` / `buildPlan`: the precedence between the
 * founder's manual override (authorship.tsv) and the automatic
 * authorship-pass verdict, and the video/no-display-derivative skips that
 * predate this change. Imported from `plan.ts`, not `load.ts` — `load.ts`
 * transitively imports `db.ts`, which imports `@supabase/supabase-js`; see
 * `plan.ts`'s own header for why this suite deliberately avoids that.
 */
import { describe, expect, it } from "vitest";
import { buildPlan, resolveAuthor } from "../plan";
import type { AuthorshipCorrection } from "../manifest";
import type { Verdict } from "../verdicts";
import type { ManifestItem } from "../manifest";

function manualOverride(author: AuthorshipCorrection["author"]): Map<string, AuthorshipCorrection> {
  return new Map([["a.jpg", { author }]]);
}

function verdict(shooter: Verdict["shooter"]): Map<string, Verdict> {
  return new Map([
    ["a.jpg", { file: "a.jpg", shooter, confidence: "high", evidence: "test" }],
  ]);
}

const NO_OVERRIDE = new Map<string, AuthorshipCorrection>();
const NO_VERDICT = new Map<string, Verdict>();

describe("resolveAuthor — precedence", () => {
  it("a verdict alone resolves via the founder's mapping", () => {
    expect(resolveAuthor("a.jpg", NO_OVERRIDE, verdict("person_a"))).toEqual({
      author: "adam",
      source: "verdicts_pass",
    });
    expect(resolveAuthor("a.jpg", NO_OVERRIDE, verdict("person_b"))).toEqual({
      author: "eva",
      source: "verdicts_pass",
    });
    expect(resolveAuthor("a.jpg", NO_OVERRIDE, verdict("cannot_tell"))).toEqual({
      author: "unsigned",
      source: "verdicts_pass",
    });
    expect(resolveAuthor("a.jpg", NO_OVERRIDE, verdict("third_party"))).toEqual({
      author: "unsigned",
      source: "verdicts_pass",
    });
  });

  it("a manual override wins over a verdict for the same file", () => {
    // Verdict says adam; the founder corrected it to eva.
    expect(resolveAuthor("a.jpg", manualOverride("eva"), verdict("person_a"))).toEqual({
      author: "eva",
      source: "manual_override",
    });
  });

  it("a manual override can move a verdict TO unsigned", () => {
    expect(resolveAuthor("a.jpg", manualOverride("unsigned"), verdict("person_a"))).toEqual({
      author: "unsigned",
      source: "manual_override",
    });
  });

  it("a manual override can move a verdict AWAY FROM unsigned", () => {
    expect(resolveAuthor("a.jpg", manualOverride("adam"), verdict("cannot_tell"))).toEqual({
      author: "adam",
      source: "manual_override",
    });
  });

  it("a blank correction (author: null) does not override — the verdict still decides", () => {
    expect(resolveAuthor("a.jpg", manualOverride(null), verdict("person_a"))).toEqual({
      author: "adam",
      source: "verdicts_pass",
    });
  });

  it("neither a verdict nor an override resolves to null — unresolved, skipped upstream", () => {
    expect(resolveAuthor("a.jpg", NO_OVERRIDE, NO_VERDICT)).toBeNull();
  });
});

function manifestItem(overrides: Partial<ManifestItem> = {}): ManifestItem {
  return {
    file: "a.jpg",
    isoDate: "2026-07-24",
    kind: "image",
    captionSeed: "",
    catalogPeople: "",
    catalogLikelyShooter: "",
    derivatives: { display: { path: "/tmp/a-display.jpg", width: 10, height: 10, bytes: 1, checksumSha256: "x" } },
    sourceHadExif: false,
    sourceHadGps: false,
    verifiedClean: true,
    author: null,
    ...overrides,
  };
}

describe("buildPlan", () => {
  it("commits an item resolved by the verdicts pass, tagging its source", () => {
    const [plan] = buildPlan([manifestItem()], NO_OVERRIDE, verdict("person_b"));
    expect(plan).toMatchObject({ action: "commit", author: "eva", source: "verdicts_pass" });
  });

  it("commits an unsigned item for a cannot_tell verdict", () => {
    const [plan] = buildPlan([manifestItem()], NO_OVERRIDE, verdict("cannot_tell"));
    expect(plan).toMatchObject({ action: "commit", author: "unsigned" });
  });

  it("skips an item with neither a verdict nor an override", () => {
    const [plan] = buildPlan([manifestItem()], NO_OVERRIDE, NO_VERDICT);
    expect(plan).toMatchObject({ action: "skip", reason: expect.stringContaining("no verdicts-pass row") });
  });

  it("still skips a video item outright, regardless of any verdict", () => {
    const [plan] = buildPlan(
      [manifestItem({ kind: "video" })],
      NO_OVERRIDE,
      verdict("person_a"),
    );
    expect(plan).toMatchObject({ action: "skip", reason: expect.stringContaining("video") });
  });

  it("still skips an item with no display derivative", () => {
    const [plan] = buildPlan(
      [manifestItem({ derivatives: {} })],
      NO_OVERRIDE,
      verdict("person_a"),
    );
    expect(plan).toMatchObject({ action: "skip", reason: expect.stringContaining("no display derivative") });
  });
});
