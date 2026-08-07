/**
 * `listAllPhotos`, `liveWhatCameBack` and `liveBookLeaves` — the real
 * equivalents of the fixture archive (`lib/fixtures/photos.ts`,
 * `lib/fixtures/book.ts`) that used to back `whatCameBack`'s default
 * parameter and `bookLeaves()`.
 *
 * `listPhotos` and `whatCameBack` are imported for real; only the database
 * gate — `FakeGateway` — is substituted.
 */
import { describe, expect, it } from "vitest";
import { listAllPhotos, liveBookLeaves, liveWhatCameBack } from "../archive";
import { MAX_PAGE_SIZE, type PhotoDeps } from "../photos";
import { ADAM_ROW, EVA_ROW, bookEntryRow, fakeGateway, row } from "./fake-gateway";

function deps(gateway: ReturnType<typeof fakeGateway>, now: Date = new Date()): PhotoDeps {
  return { gateway, now: () => now, newId: () => "unused-in-these-tests" };
}

describe("listAllPhotos", () => {
  it("pages past a single page's limit without dropping or duplicating a row", async () => {
    const gw = fakeGateway();
    const count = MAX_PAGE_SIZE + 37; // forces at least two pages
    gw.photos = Array.from({ length: count }, (_, i) =>
      row({
        id: `p${String(i).padStart(4, "0")}`,
        author_member_id: i % 2 === 0 ? EVA_ROW.id : ADAM_ROW.id,
        shared_day: "2026-08-01",
        // Distinct instants, oldest first by index — listPhotos pages
        // newest-first, so the cursor has to walk the whole thing.
        created_at: new Date(Date.UTC(2026, 7, 1, 0, 0, i)).toISOString(),
      }),
    );

    const result = await listAllPhotos(deps(gw));

    expect(result).toHaveLength(count);
    expect(new Set(result.map((p) => p.id)).size).toBe(count); // no duplicates
  });

  it("attaches authorSlug from the roster to every photo", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({ id: "a", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T10:00:00Z" }),
      row({ id: "b", author_member_id: ADAM_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T11:00:00Z" }),
    ];

    const result = await listAllPhotos(deps(gw));
    const byId = new Map(result.map((p) => [p.id, p]));

    expect(byId.get("a")?.authorSlug).toBe("eva");
    expect(byId.get("b")?.authorSlug).toBe("adam");
  });

  it("respects a kind filter", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({ id: "daily-1", kind: "daily", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T10:00:00Z" }),
      row({ id: "book-1", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T11:00:00Z" }),
    ];

    const result = await listAllPhotos(deps(gw), { kind: "daily" });

    expect(result.map((p) => p.id)).toEqual(["daily-1"]);
  });

  it("an empty archive returns an empty array, not an error", async () => {
    const gw = fakeGateway();
    expect(await listAllPhotos(deps(gw))).toEqual([]);
  });
});

describe("liveWhatCameBack", () => {
  it("finds a date match against the real archive, with authorSlug attached", async () => {
    const gw = fakeGateway();
    gw.photos = [
      row({
        id: "year-ago",
        author_member_id: EVA_ROW.id,
        shared_day: "2025-08-01",
        created_at: "2025-08-01T14:00:00Z",
        caption: "a year ago today",
      }),
    ];
    const now = new Date("2026-08-01T12:00:00Z");

    const returned = await liveWhatCameBack(deps(gw, now), now);

    expect(returned?.reason).toBe("date");
    expect(returned?.photo.id).toBe("year-ago");
    expect(returned?.photo.authorSlug).toBe("eva");
  });

  it("a genuinely empty archive returns null, never a fixture stand-in", async () => {
    const gw = fakeGateway();
    const now = new Date("2026-08-01T12:00:00Z");

    expect(await liveWhatCameBack(deps(gw, now), now)).toBeNull();
  });
});

describe("liveBookLeaves", () => {
  it("groups dailies by day, newest first, excluding whichever day is still live", async () => {
    const gw = fakeGateway();
    // Eva NY (UTC-4 in August): 18:00 UTC -> 14:00 local, still 2026-08-05.
    const now = new Date("2026-08-05T18:00:00Z");
    gw.photos = [
      row({ id: "eva-today", author_member_id: EVA_ROW.id, shared_day: "2026-08-05", created_at: "2026-08-05T14:00:00Z" }),
      row({ id: "eva-yesterday", author_member_id: EVA_ROW.id, shared_day: "2026-08-04", created_at: "2026-08-04T14:00:00Z", caption: "yesterday" }),
      row({ id: "adam-yesterday", author_member_id: ADAM_ROW.id, shared_day: "2026-08-04", created_at: "2026-08-04T16:00:00Z", caption: "yesterday too" }),
      row({ id: "eva-two-ago", author_member_id: EVA_ROW.id, shared_day: "2026-08-03", created_at: "2026-08-03T14:00:00Z" }),
    ];

    const { leaves, leafCount, begun } = await liveBookLeaves(deps(gw, now), now);

    // "eva-today" is on the live day and must not appear as a kept leaf.
    expect(leaves.map((l) => l.day.date)).toEqual(["2026-08-04", "2026-08-03"]);
    expect(leafCount).toBe(2);
    expect(begun).toBe("2026-08-03");

    const yesterday = leaves[0]!;
    expect(yesterday.day.evaPosted).toBe(true);
    expect(yesterday.day.adamPosted).toBe(true);
    expect(yesterday.day.bothPosted).toBe(true);
    expect(yesterday.day.photoCount).toBe(2);
    expect(yesterday.evaPhoto?.id).toBe("eva-yesterday");
    expect(yesterday.adamPhoto?.id).toBe("adam-yesterday");

    const twoAgo = leaves[1]!;
    expect(twoAgo.day.evaPosted).toBe(true);
    expect(twoAgo.day.adamPosted).toBe(false);
    expect(twoAgo.day.bothPosted).toBe(false);
    expect(twoAgo.day.photoCount).toBe(1);
  });

  it("excludes BOTH members' live day when their shared days diverge", async () => {
    const gw = fakeGateway();
    // Eva NY: 02:00 UTC - 4h = 2026-08-04 22:00 -> Eva's day is 08-04.
    // Adam Jerusalem: 02:00 UTC + 3h = 2026-08-05 05:00 -> Adam's day is 08-05.
    const now = new Date("2026-08-05T02:00:00Z");
    gw.photos = [
      row({ id: "eva-live", author_member_id: EVA_ROW.id, shared_day: "2026-08-04", created_at: "2026-08-04T20:00:00Z" }),
      row({ id: "adam-live", author_member_id: ADAM_ROW.id, shared_day: "2026-08-05", created_at: "2026-08-05T01:00:00Z" }),
      row({ id: "kept", author_member_id: EVA_ROW.id, shared_day: "2026-08-02", created_at: "2026-08-02T14:00:00Z" }),
    ];

    const { leaves } = await liveBookLeaves(deps(gw, now), now);

    expect(leaves.map((l) => l.day.date)).toEqual(["2026-08-02"]);
  });

  it("a genuinely empty archive is a new book — no leaves, begun is today, not an error", async () => {
    const gw = fakeGateway();
    const now = new Date("2026-08-05T18:00:00Z");

    const { leaves, leafCount, begun } = await liveBookLeaves(deps(gw, now), now);

    expect(leaves).toEqual([]);
    expect(leafCount).toBe(0);
    expect(begun).toBe("2026-08-05");
  });

  it("does not include book-kind photos as kept daily leaves", async () => {
    const gw = fakeGateway();
    const now = new Date("2026-08-05T18:00:00Z");
    gw.photos = [
      row({ id: "curated", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T14:00:00Z" }),
    ];

    const { leaves } = await liveBookLeaves(deps(gw, now), now);

    expect(leaves).toEqual([]);
  });

  describe("curated (book_entries) leaves", () => {
    it("turns each book_entries row into its own single-photo leaf, even when several share a day", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "p1", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T10:00:00Z" }),
        row({ id: "p2", kind: "book", author_member_id: ADAM_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T11:00:00Z" }),
        row({ id: "p3", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T12:00:00Z" }),
      ];
      gw.bookEntries = [
        bookEntryRow({ id: "e1", photo_id: "p1", position: 100 }),
        bookEntryRow({ id: "e2", photo_id: "p2", position: 200 }),
        bookEntryRow({ id: "e3", photo_id: "p3", position: 300 }),
      ];

      const { leaves, leafCount } = await liveBookLeaves(deps(gw, now), now);

      // Three distinct pages, not one leaf holding three photos.
      expect(leaves).toHaveLength(3);
      expect(leafCount).toBe(3);
      // Every key is unique even though every date is the same — the bug a
      // shared `day.date` React key would have hidden.
      expect(new Set(leaves.map((l) => l.key)).size).toBe(3);
      expect(leaves.every((l) => l.day.date === "2026-07-24")).toBe(true);
      // Ordered by book_entries.position, ascending.
      expect(leaves.map((l) => l.evaPhoto?.id ?? l.adamPhoto?.id)).toEqual(["p1", "p2", "p3"]);
      // Each leaf carries exactly one photograph, on the correct side.
      expect(leaves[0]).toMatchObject({ evaPhoto: { id: "p1" }, adamPhoto: undefined });
      expect(leaves[1]).toMatchObject({ evaPhoto: undefined, adamPhoto: { id: "p2" } });
    });

    it("sorts a curated day newest-first against ordinary kept days", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "daily-aug3", author_member_id: EVA_ROW.id, shared_day: "2026-08-03", created_at: "2026-08-03T14:00:00Z" }),
        row({ id: "curated-jul24", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T10:00:00Z" }),
      ];
      gw.bookEntries = [bookEntryRow({ id: "e1", photo_id: "curated-jul24", position: 100 })];

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves.map((l) => l.day.date)).toEqual(["2026-08-03", "2026-07-24"]);
    });

    it("on a day with both a daily leaf and curated leaves, the daily leaf sorts first", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "daily-eva", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T09:00:00Z" }),
        row({ id: "daily-adam", author_member_id: ADAM_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T10:00:00Z" }),
        row({ id: "curated", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T11:00:00Z" }),
      ];
      gw.bookEntries = [bookEntryRow({ id: "e1", photo_id: "curated", position: 100 })];

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves).toHaveLength(2);
      expect(leaves[0]!.key).toBe("2026-08-01"); // the daily leaf's key
      expect(leaves[0]!.evaPhoto?.id).toBe("daily-eva");
      expect(leaves[1]!.key).toBe("book:e1");
    });

    it("skips a book_entries row whose photo is gone rather than throwing", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = []; // the referenced photo does not exist in the archive
      gw.bookEntries = [bookEntryRow({ id: "e1", photo_id: "missing", position: 100 })];

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves).toEqual([]);
    });

    it("an empty book_entries table changes nothing (the existing contract holds)", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "daily", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T14:00:00Z" }),
      ];
      gw.bookEntries = [];

      const { leaves, leafCount } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves).toHaveLength(1);
      expect(leafCount).toBe(1);
    });
  });
});
