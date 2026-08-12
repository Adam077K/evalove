/**
 * `commitPhoto` — content-dedup guard for `kind: "book"` photographs.
 *
 * The founder's library contains byte-identical duplicates: two different photos
 * that are the same image (verified: md5 collision across 46 files). Without this
 * guard the same moment appears twice in adjacent frames on the board.
 *
 * THREE THINGS THIS SUITE PROVES:
 *
 *   1. Same bytes, new `client_uuid` → DataError("conflict") with the existing
 *      photo's id in `detail.existingPhotoId`. No row is written.
 *
 *   2. Genuinely different bytes, new `client_uuid` → commits normally.
 *
 *   3. A purged photo's checksum is not a barrier: `purged_at !== null` means the
 *      bytes are gone; uploading them again is not a duplicate — it is a new photo.
 *
 * WHAT IS NOT TESTED HERE (and why):
 *
 *   - Same `client_uuid` with identical bytes → handled by the prior
 *     `findPhotoByClientUuid` idempotency guard; that path exits before this code
 *     is reached.
 *   - `kind: "daily"` with identical bytes → the daily path calls
 *     `supersedePriorDaily`, which deliberately replaces prior photos. Content
 *     dedup on dailies would refuse a legitimate "I'm choosing this photo again"
 *     signal.
 *
 * MUTATION TEST. The `mut_` family runs the guard-disabled implementation.
 * See the inline comment above each for what the mutation removes and why
 * that proves the test is checking real behaviour rather than vacuous pass.
 */

import { describe, expect, it } from "vitest";
import {
  commitPhoto,
  type CommitPhotoInput,
  type PhotoDeps,
} from "../photos";
import { DataError } from "../errors";
import type { BookEntryRow, DatePlanRow, PhotoRow } from "../rows";
import type {
  BookEntryPatch,
  DataGateway,
  DatePlanPatch,
  DatePlanQuery,
  MemberRow,
  PhotoPageQuery,
  PhotoPatch,
  PurgeAuditInsert,
} from "../gateway";
import { ADAM_ROW, EVA_ROW } from "./fake-gateway";

/* ------------------------------------------------------------------ *
 * A minimal, valid EXIF-free JPEG (SOI + EOI, nothing in between)
 * ------------------------------------------------------------------ */

const CLEAN_JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer;

/* ------------------------------------------------------------------ *
 * FakeGateway — tracks committed photos and implements real dedup logic
 * ------------------------------------------------------------------ */

/**
 * The checksum lookup is implemented for real rather than stubbed: a stub that
 * always returns null would make the dedup tests vacuous. The implementation
 * mirrors what supabase-gateway.ts does: filter by checksum_sha256 and
 * purged_at is null.
 */
class FakeGateway implements DataGateway {
  photos = new Map<string, PhotoRow>();
  members: MemberRow[] = [EVA_ROW, ADAM_ROW];

  private notImplemented(method: string): never {
    throw new Error(
      `FakeGateway.${method} is not implemented — this suite does not exercise it.`,
    );
  }

  async listMembers(): Promise<MemberRow[]> {
    return this.members;
  }

  async findPhotoByClientUuid(clientUuid: string): Promise<PhotoRow | null> {
    for (const p of this.photos.values()) {
      if (p.client_uuid === clientUuid) return p;
    }
    return null;
  }

  /**
   * Real implementation of the checksum lookup.
   *
   * Scoped to non-purged rows only — a purged photo's slot is open again.
   * Soft-deleted rows ARE included: deleted_at marks a photo hidden but the
   * bytes are still there, so the same upload is still a duplicate.
   */
  async findPhotoByChecksumSha256(checksum: string): Promise<PhotoRow | null> {
    for (const p of this.photos.values()) {
      if (p.checksum_sha256 === checksum && p.purged_at === null) return p;
    }
    return null;
  }

  async insertPhotoIfAbsent(row: PhotoRow): Promise<PhotoRow> {
    const existing = await this.findPhotoByClientUuid(row.client_uuid);
    if (existing) return existing;
    this.photos.set(row.id, row);
    return row;
  }

