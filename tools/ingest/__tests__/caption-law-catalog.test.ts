/**
 * The catalogue-wide sweep — this is the ingest pipeline's equivalent of
 * `apps/web/lib/__tests__/copy-law-tree.test.ts`: that file walks every
 * string/template literal under app/, components/, lib/ and asserts none of
 * them match the relative-time pattern. There is no source tree to walk
 * here — the analogous risk lives in DATA, the three vision-pass
 * catalogues checked into `tools/ingest/catalog/` — so this walks THAT
 * instead: every one of the 52 real `caption_seed` values, run through the
 * same `resolveCaptionSeed` that `prepare.ts` calls for real, asserting
 * none of the results reads as an internal/technical note.
 *
 * This is deliberately checked against the REAL, committed catalogue files
 * (`loadCatalog()`, no fixture data) — the same reason
 * copy-law-tree.test.ts walks the real source tree rather than a synthetic
 * sample: a guard that only ever sees fixtures the author already knows
 * are safe cannot catch a live breach, which is exactly how "Same photo as
 * 24:7:26-4.JPG at lower resolution." reached the Book in the first place.
 */
import { describe, expect, it } from "vitest";
import { loadCatalog } from "../catalog.ts";
import { resolveCaptionSeed } from "../manifest.ts";
import { MACHINE_SHAPED_CAPTION_PATTERN } from "@/lib/caption-law.ts";

const catalog = loadCatalog();

describe("the real ingest catalogue, resolved through resolveCaptionSeed", () => {
  it("loaded a non-trivial number of catalogue entries (canary against a loader regression)", () => {
    expect(catalog.size).toBeGreaterThan(40);
  });

  it("contains the known breach entry with its original, machine-shaped caption_seed still intact — the catalogue is a historical record and is not edited", () => {
    const entry = catalog.get("24:7:26-18.JPG");
    expect(entry).toBeDefined();
    expect(entry!.caption_seed).toBe("Same photo as 24:7:26-4.JPG at lower resolution.");
    // Proves the fixture below is testing something real, not a strawman:
    // the raw catalogue value DOES match the guard pattern.
    expect(entry!.caption_seed).toMatch(MACHINE_SHAPED_CAPTION_PATTERN);
  });

  it("resolveCaptionSeed neutralises the known breach entry to an empty caption", () => {
    const entry = catalog.get("24:7:26-18.JPG");
    expect(resolveCaptionSeed(entry)).toBe("");
  });

  it("no resolved caption_seed, across the whole catalogue, reads as machine-shaped — the actual regression guard", () => {
    const offenders: { file: string; captionSeed: string }[] = [];
    for (const entry of catalog.values()) {
      const resolved = resolveCaptionSeed(entry);
      if (resolved !== "" && MACHINE_SHAPED_CAPTION_PATTERN.test(resolved)) {
        offenders.push({ file: entry.file, captionSeed: resolved });
      }
    }
    expect(offenders).toEqual([]);
  });
});
