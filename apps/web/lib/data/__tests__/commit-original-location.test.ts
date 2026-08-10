/**
 * The original_location field describes reality at every instant.
 *
 * THE BREACH THIS FIXES. `commitPhoto` wrote `original_location: 'supabase'`
 * at commit time, but the outbox uploader only ever uploads display and thumb
 * derivatives before committing — the original goes later over wi-fi via
 * `uploadDeferredOriginals`. The field was claiming bytes were safe that had
 * not yet left the device.
 *
 * TWO INVARIANTS ASSERTED HERE:
 *
 *   1. After `commitPhoto` the field is `'none'` — the original has not arrived.
 *   2. After `confirmOriginalLanded` the field is `'supabase'` — the bytes are
 *      confirmed on the server.
 *
 * MUTATION PROOF (obligatory for this project — see MEMORY.md "Assertions
 * that cannot fail"). The fix was temporarily reverted — `original_location:
 * "supabase"` written at commit time — and pnpm test was run. 5 tests failed:
 *
 *   AssertionError: expected 'supabase' to be 'none' // Object.is equality
 *   Expected: "none"
 *   Received: "supabase"
 *     at commitPhoto — original_location at commit time
 *       > writes 'none', not 'supabase' — the original has not arrived yet
 *
 *   AssertionError: expected 'supabase' not to be 'supabase' // Object.is equality
 *     at commitPhoto — original_location at commit time
 *       > a committed photo does not claim its original is safe before confirmOriginalLanded runs
 *
 *   AssertionError: expected "vi.fn()" to be called once, but got 0 times
 *     at confirmOriginalLanded — original lands later
 *       > passes original_location: 'supabase' to updatePhoto
 *       (idempotent path taken instead — no updatePhoto call needed)
 *
 * The guard can fire. It did fire. Test file 1 failed (1), Tests 5 failed | 4 passed (9).
 *
 * Same FakeGateway shape as commit-unsigned.test.ts and
 * commit-caption-guard.test.ts: the real implementations are under test;
 * only the database gate is substituted.
 */

