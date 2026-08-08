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
    it("folds several same-day book_entries rows into ONE cluster leaf, up to MAX_PHOTOS_PER_CURATED_PAGE (2026-08-08: 'add more than one pic in book page')", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "p1", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T10:00:00Z" }),
        row({ id: "p2", kind: "book", author_member_id: ADAM_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T11:00:00Z" }),
        row({ id: "p3", kind: "book", author_member_id: null, shared_day: "2026-07-24", created_at: "2026-07-24T12:00:00Z" }),
      ];
      gw.bookEntries = [
        bookEntryRow({ id: "e1", photo_id: "p1", position: 100 }),
        bookEntryRow({ id: "e2", photo_id: "p2", position: 200 }),
        bookEntryRow({ id: "e3", photo_id: "p3", position: 300 }),
      ];

      const { leaves, leafCount } = await liveBookLeaves(deps(gw, now), now);

      // One page holding three photographs, not three single-photo pages.
      expect(leaves).toHaveLength(1);
      expect(leafCount).toBe(1);
      expect(leaves[0]!.day.date).toBe("2026-07-24");
      // Ordered by book_entries.position, ascending, and no
      // evaPhoto/adamPhoto/unsignedPhoto set on a cluster leaf — the mixed
      // authorship (signed, signed, deliberately unsigned) lives entirely
      // in `photos`.
      expect(leaves[0]!.photos?.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
      expect(leaves[0]!.evaPhoto).toBeUndefined();
      expect(leaves[0]!.adamPhoto).toBeUndefined();
      expect(leaves[0]!.unsignedPhoto).toBeUndefined();
      // Key carries every entry id, so it stays unique even against a
      // future differently-chunked run.
      expect(leaves[0]!.key).toBe("book:e1,e2,e3");
    });

    it("chunks a busy day evenly rather than leaving a lonely trailing page (4 -> 2+2, not 3+1)", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = ["p1", "p2", "p3", "p4"].map((id, i) =>
        row({
          id,
          kind: "book",
          author_member_id: EVA_ROW.id,
          shared_day: "2026-07-24",
          created_at: `2026-07-24T${10 + i}:00:00Z`,
        }),
      );
      gw.bookEntries = ["e1", "e2", "e3", "e4"].map((id, i) =>
        bookEntryRow({ id, photo_id: `p${i + 1}`, position: (i + 1) * 100 }),
      );

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves).toHaveLength(2);
      expect(leaves.map((l) => l.photos?.map((p) => p.id))).toEqual([
        ["p1", "p2"],
        ["p3", "p4"],
      ]);
    });

    it("a single curated photo on a day still becomes an ordinary single-photo leaf, not a one-item cluster", async () => {
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "p1", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T10:00:00Z" }),
      ];
      gw.bookEntries = [bookEntryRow({ id: "e1", photo_id: "p1", position: 100 })];

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves).toHaveLength(1);
      expect(leaves[0]!.photos).toBeUndefined();
      expect(leaves[0]).toMatchObject({ evaPhoto: { id: "p1" }, key: "book:e1" });
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

    it("the richest day (most leaves) leads, even when it is older than the newest kept day", async () => {
      // 24 July has a daily leaf + 2 cluster pages (4 curated photos → 2+2).
      // 3 August has a daily leaf only.
      // Even though 3 August is newer, 24 July leads because it has more leaves.
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        // Daily for 3 August
        row({ id: "daily-aug3", author_member_id: EVA_ROW.id, shared_day: "2026-08-03", created_at: "2026-08-03T14:00:00Z" }),
        // Daily for 24 July
        row({ id: "daily-jul24-eva", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T09:00:00Z" }),
        row({ id: "daily-jul24-adam", author_member_id: ADAM_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T10:00:00Z" }),
        // Four curated photos for 24 July → chunkEvenly(4, 3) = 2+2 = 2 cluster pages
        row({ id: "c1", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T11:00:00Z" }),
        row({ id: "c2", kind: "book", author_member_id: ADAM_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T12:00:00Z" }),
        row({ id: "c3", kind: "book", author_member_id: EVA_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T13:00:00Z" }),
        row({ id: "c4", kind: "book", author_member_id: ADAM_ROW.id, shared_day: "2026-07-24", created_at: "2026-07-24T14:00:00Z" }),
      ];
      gw.bookEntries = [
        bookEntryRow({ id: "e1", photo_id: "c1", position: 100 }),
        bookEntryRow({ id: "e2", photo_id: "c2", position: 200 }),
        bookEntryRow({ id: "e3", photo_id: "c3", position: 300 }),
        bookEntryRow({ id: "e4", photo_id: "c4", position: 400 }),
      ];

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      // 24 July: 1 daily + 2 cluster = 3 leaves → leads the Book.
      // 3 August: 1 daily leaf → newest-first tail.
      // Expected order: [2026-07-24 daily, 2026-07-24 cluster1, 2026-07-24 cluster2, 2026-08-03]
      expect(leaves).toHaveLength(4);
      expect(leaves[0]!.day.date).toBe("2026-07-24");
      expect(leaves[0]!.key).toBe("2026-07-24"); // the daily leaf leads within the date
      expect(leaves[1]!.day.date).toBe("2026-07-24");
      expect(leaves[2]!.day.date).toBe("2026-07-24");
      expect(leaves[3]!.day.date).toBe("2026-08-03");
    });

    it("on a count tie between dates, the more recent date leads (recovers newest-first)", async () => {
      // Two days, each with exactly 1 leaf. More recent date should lead.
      const gw = fakeGateway();
      const now = new Date("2026-08-05T18:00:00Z");
      gw.photos = [
        row({ id: "aug3", author_member_id: EVA_ROW.id, shared_day: "2026-08-03", created_at: "2026-08-03T14:00:00Z" }),
        row({ id: "aug1", author_member_id: EVA_ROW.id, shared_day: "2026-08-01", created_at: "2026-08-01T14:00:00Z" }),
      ];

      const { leaves } = await liveBookLeaves(deps(gw, now), now);

      expect(leaves.map((l) => l.day.date)).toEqual(["2026-08-03", "2026-08-01"]);
    });
  });
});
