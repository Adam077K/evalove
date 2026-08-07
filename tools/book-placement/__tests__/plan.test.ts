import { describe, expect, it } from "vitest";
import { planPlacement, VIDEO_SKIP_REASON } from "../plan.ts";
import type { SourceItem } from "../source.ts";
import { loadSourceItems } from "../source.ts";

function item(overrides: Partial<SourceItem> & Pick<SourceItem, "file" | "isoDate">): SourceItem {
  return {
    kind: "image",
    checksumSha256: `checksum-${overrides.file}`,
    captionSeed: null,
    subject: null,
    setting: null,
    timeOfDay: null,
    mood: null,
    quality: null,
    notes: null,
    ...overrides,
  };
}

describe("planPlacement — determinism", () => {
  it("produces byte-identical output on repeated calls with the same input", () => {
    const items = [
      item({ file: "b.jpg", isoDate: "2026-07-24", timeOfDay: "night" }),
      item({ file: "a.jpg", isoDate: "2026-07-24", timeOfDay: "daytime" }),
      item({ file: "c.jpg", isoDate: "2026-07-25", timeOfDay: "sunset" }),
    ];

    const first = planPlacement(items);
    const second = planPlacement(items);

    expect(second).toEqual(first);
  });

  it("produces the same output regardless of input array order — no reliance on array index", () => {
    const items = [
      item({ file: "a.jpg", isoDate: "2026-07-24", timeOfDay: "daytime" }),
      item({ file: "b.jpg", isoDate: "2026-07-24", timeOfDay: "night" }),
      item({ file: "c.jpg", isoDate: "2026-07-25", timeOfDay: "sunset" }),
    ];
    const shuffled = [items[2]!, items[0]!, items[1]!];

    const fromOriginal = planPlacement(items);
    const fromShuffled = planPlacement(shuffled);

    expect(fromShuffled).toEqual(fromOriginal);
  });

  it("never calls Math.random or Date.now — re-running never re-rolls a page", () => {
    // A spy that throws makes any hidden non-determinism a hard test
    // failure instead of a silent flake, per Design Law §4's "the seed
    // must be the item's stable [key], never re-rolled" rule.
    const randomSpy = () => {
      throw new Error("planPlacement must never call Math.random()");
    };
    const nowSpy = () => {
      throw new Error("planPlacement must never call Date.now()");
    };
    const originalRandom = Math.random;
    const originalNow = Date.now;
    Math.random = randomSpy;
    Date.now = nowSpy;
    try {
      planPlacement([
        item({ file: "a.jpg", isoDate: "2026-07-24" }),
        item({ file: "b.mov", isoDate: "2026-07-24", kind: "video", checksumSha256: null }),
      ]);
    } finally {
      Math.random = originalRandom;
      Date.now = originalNow;
    }
  });
});

describe("planPlacement — every item accounted for, none silently dropped", () => {
  it("every input item is either a planned page or an explicitly reported skip — never neither, never both", () => {
    const items = [
      item({ file: "a.jpg", isoDate: "2026-07-24" }),
      item({ file: "b.heic", isoDate: "2026-07-24" }),
      item({ file: "c.mov", isoDate: "2026-07-25", kind: "video", checksumSha256: null }),
      item({ file: "d.jpg", isoDate: "2026-07-26" }),
    ];

    const { pages, skipped } = planPlacement(items);

    expect(pages.length + skipped.length).toBe(items.length);
    const placedFiles = new Set(pages.map((p) => p.file));
    const skippedFiles = new Set(skipped.map((s) => s.file));
    expect(placedFiles.size + skippedFiles.size).toBe(items.length); // no overlap, no gap
    for (const it of items) {
      expect(placedFiles.has(it.file) || skippedFiles.has(it.file)).toBe(true);
    }
  });

  it("skips every video with the schema-gap reason, and only videos", () => {
    const items = [
      item({ file: "a.jpg", isoDate: "2026-07-24" }),
      item({ file: "b.mov", isoDate: "2026-07-24", kind: "video", checksumSha256: null }),
      item({ file: "c.mp4", isoDate: "2026-07-25", kind: "video", checksumSha256: null }),
    ];

    const { pages, skipped } = planPlacement(items);

    expect(pages.map((p) => p.file)).toEqual(["a.jpg"]);
    expect(skipped).toHaveLength(2);
    expect(skipped.every((s) => s.reason === VIDEO_SKIP_REASON)).toBe(true);
  });

  it("never drops or skips an image for any reason — no quality filtering", () => {
    // The founder's explicit instruction: no curation, no quality
    // filtering. A "weak" or duplicate-flagged image still gets a page.
    const items = [
      item({ file: "weak.jpg", isoDate: "2026-07-24", quality: "weak", notes: "duplicate, drop this one" }),
      item({ file: "strong.jpg", isoDate: "2026-07-24", quality: "strong" }),
    ];

    const { pages, skipped } = planPlacement(items);

    expect(skipped).toHaveLength(0);
    expect(pages.map((p) => p.file).sort()).toEqual(["strong.jpg", "weak.jpg"]);
  });
});

