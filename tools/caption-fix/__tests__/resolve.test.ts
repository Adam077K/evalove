import { describe, expect, it } from "vitest";

import { CAPTION_CORRECTIONS_2026_08_08 } from "../candidates.ts";
import { buildCaptionPlan, validateRoster } from "../resolve.ts";
import type { CaptionCandidate } from "../candidates.ts";

describe("CAPTION_CORRECTIONS_2026_08_08 — the committed data itself", () => {
  it("contains exactly the one known live breach, 24:7:26-18.JPG", () => {
    expect(CAPTION_CORRECTIONS_2026_08_08).toHaveLength(1);
    expect(CAPTION_CORRECTIONS_2026_08_08[0]).toMatchObject({
      file: "24:7:26-18.JPG",
      checksumSha256: "dece1ae7dc20144df6d119641a1f15b05551eb60872792361a73dd637362a1c1",
      currentCaption: "Same photo as 24:7:26-4.JPG at lower resolution.",
      proposedCaption: null,
    });
  });

  it("matches the checksum tools/authorship-fix/candidates.ts already recorded for the same file", async () => {
    // Independent cross-check: two separately-written rosters, over the
    // same live database, agree on the join key for the same source file.
    const { AUTHORSHIP_ROSTER_2026_07_24 } = await import(
      "../../authorship-fix/candidates.ts"
    );
    const sibling = AUTHORSHIP_ROSTER_2026_07_24.find((c) => c.file === "24:7:26-18.JPG");
    expect(sibling).toBeDefined();
    expect(sibling!.checksumSha256).toBe(CAPTION_CORRECTIONS_2026_08_08[0]!.checksumSha256);
  });
});

describe("validateRoster", () => {
  it("passes the real, committed roster", () => {
    expect(validateRoster(CAPTION_CORRECTIONS_2026_08_08)).toEqual([]);
  });

  it("flags a row whose currentCaption is not actually machine-shaped", () => {
    const bad: CaptionCandidate[] = [
      {
        file: "fake.jpg",
        checksumSha256: "x".repeat(64),
        currentCaption: "the tomatoes at the market, obscene",
        proposedCaption: null,
        reason: "test",
      },
    ];
    const problems = validateRoster(bad);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/does not read as machine-shaped/);
  });

  it("flags a row whose proposedCaption is ITSELF machine-shaped", () => {
    const bad: CaptionCandidate[] = [
      {
        file: "fake.jpg",
        checksumSha256: "x".repeat(64),
        currentCaption: "Same photo as fake-2.jpg at lower resolution.",
        proposedCaption: "duplicate of fake-2.jpg, near-identical",
        reason: "test",
      },
    ];
    const problems = validateRoster(bad);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/proposedCaption ITSELF reads as machine-shaped/);
  });

  it("a clean, human-sounding proposedCaption passes", () => {
    const ok: CaptionCandidate[] = [
      {
        file: "fake.jpg",
        checksumSha256: "x".repeat(64),
        currentCaption: "Same photo as fake-2.jpg at lower resolution.",
        proposedCaption: "the tomatoes at the market, obscene",
        reason: "test",
      },
    ];
    expect(validateRoster(ok)).toEqual([]);
  });
});

describe("buildCaptionPlan", () => {
  it("produces one plan row per roster row, in roster order, deterministically", () => {
    const first = buildCaptionPlan(CAPTION_CORRECTIONS_2026_08_08);
    const second = buildCaptionPlan(CAPTION_CORRECTIONS_2026_08_08);
    expect(first).toEqual(second);
    expect(first.map((p) => p.file)).toEqual(
      CAPTION_CORRECTIONS_2026_08_08.map((c) => c.file),
    );
  });

  it("carries currentCaption and proposedCaption through unchanged", () => {
    const [plan] = buildCaptionPlan(CAPTION_CORRECTIONS_2026_08_08);
    const [candidate] = CAPTION_CORRECTIONS_2026_08_08;
    expect(plan!.currentCaption).toBe(candidate!.currentCaption);
    expect(plan!.proposedCaption).toBe(candidate!.proposedCaption);
  });
});
