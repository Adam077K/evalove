import { describe, expect, it } from "vitest";

import { AUTHORSHIP_ROSTER_2026_07_24 } from "../candidates.ts";
import { parseOverridesTsv, resolvePlan, stagedChanges } from "../resolve.ts";

describe("AUTHORSHIP_ROSTER_2026_07_24 — the committed data itself", () => {
  it("is exactly the 21 photographs 24 July actually has in the live archive", () => {
    // tools/book-placement/plan.ts's own real-data test: 21 pages for
    // 2026-07-24 (22 catalogued items minus the one byte-identical
    // duplicate, 24:7:26-12.HEIC, excluded upstream and never ingested).
    expect(AUTHORSHIP_ROSTER_2026_07_24).toHaveLength(21);
    expect(new Set(AUTHORSHIP_ROSTER_2026_07_24.map((c) => c.file)).size).toBe(21);
    expect(new Set(AUTHORSHIP_ROSTER_2026_07_24.map((c) => c.checksumSha256)).size).toBe(21);
  });

  it("marks exactly the 3 files that are genuinely 'of us, shooter unresolved'", () => {
    const open = AUTHORSHIP_ROSTER_2026_07_24.filter((c) => c.openQuestion);
    expect(open.map((c) => c.file).sort()).toEqual([
      "24:7:26-10.HEIC",
      "24:7:26-18.JPG",
      "24:7:26-4.JPG",
    ]);
    // Every open question is currently unsigned and pictures both of them —
    // the two facts that together define "of us, sitting unsigned".
    for (const c of open) {
      expect(c.currentAuthor).toBe("unsigned");
      expect(c.catalogPeople).toBe("both");
    }
  });

  it("never marks a 'both' photograph open once the authorship pass already resolved a shooter", () => {
    const bothButResolved = AUTHORSHIP_ROSTER_2026_07_24.filter(
      (c) => c.catalogPeople === "both" && c.currentAuthor !== "unsigned",
    );
    expect(bothButResolved.length).toBeGreaterThan(0); // sanity: this case exists in the data
    expect(bothButResolved.every((c) => !c.openQuestion)).toBe(true);
  });
});

describe("parseOverridesTsv", () => {
  it("parses file/author rows, skipping blanks, comments and the header", () => {
    const tsv = [
      "# a comment",
      "file\tauthor",
      "",
      "24:7:26-4.JPG\teva",
      "24:7:26-10.HEIC\tleave",
    ].join("\n");

    const overrides = parseOverridesTsv(tsv);

    expect(overrides.get("24:7:26-4.JPG")).toBe("eva");
    expect(overrides.get("24:7:26-10.HEIC")).toBe("leave");
    expect(overrides.size).toBe(2);
  });

  it("a row with no value is a silent no-op, not an override", () => {
    const overrides = parseOverridesTsv("24:7:26-4.JPG\t\n");
    expect(overrides.size).toBe(0);
  });

  it("throws on an author value it does not recognise, rather than guessing", () => {
    expect(() => parseOverridesTsv("24:7:26-4.JPG\tboth\n")).toThrow(/eva \/ adam \/ unsigned \/ leave/);
  });
});

describe("resolvePlan", () => {
  it("stages NOTHING for an open question with no override — the core safety property", () => {
    const plan = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, new Map());
    const changes = stagedChanges(plan);
    expect(changes).toEqual([]);
    const openInPlan = plan.filter((p) => p.source === "open-question-no-default");
    expect(openInPlan).toHaveLength(3);
    expect(openInPlan.every((p) => p.targetAuthor === null)).toBe(true);
  });

  it("an override stages exactly the requested change, and only that file", () => {
    const overrides = new Map([["24:7:26-4.JPG", "eva" as const]]);
    const plan = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, overrides);
    const changes = stagedChanges(plan);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      file: "24:7:26-4.JPG",
      currentAuthor: "unsigned",
      targetAuthor: "eva",
      source: "override",
    });
  });

  it("an explicit 'leave' override stays a no-op but is distinguishable from silence", () => {
    const overrides = new Map([["24:7:26-10.HEIC", "leave" as const]]);
    const plan = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, overrides);
    const row = plan.find((p) => p.file === "24:7:26-10.HEIC")!;

    expect(row.targetAuthor).toBeNull();
    expect(row.source).toBe("override"); // not "open-question-no-default"
    expect(row.reason).toMatch(/explicitly leave/);
    expect(stagedChanges(plan)).toEqual([]);
  });

  it("overriding an already-resolved file can still correct it by hand", () => {
    // 24:7:26-3.HEIC is already `adam`, not open — but the founder can
    // still name it to flip it, e.g. if he disagrees with the pass.
    const overrides = new Map([["24:7:26-3.HEIC", "eva" as const]]);
    const plan = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, overrides);
    const changes = stagedChanges(plan);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ file: "24:7:26-3.HEIC", targetAuthor: "eva" });
  });

  it("produces one plan row per roster row, in roster order, deterministically", () => {
    const first = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, new Map());
    const second = resolvePlan(AUTHORSHIP_ROSTER_2026_07_24, new Map());
    expect(first).toEqual(second);
    expect(first.map((p) => p.file)).toEqual(AUTHORSHIP_ROSTER_2026_07_24.map((c) => c.file));
  });
});