describe("planPlacement — multi-page days", () => {
  it("a day with many photographs gets that many pages, not one page or a fixed cap", () => {
    const items = Array.from({ length: 21 }, (_, i) =>
      item({ file: `2026-07-24-${String(i).padStart(2, "0")}.heic`, isoDate: "2026-07-24" }),
    );

    const { pages } = planPlacement(items);

    expect(pages).toHaveLength(21);
    expect(pages.every((p) => p.isoDate === "2026-07-24")).toBe(true);
    // Every page is its own page — no two share a position, and every
    // page maps to a distinct source file (no page silently duplicated).
    expect(new Set(pages.map((p) => p.position)).size).toBe(21);
    expect(new Set(pages.map((p) => p.file)).size).toBe(21);
  });

  it("a day with one photograph gets exactly one page — not padded, not skipped", () => {
    const items = [item({ file: "only.jpg", isoDate: "2026-07-16" })];

    const { pages } = planPlacement(items);

    expect(pages).toHaveLength(1);
    expect(pages[0]!.file).toBe("only.jpg");
  });

  it("orders pages within a day earliest time-of-day first", () => {
    const items = [
      item({ file: "z-night.jpg", isoDate: "2026-07-24", timeOfDay: "night" }),
      item({ file: "a-day.jpg", isoDate: "2026-07-24", timeOfDay: "daytime, bright/overcast" }),
      item({ file: "m-sunset.jpg", isoDate: "2026-07-24", timeOfDay: "sunset, golden hour" }),
    ];

    const { pages } = planPlacement(items);

    expect(pages.map((p) => p.file)).toEqual(["a-day.jpg", "m-sunset.jpg", "z-night.jpg"]);
  });

  it("orders days chronologically, oldest first, independent of any per-day ordering", () => {
    const items = [
      item({ file: "later.jpg", isoDate: "2026-08-06" }),
      item({ file: "earlier.jpg", isoDate: "2026-07-16" }),
      item({ file: "middle.jpg", isoDate: "2026-07-25" }),
    ];

    const { pages } = planPlacement(items);

    expect(pages.map((p) => p.isoDate)).toEqual(["2026-07-16", "2026-07-25", "2026-08-06"]);
    expect(pages.every((p, i) => i === 0 || p.position > pages[i - 1]!.position)).toBe(true);
  });
});

describe("planPlacement — bursts and near-duplicates", () => {
  it("places a catalogue-documented burst pair adjacently, not scattered across the day", () => {
    const items = [
      item({ file: "24:7:26-19.JPG", isoDate: "2026-07-24", timeOfDay: "sunset" }),
      item({ file: "24:7:26-17.HEIC", isoDate: "2026-07-24", timeOfDay: "sunset" }),
      item({ file: "24:7:26-5.JPG", isoDate: "2026-07-24", timeOfDay: "sunset" }),
      item({ file: "24:7:26-16.HEIC", isoDate: "2026-07-24", timeOfDay: "sunset" }),
    ];

    const { pages } = planPlacement(items);
    const files = pages.map((p) => p.file);
    const i16 = files.indexOf("24:7:26-16.HEIC");
    const i17 = files.indexOf("24:7:26-17.HEIC");

    expect(i17).toBe(i16 + 1);
  });

  it("places the resolution-duplicate pair adjacently and still places both", () => {
    const items = [
      item({ file: "24:7:26-19.JPG", isoDate: "2026-07-24", timeOfDay: "sunset" }),
      item({ file: "24:7:26-18.JPG", isoDate: "2026-07-24", timeOfDay: "sunset" }),
      item({ file: "24:7:26-4.JPG", isoDate: "2026-07-24", timeOfDay: "sunset" }),
    ];

    const { pages, skipped } = planPlacement(items);

    expect(skipped).toHaveLength(0);
    expect(pages).toHaveLength(3);
    const files = pages.map((p) => p.file);
    expect(files.indexOf("24:7:26-18.JPG")).toBe(files.indexOf("24:7:26-4.JPG") + 1);
  });
});

describe("planPlacement — the real archive", () => {
  it("matches the founder's day-by-day page counts from the real, committed source data", () => {
    const items = loadSourceItems();
    const { pages, skipped } = planPlacement(items);

    expect(items).toHaveLength(51);
    // Three videos (28:7:26-6.MOV, 1:8:26-1.MOV, 1:8:26-3.MP4) cannot get
    // a book_entries row today — see VIDEO_SKIP_REASON. Every one of the
    // 48 images gets a page; nothing else is skipped.
    expect(skipped).toHaveLength(3);
    expect(skipped.every((s) => s.reason === VIDEO_SKIP_REASON)).toBe(true);
    expect(pages).toHaveLength(48);

    const countsByDay = new Map<string, number>();
    for (const p of pages) countsByDay.set(p.isoDate, (countsByDay.get(p.isoDate) ?? 0) + 1);

    expect(Object.fromEntries(countsByDay)).toEqual({
      "2026-07-16": 1,
      "2026-07-18": 1,
      "2026-07-24": 21,
      "2026-07-25": 5,
      "2026-07-27": 2,
      // 2026-07-28 has exactly one source item, and it is the video
      // 28:7:26-6.MOV — zero image pages that day, correctly.
      "2026-07-30": 2,
      "2026-07-31": 3,
      // 2026-08-01 has three source items: one image, two videos.
      "2026-08-01": 1,
      "2026-08-02": 1,
      "2026-08-03": 4,
      "2026-08-06": 6,
      "2026-08-07": 1,
    });

    // Every position is unique and every page maps to a distinct file —
    // nothing doubled up.
    expect(new Set(pages.map((p) => p.position)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.file)).size).toBe(pages.length);
  });

  it("re-running against the real data is idempotent at the planning level: identical plan every time", () => {
    const items = loadSourceItems();
    expect(planPlacement(items)).toEqual(planPlacement(items));
  });
});