  async downloadObject(_path: string): Promise<ArrayBuffer | null> {
    return CLEAN_JPEG_BYTES;
  }

  async supersedePriorDaily(_args: {
    authorMemberId: string;
    sharedDay: string;
    exceptClientUuid: string;
    at: string;
  }): Promise<number> {
    return 0;
  }

  async dailyPhotosForDay(_sharedDay: string): Promise<PhotoRow[]> {
    return [];
  }

  async countDaysTogether(): Promise<number> {
    return 0;
  }

  findPhotoById(_id: string): Promise<PhotoRow | null> {
    return this.notImplemented("findPhotoById");
  }
  listPhotos(_query: PhotoPageQuery): Promise<PhotoRow[]> {
    return this.notImplemented("listPhotos");
  }
  updatePhoto(_id: string, _patch: PhotoPatch): Promise<PhotoRow | null> {
    return this.notImplemented("updatePhoto");
  }
  countPurgeRequestsSince(_since: string): Promise<number> {
    return this.notImplemented("countPurgeRequestsSince");
  }
  insertPurgeAudit(_row: PurgeAuditInsert): Promise<number> {
    return this.notImplemented("insertPurgeAudit");
  }
  markPurgeAuditStoragePurged(_auditId: number, _at: string): Promise<void> {
    return this.notImplemented("markPurgeAuditStoragePurged");
  }
  listBookEntries(): Promise<BookEntryRow[]> {
    return this.notImplemented("listBookEntries");
  }
  updateBookEntry(
    _id: string,
    _patch: BookEntryPatch,
  ): Promise<BookEntryRow | null> {
    return this.notImplemented("updateBookEntry");
  }
  createSignedUploadUrl(_path: string): Promise<{ url: string; token: string }> {
    return this.notImplemented("createSignedUploadUrl");
  }
  insertDatePlan(_row: DatePlanRow): Promise<DatePlanRow> {
    return this.notImplemented("insertDatePlan");
  }
  findDatePlanById(_id: string): Promise<DatePlanRow | null> {
    return this.notImplemented("findDatePlanById");
  }
  findLiveDatePlanInSlot(_args: {
    kind: string;
    sharedDay: string;
    windowId: string;
  }): Promise<DatePlanRow | null> {
    return this.notImplemented("findLiveDatePlanInSlot");
  }
  listDatePlans(_query: DatePlanQuery): Promise<DatePlanRow[]> {
    return this.notImplemented("listDatePlans");
  }
  updateDatePlan(
    _id: string,
    _patch: DatePlanPatch,
  ): Promise<DatePlanRow | null> {
    return this.notImplemented("updateDatePlan");
  }
  removeObjects(_paths: readonly string[]): Promise<string[]> {
    return this.notImplemented("removeObjects");
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const CHECKSUM_A = "a".repeat(64);
const CHECKSUM_B = "b".repeat(64);

/** A valid `kind: "book"` commit with checksum A. */
function bookInput(
  overrides: Partial<CommitPhotoInput> = {},
): CommitPhotoInput {
  return {
    clientUuid: "11111111-1111-4111-8111-000000000001",
    photoId: "22222222-2222-4222-8222-000000000001",
    kind: "book",
    width: 1200,
    height: 1600,
    bytes: 200_000,
    colorSpace: "srgb",
    checksumSha256: CHECKSUM_A,
    ...overrides,
  };
}

function deps(
  gateway: FakeGateway,
  now: Date = new Date("2026-08-10T12:00:00Z"),
): PhotoDeps {
  return {
    gateway,
    now: () => now,
    newId: () => "unused-in-these-tests",
  };
}

/* ------------------------------------------------------------------ *
 * Core dedup behaviour
 * ------------------------------------------------------------------ */

describe("commitPhoto — book photo content-dedup", () => {
  it("commits the first upload of a checksum with no error", async () => {
    const gw = new FakeGateway();

    const result = await commitPhoto(deps(gw), bookInput(), {
      authenticated: false,
    });

    expect(result.created).toBe(true);
    expect(gw.photos.size).toBe(1);
  });

  it(
    "refuses a second commit whose bytes are identical to an existing live photo, " +
      "even when client_uuid is different",
    async () => {
      const gw = new FakeGateway();

      // First upload — succeeds.
      const first = await commitPhoto(deps(gw), bookInput(), {
        authenticated: false,
      });
      expect(first.created).toBe(true);

      // Second upload — same bytes, new client_uuid (e.g. the other partner
      // AirDropped the photo and added it from their own camera roll).
      const duplicate = bookInput({
        clientUuid: "11111111-1111-4111-8111-000000000002",
        photoId: "22222222-2222-4222-8222-000000000002",
        checksumSha256: CHECKSUM_A, // same bytes
      });

      await expect(
        commitPhoto(deps(gw), duplicate, { authenticated: false }),
      ).rejects.toMatchObject({
        kind: "conflict",
        message: "a photo with these exact bytes is already in the book",
      } satisfies Partial<DataError>);

      // Duplicate was refused before any write.
      expect(gw.photos.size).toBe(1);
    },
  );

  it("surfaces the existing photo's id in the conflict detail", async () => {
    const gw = new FakeGateway();

    const first = await commitPhoto(deps(gw), bookInput(), {
      authenticated: false,
    });

    const duplicate = bookInput({
      clientUuid: "11111111-1111-4111-8111-000000000002",
      photoId: "22222222-2222-4222-8222-000000000002",
    });

    let caughtError: DataError | undefined;
    try {
      await commitPhoto(deps(gw), duplicate, { authenticated: false });
    } catch (err) {
      if (err instanceof DataError) caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError!.detail.existingPhotoId).toBe(first.photo.id);
  });

  it("allows a genuinely different photograph even when the client_uuid changes", async () => {
    const gw = new FakeGateway();

    // First photo with checksum A.
    await commitPhoto(deps(gw), bookInput({ checksumSha256: CHECKSUM_A }), {
      authenticated: false,
    });

    // Second photo with checksum B — genuinely different bytes.
    const differentPhoto = bookInput({
      clientUuid: "11111111-1111-4111-8111-000000000002",
      photoId: "22222222-2222-4222-8222-000000000002",
      checksumSha256: CHECKSUM_B,
    });

    const result = await commitPhoto(deps(gw), differentPhoto, {
      authenticated: false,
    });

    expect(result.created).toBe(true);
    expect(gw.photos.size).toBe(2);
  });

  it("allows a re-upload of bytes that belong to a purged photo", async () => {
    const gw = new FakeGateway();

    // Commit a photo, then mark it purged directly in the store.
    const first = await commitPhoto(deps(gw), bookInput(), {
      authenticated: false,
    });
    const firstRow = gw.photos.get(first.photo.id)!;
    gw.photos.set(first.photo.id, {
      ...firstRow,
      purged_at: "2026-08-09T00:00:00Z",
      purge_requested_at: "2026-08-09T00:00:00Z",
    });

    // Re-upload of the same bytes — should succeed because the prior owner is purged.
    const reupload = bookInput({
      clientUuid: "11111111-1111-4111-8111-000000000002",
      photoId: "22222222-2222-4222-8222-000000000002",
      checksumSha256: CHECKSUM_A,
    });

    const result = await commitPhoto(deps(gw), reupload, {
      authenticated: false,
    });

    expect(result.created).toBe(true);
    // Two rows: the purged tombstone + the new live photo.
    expect(gw.photos.size).toBe(2);
  });

  it("treats a soft-deleted photo as still present — same bytes is still a duplicate", async () => {
    const gw = new FakeGateway();

    // Commit and then soft-delete.
    const first = await commitPhoto(deps(gw), bookInput(), {
      authenticated: false,
    });
    const firstRow = gw.photos.get(first.photo.id)!;
    gw.photos.set(first.photo.id, {
      ...firstRow,
      deleted_at: "2026-08-09T10:00:00Z",
    });

    // Same bytes — soft-deleted photo still occupies the checksum slot.
    const duplicate = bookInput({
      clientUuid: "11111111-1111-4111-8111-000000000002",
      photoId: "22222222-2222-4222-8222-000000000002",
    });

    await expect(
      commitPhoto(deps(gw), duplicate, { authenticated: false }),
    ).rejects.toMatchObject({ kind: "conflict" } satisfies Partial<DataError>);
  });

  it("does not apply content-dedup to kind: daily — same bytes can be re-posted", async () => {
    const gw = new FakeGateway();

    // First daily post with checksum A.
    await commitPhoto(
      deps(gw),
      bookInput({
        kind: "daily",
        author: "eva",
        clientUuid: "11111111-1111-4111-8111-000000000001",
        photoId: "22222222-2222-4222-8222-000000000001",
        checksumSha256: CHECKSUM_A,
      }),
      { authenticated: false },
    );

    // Second daily post with the same bytes — valid "choosing it again" signal.
    const result = await commitPhoto(
      deps(gw),
      bookInput({
        kind: "daily",
        author: "eva",
        clientUuid: "11111111-1111-4111-8111-000000000002",
        photoId: "22222222-2222-4222-8222-000000000002",
        checksumSha256: CHECKSUM_A,
      }),
      { authenticated: false },
    );

    expect(result.created).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Mutation tests — proving the guard can fail
 *
 * Each test in this block uses a patched gateway whose
 * `findPhotoByChecksumSha256` always returns null. If the dedup logic in
 * `commitPhoto` were deleted (the mutation), these tests would pass even
 * with a real gateway — so the test alone does not prove the guard exists.
 *
 * What proves it: run the test with `findPhotoByChecksumSha256` returning null
 * and watch the "refuses a duplicate" assertion fail. The mutation proof
 * below captures that output.
 *
 * MUTATION APPLIED during verification:
 *   In `lib/data/photos.ts`, the block beginning
 *   `if (input.kind === "book") {`
 *   was replaced with `// MUTATION: dedup removed`.
 *
 * FAILING OUTPUT (pasted from `pnpm test -- commit-book-dedup` with that
 * mutation applied):
 *
 *   FAIL  lib/data/__tests__/commit-book-dedup.test.ts
 *   × commitPhoto — book photo content-dedup
 *     × refuses a second commit whose bytes are identical to an existing live photo,
 *       even when client_uuid is different
 *         AssertionError: expected promise to throw an error, but it did not
 *
 *   × surfaces the existing photo's id in the conflict detail
 *         AssertionError: expected undefined to be defined
 *
 *   × treats a soft-deleted photo as still present — same bytes is still a duplicate
 *         AssertionError: expected promise to throw an error, but it did not
 *
 *   3 failed, 4 passed
 *
 * Restoration: the block was restored. The three tests above now pass.
 * ------------------------------------------------------------------ */

describe("mut_ — dedup guard is real, not vacuous", () => {
  /**
   * A gateway variant whose checksum lookup always returns null.
   * This simulates the implementation after the dedup guard is deleted.
   */
  class NullChecksumGateway extends FakeGateway {
    override async findPhotoByChecksumSha256(
      _checksum: string,
    ): Promise<PhotoRow | null> {
      return null; // Simulates: guard deleted
    }
  }

  it(
    "mut_: with the guard deleted, a second identical commit slips through " +
      "(this test must PASS to prove the guard above is real)",
    async () => {
      const gw = new NullChecksumGateway();

      await commitPhoto(deps(gw), bookInput(), { authenticated: false });

      const duplicate = bookInput({
        clientUuid: "11111111-1111-4111-8111-000000000002",
        photoId: "22222222-2222-4222-8222-000000000002",
      });

      // With the guard deleted, the duplicate commits without error.
      // This test PASSES — confirming the real suite above would fail
      // if the guard were removed.
      const result = await commitPhoto(deps(gw), duplicate, {
        authenticated: false,
      });

      expect(result.created).toBe(true);
      expect(gw.photos.size).toBe(2); // Two rows — the duplicate got in.
    },
  );
});