import { describe, expect, it, vi } from "vitest";
import {
  commitPhoto,
  confirmOriginalLanded,
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
 * Minimal EXIF-free JPEG bytes
 * ------------------------------------------------------------------ */

/** SOI followed immediately by EOI — no segments for findMetadataEvidence to find. */
const CLEAN_JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer;

/* ------------------------------------------------------------------ *
 * FakeGateway
 * ------------------------------------------------------------------ */

/**
 * In-memory gateway that supports the methods `commitPhoto` and
 * `confirmOriginalLanded` exercise. Everything else throws so that a test
 * that accidentally hits an unimplemented path fails loudly rather than
 * silently returning a stub.
 */
class FakeGateway implements DataGateway {
  photos = new Map<string, PhotoRow>();
  members: MemberRow[] = [EVA_ROW, ADAM_ROW];

  updatePhotoSpy = vi.fn(async (id: string, patch: PhotoPatch): Promise<PhotoRow | null> => {
    const existing = this.photos.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.photos.set(id, updated);
    return updated;
  });

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

  async findPhotoById(id: string): Promise<PhotoRow | null> {
    return this.photos.get(id) ?? null;
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

  async updatePhoto(id: string, patch: PhotoPatch): Promise<PhotoRow | null> {
    return this.updatePhotoSpy(id, patch);
  }

  async dailyPhotosForDay(_sharedDay: string): Promise<PhotoRow[]> {
    return [];
  }

  async countDaysTogether(): Promise<number> {
    return 0;
  }

  listPhotos(_query: PhotoPageQuery): Promise<PhotoRow[]> {
    return this.notImplemented("listPhotos");
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
  updateBookEntry(_id: string, _patch: BookEntryPatch): Promise<BookEntryRow | null> {
    return this.notImplemented("updateBookEntry");
  }
  createSignedUploadUrl(_path: string): Promise<{ url: string; token: string }> {
    return this.notImplemented("createSignedUploadUrl");
  }
  removeObjects(_paths: readonly string[]): Promise<string[]> {
    return this.notImplemented("removeObjects");
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
  updateDatePlan(_id: string, _patch: DatePlanPatch): Promise<DatePlanRow | null> {
    return this.notImplemented("updateDatePlan");
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function baseInput(overrides: Partial<CommitPhotoInput> = {}): CommitPhotoInput {
  return {
    clientUuid: "55555555-5555-4555-8555-000000000001",
    photoId: "66666666-6666-4666-8666-000000000001",
    kind: "book",
    width: 1200,
    height: 1600,
    bytes: 200_000,
    colorSpace: "srgb",
    checksumSha256: "c".repeat(64),
    ...overrides,
  };
}

function deps(gateway: FakeGateway): PhotoDeps {
  return {
    gateway,
    now: () => new Date("2026-08-10T10:00:00Z"),
    newId: () => "unused-in-these-tests",
  };
}

/* ------------------------------------------------------------------ *
 * Suite 1: commit writes 'none'
 * ------------------------------------------------------------------ */

describe("commitPhoto — original_location at commit time", () => {
  it("writes 'none', not 'supabase' — the original has not arrived yet", async () => {
    const gw = new FakeGateway();

    const result = await commitPhoto(deps(gw), baseInput(), { authenticated: false });

    // THIS IS THE GUARD. If photos.ts writes 'supabase' here instead of 'none'
    // this assertion fails. It failed during the mutation proof run and was
    // recorded in the file header above.
    expect(result.photo.originalLocation).toBe("none");
  });

  it("the row in the gateway also has original_location: 'none'", async () => {
    const gw = new FakeGateway();
    const input = baseInput();

    await commitPhoto(deps(gw), input, { authenticated: false });

    const row = gw.photos.get(input.photoId);
    expect(row).toBeDefined();
    expect(row?.original_location).toBe("none");
  });

  it("a committed photo does not claim its original is safe before confirmOriginalLanded runs", async () => {
    const gw = new FakeGateway();

    const { photo } = await commitPhoto(deps(gw), baseInput(), { authenticated: false });

    // The field must not describe bytes we do not yet hold.
    expect(photo.originalLocation).not.toBe("supabase");
    expect(photo.originalLocation).not.toBe("r2");
    expect(photo.originalLocation).not.toBe("purged");
    expect(photo.originalLocation).toBe("none");
  });
});

/* ------------------------------------------------------------------ *
 * Suite 2: confirmOriginalLanded flips to 'supabase'
 * ------------------------------------------------------------------ */

describe("confirmOriginalLanded — original lands later", () => {
  it("flips original_location from 'none' to 'supabase'", async () => {
    const gw = new FakeGateway();

    // Step 1: commit the photograph (original not yet present).
    const { photo: committed } = await commitPhoto(deps(gw), baseInput(), {
      authenticated: false,
    });
    expect(committed.originalLocation).toBe("none");

    // Step 2: the outbox wi-fi pass PUT the original and calls confirm.
    const confirmed = await confirmOriginalLanded(deps(gw), {
      photoId: committed.id,
      bytes: 4_200_000,
    });

    expect(confirmed.originalLocation).toBe("supabase");
  });

  it("passes original_location: 'supabase' to updatePhoto — verifies the gateway call", async () => {
    const gw = new FakeGateway();

    const { photo: committed } = await commitPhoto(deps(gw), baseInput(), {
      authenticated: false,
    });

    gw.updatePhotoSpy.mockClear();
    await confirmOriginalLanded(deps(gw), {
      photoId: committed.id,
      bytes: 4_200_000,
    });

    expect(gw.updatePhotoSpy).toHaveBeenCalledOnce();
    const [calledId, calledPatch] = gw.updatePhotoSpy.mock.calls[0] as [string, PhotoPatch];
    expect(calledId).toBe(committed.id);
    expect(calledPatch).toMatchObject({ original_location: "supabase" });
  });

  it("is idempotent — a retried confirm on an already-confirmed row returns the row unchanged", async () => {
    const gw = new FakeGateway();

    const { photo: committed } = await commitPhoto(deps(gw), baseInput(), {
      authenticated: false,
    });
    await confirmOriginalLanded(deps(gw), { photoId: committed.id, bytes: 4_200_000 });

    // Second call — same result, no second updatePhoto.
    gw.updatePhotoSpy.mockClear();
    const again = await confirmOriginalLanded(deps(gw), {
      photoId: committed.id,
      bytes: 4_200_000,
    });

    expect(again.originalLocation).toBe("supabase");
    // Idempotent: no second write.
    expect(gw.updatePhotoSpy).not.toHaveBeenCalled();
  });

  it("throws not_found for an unknown photoId", async () => {
    const gw = new FakeGateway();

    await expect(
      confirmOriginalLanded(deps(gw), {
        photoId: "99999999-9999-4999-8999-000000000001",
        bytes: 4_200_000,
      }),
    ).rejects.toMatchObject({ kind: "not_found" } satisfies Partial<DataError>);
  });

  it("throws not_found when the photo is purged", async () => {
    const gw = new FakeGateway();

    const { photo: committed } = await commitPhoto(deps(gw), baseInput(), {
      authenticated: false,
    });
    // Inject purged_at directly — purgePhoto would be the real path, but
    // that route is not available without more gateway methods.
    const existing = gw.photos.get(committed.id);
    if (existing) {
      gw.photos.set(committed.id, {
        ...existing,
        purged_at: "2026-08-10T12:00:00Z",
      });
    }

    await expect(
      confirmOriginalLanded(deps(gw), { photoId: committed.id, bytes: 4_200_000 }),
    ).rejects.toMatchObject({
      kind: "not_found",
      message: "this photo was purged",
    } satisfies Partial<DataError>);
  });

  it("rejects confirming on a photo that is already 'purged' in original_location", async () => {
    const gw = new FakeGateway();

    const { photo: committed } = await commitPhoto(deps(gw), baseInput(), {
      authenticated: false,
    });
    // Force the original_location to 'purged' (what purgePhoto leaves behind).
    const existing = gw.photos.get(committed.id);
    if (existing) {
      gw.photos.set(committed.id, {
        ...existing,
        original_location: "purged",
        purge_requested_at: "2026-08-10T12:00:00Z",
        purged_at: "2026-08-10T12:00:00Z",
      });
    }

    await expect(
      confirmOriginalLanded(deps(gw), { photoId: committed.id, bytes: 4_200_000 }),
    ).rejects.toMatchObject({ kind: "not_found" } satisfies Partial<DataError>);
  });
});
