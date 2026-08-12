/**
 * Authorization guard tests for softDeletePhoto.
 *
 * THE CORE RULE. A partner cannot delete the other partner's photographs.
 * The authorization check (author_member_id !== requestedBy) precedes the
 * idempotent early return (deleted_at !== null). This proves that even if a
 * photo is already deleted, an unauthorized user receives "forbidden", not
 * "already deleted" — authorization is not bypassed by idempotency.
 *
 * THREE MUTATIONS TEST THIS:
 * - F: DELETE the author_member_id check → tests should fail (authorization gone)
 * - G: INVERT the check (=== instead of !==) → tests should fail (inverted logic)
 * - H: DELETE the purged_at guard → tests should fail (can delete purged photos)
 *
 * The gateway is a simple in-memory object with spy methods. The real
 * softDeletePhoto is imported (not mocked); only the database gate is substituted.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { softDeletePhoto, type PhotoDeps } from "../photos";
import { DataError } from "../errors";
import type { BookEntryRow, DatePlanRow, PhotoRow } from "../rows";
import type {
  DataGateway,
  DatePlanPatch,
  DatePlanQuery,
  MemberRow,
  PhotoPatch,
  PhotoPageQuery,
  BookEntryPatch,
  PurgeAuditInsert,
} from "../gateway";

/* ------------------------------------------------------------------ *
 * In-Memory Gateway
 * ------------------------------------------------------------------ */

/**
 * A fake database gateway that allows tests to:
 * 1. Control what findPhotoById returns
 * 2. Spy on calls to updatePhoto
 * 3. Isolate the softDeletePhoto logic from Supabase
 *
 * `PhotoDeps.gateway` is typed as the full `DataGateway` port, so this class
 * implements every member of it. softDeletePhoto only calls findPhotoById and
 * updatePhoto — the rest exist solely to satisfy the interface and throw if a
 * future test accidentally exercises a path this suite does not cover.
 */
class FakeGateway implements DataGateway {
  // Photo store: id -> row, or null to simulate "not found"
  private store = new Map<string, PhotoRow | null>();

  // Spy on update calls
  updatePhotoMock = vi.fn();

  /**
   * Simulate database state. Set a photo as found or not-found.
   */
  setPhoto(photoId: string, row: PhotoRow | null) {
    this.store.set(photoId, row);
  }

  /**
   * Respond to findPhotoById. Returns what was set by setPhoto.
   */
  async findPhotoById(photoId: string): Promise<PhotoRow | null> {
    const row = this.store.get(photoId);
    return row === undefined ? null : row;
  }

  /**
   * Simulate a successful update. Track the call and resolve the spy mock.
   */
  async updatePhoto(
    photoId: string,
    patch: PhotoPatch,
  ): Promise<PhotoRow | null> {
    this.updatePhotoMock(photoId, patch);
    const updated = this.store.get(photoId);
    if (!updated) return null;
    return { ...updated, ...patch };
  }

  /**
   * Get the mock for assertion in tests.
   */
  getUpdatePhotoMock() {
    return this.updatePhotoMock;
  }

  /* -- unused by softDeletePhoto — present only to satisfy DataGateway -- */

  private notImplemented(method: string): never {
    throw new Error(
      `FakeGateway.${method} is not implemented — softDeletePhoto does not call it. ` +
        `If a new test needs it, implement it for real rather than stubbing the return value.`,
    );
  }

  listMembers(): Promise<MemberRow[]> {
    return this.notImplemented("listMembers");
  }

  insertPhotoIfAbsent(_row: PhotoRow): Promise<PhotoRow> {
    return this.notImplemented("insertPhotoIfAbsent");
  }

  findPhotoByClientUuid(_clientUuid: string): Promise<PhotoRow | null> {
    return this.notImplemented("findPhotoByClientUuid");
  }

  findPhotoByChecksumSha256(_checksum: string): Promise<PhotoRow | null> {
    return this.notImplemented("findPhotoByChecksumSha256");
  }

