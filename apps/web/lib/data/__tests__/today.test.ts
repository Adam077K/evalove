/**
 * `liveTodayObject` — the real equivalent of the fixture `todaysObject()`
 * that used to live in `components/home/TodayPair.tsx`.
 *
 * `todaySnapshot` and `listPhotos` are imported for real (not mocked); only
 * the database gate — `FakeGateway` — is substituted, same pattern as
 * `lib/data/__tests__/photos.test.ts`.
 */
import { describe, expect, it } from "vitest";
import { liveTodayObject } from "../today";
import type { PhotoDeps } from "../photos";
import { ADAM_ROW, EVA_ROW, fakeGateway, row } from "./fake-gateway";

function deps(gateway: ReturnType<typeof fakeGateway>, now: Date): PhotoDeps {
  return { gateway, now: () => now, newId: () => "unused-in-these-tests" };
}

// 14:00 America/New_York on 2026-08-05 (EDT, UTC-4).
const NOW = new Date("2026-08-05T18:00:00Z");
const TODAY = "2026-08-05";

describe("liveTodayObject", () => {
  it("the pair — both posted today", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({
        id: "eva-today",
        author_member_id: EVA_ROW.id,
        shared_day: TODAY,
        created_at: "2026-08-05T14:00:00Z",
        caption: "morning light",
      }),
      row({
        id: "adam-today",
        author_member_id: ADAM_ROW.id,
        shared_day: TODAY,
        created_at: "2026-08-05T16:00:00Z",
        caption: "evening light",
      }),
    ];

    const result = await liveTodayObject(deps(gw, NOW), { slug: "eva" });

    expect(result.day).toBe(TODAY);
    expect(result.evaPhoto?.id).toBe("eva-today");
    expect(result.evaPhoto?.authorSlug).toBe("eva");
    expect(result.adamPhoto?.id).toBe("adam-today");
    expect(result.adamPhoto?.authorSlug).toBe("adam");
    expect(result.lastLeft).toBeUndefined();
    // Adam's is later — the DECO stamp describes whichever landed last.
    expect(result.stampPhoto?.id).toBe("adam-today");
    expect(result.recentDailies).toEqual([]);
  });

  it("one item — only Adam posted today", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({
        id: "adam-today",
        author_member_id: ADAM_ROW.id,
        shared_day: TODAY,
        created_at: "2026-08-05T09:00:00Z",
      }),
    ];

    const result = await liveTodayObject(deps(gw, NOW), { slug: "eva" });

    expect(result.evaPhoto).toBeUndefined();
    expect(result.adamPhoto?.id).toBe("adam-today");
    expect(result.lastLeft).toBeUndefined();
    expect(result.stampPhoto?.id).toBe("adam-today");
  });

  it("the Tuesday — nothing posted today, the last thing left stays", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({
        id: "eva-two-days-ago",
        author_member_id: EVA_ROW.id,
        shared_day: "2026-08-03",
        created_at: "2026-08-03T13:00:00Z",
        caption: "the coffee place",
      }),
      row({
        id: "adam-three-days-ago",
        author_member_id: ADAM_ROW.id,
        shared_day: "2026-08-02",
        created_at: "2026-08-02T08:00:00Z",
        caption: "the walk to the office",
      }),
    ];

    const result = await liveTodayObject(deps(gw, NOW), { slug: "eva" });

    expect(result.evaPhoto).toBeUndefined();
    expect(result.adamPhoto).toBeUndefined();
    // The most recently created daily, regardless of author.
    expect(result.lastLeft?.id).toBe("eva-two-days-ago");
    expect(result.lastLeft?.authorSlug).toBe("eva");
    expect(result.stampPhoto?.id).toBe("eva-two-days-ago");
    // Both candidates are in the pool for the impression search.
    expect(result.recentDailies.map((p) => p.id).sort()).toEqual(
      ["adam-three-days-ago", "eva-two-days-ago"].sort(),
    );
  });

  it("genuinely empty archive — every field comes back undefined, not a placeholder", async () => {
    const gw = fakeGateway();
    gw.photos = [];

    const result = await liveTodayObject(deps(gw, NOW), { slug: "eva" });

    expect(result.evaPhoto).toBeUndefined();
    expect(result.adamPhoto).toBeUndefined();
    expect(result.lastLeft).toBeUndefined();
    expect(result.stampPhoto).toBeUndefined();
    expect(result.recentDailies).toEqual([]);
  });

  it("ignores a book-kind photo when looking for the Tuesday fallback — only dailies count", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({
        id: "curated-plate",
        kind: "book",
        author_member_id: EVA_ROW.id,
        shared_day: "2026-08-04",
        created_at: "2026-08-04T20:00:00Z",
      }),
    ];

    const result = await liveTodayObject(deps(gw, NOW), { slug: "eva" });

    expect(result.lastLeft).toBeUndefined();
  });
});