  listPhotos(_query: PhotoPageQuery): Promise<PhotoRow[]> {
    return this.notImplemented("listPhotos");
  }

  dailyPhotosForDay(_sharedDay: string): Promise<PhotoRow[]> {
    return this.notImplemented("dailyPhotosForDay");
  }

  supersedePriorDaily(_args: {
    authorMemberId: string;
    sharedDay: string;
    exceptClientUuid: string;
    at: string;
  }): Promise<number> {
    return this.notImplemented("supersedePriorDaily");
  }

  countDaysTogether(): Promise<number> {
    return this.notImplemented("countDaysTogether");
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

  downloadObject(_path: string): Promise<ArrayBuffer | null> {
    return this.notImplemented("downloadObject");
  }

  /* -- date plans: not used by the functions under test -- */
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
  updateDatePlan(_id: string, _patch: DatePlanPatch): Promise<DatePlanRow | null> {
    return this.notImplemented("updateDatePlan");
  }
  removeObjects(_paths: readonly string[]): Promise<string[]> {
    return this.notImplemented("removeObjects");
  }
}

/* ------------------------------------------------------------------ *
 * Test Fixtures
 * ------------------------------------------------------------------ */

/**
 * A minimal valid PhotoRow with all required fields set to safe defaults.
 * Tests override specific fields to create test scenarios.
 */
function createMockPhotoRow(overrides?: Partial<PhotoRow>): PhotoRow {
  return {
    id: "photo-123",
    client_uuid: "client-abc",
    kind: "daily",
    author_member_id: "author-eva",
    attribution_source: "authenticated",
    shared_day: "2026-08-03",
    shared_day_tz: "America/New_York",
    client_reported_tz: null,
    taken_at: "2026-08-03T14:00:00Z",
    caption: null,
    storage_path_display: "eva/2026-08-03/photo-123-display.jpg",
    storage_path_thumb: "eva/2026-08-03/photo-123-thumb.jpg",
    storage_path_original: "eva/2026-08-03/photo-123-original.jpg",
    original_location: "supabase",
    width: 1920,
    height: 1080,
    bytes: 500000,
    mime: "image/jpeg",
    color_space: "srgb",
    checksum_sha256: "abc123def456",
    exif_stripped: false,
    created_at: "2026-08-03T14:05:00Z",
    deleted_at: null,
    purge_requested_at: null,
    purged_at: null,
    ...overrides,
  };
}

/**
 * Create a minimal PhotoDeps with the fake gateway and fixed time.
 */
function createTestDeps(gateway: FakeGateway): PhotoDeps {
  const fixedTime = new Date("2026-08-03T15:00:00Z");
  return {
    gateway,
    now: () => fixedTime,
    newId: () => "new-id-uuid",
  };
}

/* ------------------------------------------------------------------ *
 * Test Suite
 * ------------------------------------------------------------------ */

describe("softDeletePhoto", () => {
  let gateway: FakeGateway;
  let deps: PhotoDeps;

  beforeEach(() => {
    gateway = new FakeGateway();
    deps = createTestDeps(gateway);
  });

  /* ================================================================ *
   * NOT FOUND
   * ================================================================ */

  describe("photo not found", () => {
    it("throws not_found when photo does not exist", async () => {
      gateway.setPhoto("nonexistent", null);

      await expect(softDeletePhoto(deps, "nonexistent", "requester-adam")).rejects
        .toMatchObject({
          kind: "not_found",
          message: "no such photo",
        });
    });
  });

  /* ================================================================ *
   * PURGED GUARD
   * ================================================================ */

  describe("purged_at guard", () => {
    it("throws not_found when photo is purged", async () => {
      const purgedPhoto = createMockPhotoRow({
        purged_at: "2026-08-02T00:00:00Z",
      });
      gateway.setPhoto("photo-purged", purgedPhoto);

      await expect(softDeletePhoto(deps, "photo-purged", "requester-adam")).rejects
        .toMatchObject({
          kind: "not_found",
          message: "this photo was purged",
        });
    });

    it("allows delete when photo is not yet purged (purged_at is null)", async () => {
      const photo = createMockPhotoRow({
        id: "photo-live",
        author_member_id: "requester-adam",
        purged_at: null,
        deleted_at: null,
      });
      gateway.setPhoto("photo-live", photo);

      // Should not throw
      await softDeletePhoto(deps, "photo-live", "requester-adam");

      expect(gateway.getUpdatePhotoMock()).toHaveBeenCalled();
    });
  });

  /* ================================================================ *
   * AUTHORIZATION — CORE RULE
   * ================================================================ */

  describe("authorization check (author_member_id !== requestedBy)", () => {
    it("throws forbidden when requester is not the photo author", async () => {
      const photo = createMockPhotoRow({
        id: "photo-eva",
        author_member_id: "author-eva",
        purged_at: null,
        deleted_at: null,
      });
      gateway.setPhoto("photo-eva", photo);

      // Attempt to delete as a different user (Adam)
      await expect(softDeletePhoto(deps, "photo-eva", "requester-adam")).rejects
        .toMatchObject({
          kind: "forbidden",
          message: "forbidden",
        });
    });

    it("allows delete when requester is the photo author", async () => {
      const photo = createMockPhotoRow({
        id: "photo-auth-ok",
        author_member_id: "requester-adam",
        purged_at: null,
        deleted_at: null,
      });
      gateway.setPhoto("photo-auth-ok", photo);

      // Should not throw
      await softDeletePhoto(deps, "photo-auth-ok", "requester-adam");

      expect(gateway.getUpdatePhotoMock()).toHaveBeenCalled();
    });

    it(
      "CRITICAL: throws forbidden EVEN WHEN photo is already deleted, " +
        "if requester is not author",
      async () => {
        const photo = createMockPhotoRow({
          id: "photo-already-deleted",
          author_member_id: "author-eva",
          purged_at: null,
          deleted_at: "2026-08-02T10:00:00Z", // Already soft-deleted
        });
        gateway.setPhoto("photo-already-deleted", photo);

        // Authorization check must precede the idempotent early return.
        // An unauthorized user cannot use deleted_at !== null to bypass authorization.
        await expect(
          softDeletePhoto(deps, "photo-already-deleted", "requester-adam"),
        ).rejects.toMatchObject({
          kind: "forbidden",
          message: "forbidden",
        });

        // The gateway.updatePhoto should NOT have been called because the
        // authorization check failed before the early return.
        expect(gateway.getUpdatePhotoMock()).not.toHaveBeenCalled();
      },
    );
  });

  /* ================================================================ *
   * IDEMPOTENCY (early return on deleted_at !== null)
   * ================================================================ */

  describe("idempotency (deleted_at guard)", () => {
    it("returns early (no database update) when photo is already deleted", async () => {
      const photo = createMockPhotoRow({
        id: "photo-already-deleted",
        author_member_id: "requester-adam",
        purged_at: null,
        deleted_at: "2026-08-02T10:00:00Z",
      });
      gateway.setPhoto("photo-already-deleted", photo);

      // Should not throw
      await softDeletePhoto(deps, "photo-already-deleted", "requester-adam");

      // updatePhoto should NOT have been called (early return on deleted_at !== null)
      expect(gateway.getUpdatePhotoMock()).not.toHaveBeenCalled();
    });
  });

  /* ================================================================ *
   * HAPPY PATH
   * ================================================================ */

  describe("happy path", () => {
    it("sets deleted_at to current time when all checks pass", async () => {
      const photo = createMockPhotoRow({
        id: "photo-success",
        author_member_id: "requester-adam",
        purged_at: null,
        deleted_at: null,
      });
      gateway.setPhoto("photo-success", photo);

      await softDeletePhoto(deps, "photo-success", "requester-adam");

      const calls = gateway.getUpdatePhotoMock().mock.calls;
      expect(calls).toHaveLength(1);

      const [photoId, patch] = calls[0] as [string, Record<string, string>];
      expect(photoId).toBe("photo-success");
      expect(patch.deleted_at).toBe("2026-08-03T15:00:00.000Z"); // Fixed time from deps.now()
    });

    it("succeeds for author deleting their own photo", async () => {
      const photo = createMockPhotoRow({
        id: "photo-author-delete",
        author_member_id: "author-eva",
        purged_at: null,
        deleted_at: null,
      });
      gateway.setPhoto("photo-author-delete", photo);

      await softDeletePhoto(deps, "photo-author-delete", "author-eva");

      expect(gateway.getUpdatePhotoMock()).toHaveBeenCalledWith(
        "photo-author-delete",
        { deleted_at: "2026-08-03T15:00:00.000Z" },
      );
    });
  });

  /* ================================================================ *
   * GUARD ORDERING (Authorization before Idempotency)
   * ================================================================ */

  describe("guard ordering (authorization must precede idempotency)", () => {
    it(
      "proves authorization is not bypassed by deleted_at: " +
        "author differs AND deleted_at !== null -> still forbidden",
      async () => {
        const photo = createMockPhotoRow({
          id: "photo-auth-before-idem",
          author_member_id: "author-eva",
          purged_at: null,
          deleted_at: "2026-08-02T10:00:00Z",
        });
        gateway.setPhoto("photo-auth-before-idem", photo);

        // This test verifies the core fix: authorization is checked BEFORE
        // the idempotent early return. Without this order, an unauthorized user
        // could use an already-deleted photo to leak information (idempotency
        // signals "already deleted", authorization check is skipped).

        await expect(
          softDeletePhoto(
            deps,
            "photo-auth-before-idem",
            "requester-adam",
          ),
        ).rejects.toMatchObject({
          kind: "forbidden",
          message: "forbidden",
        });

        expect(gateway.getUpdatePhotoMock()).not.toHaveBeenCalled();
      },
    );
  });

  /* ================================================================ *
   * EDGE CASES
   * ================================================================ */

  describe("edge cases", () => {
    it("distinguishes between null (not purged) and a timestamp (purged)", async () => {
      const notPurged = createMockPhotoRow({ purged_at: null });
      const purged = createMockPhotoRow({
        purged_at: "2026-08-01T00:00:00Z",
      });

      gateway.setPhoto("not-purged", notPurged);
      gateway.setPhoto("purged", purged);

      // Not purged should proceed to authorization
      await expect(
        softDeletePhoto(deps, "not-purged", "mismatched-author"),
      ).rejects.toMatchObject({ kind: "forbidden" });

      // Purged should fail at purge guard, before authorization
      await expect(softDeletePhoto(deps, "purged", "author-eva")).rejects
        .toMatchObject({ kind: "not_found", message: "this photo was purged" });
    });

    it("distinguishes between null (not deleted) and a timestamp (deleted)", async () => {
      const notDeleted = createMockPhotoRow({
        author_member_id: "requester-adam",
        deleted_at: null,
      });
      const alreadyDeleted = createMockPhotoRow({
        author_member_id: "requester-adam",
        deleted_at: "2026-08-02T10:00:00Z",
      });

      gateway.setPhoto("not-deleted", notDeleted);
      gateway.setPhoto("already-deleted", alreadyDeleted);

      // Not deleted -> should call updatePhoto
      await softDeletePhoto(deps, "not-deleted", "requester-adam");
      expect(gateway.getUpdatePhotoMock()).toHaveBeenCalledOnce();

      gateway.getUpdatePhotoMock().mockClear();

      // Already deleted -> should NOT call updatePhoto (early return)
      await softDeletePhoto(deps, "already-deleted", "requester-adam");
      expect(gateway.getUpdatePhotoMock()).not.toHaveBeenCalled();
    });
  });
});
