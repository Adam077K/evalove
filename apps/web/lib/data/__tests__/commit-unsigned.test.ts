/**
 * `commitPhoto` and `todaySnapshot` — the unsigned-photo path (migration 12,
 * founder decision 2026-08-07: "Let the Book hold them unsigned — treat
 * these as shared, not authored; they belong to the day rather than to a
 * person.").
 *
 * Three things this suite proves, each mapping to a governing rule stated in
 * the handoff for this change:
 *
 *   1. `commitPhoto` with `author` omitted writes `author_member_id: null`
 *      and never invents a member id.
 *   2. `commitPhoto` REFUSES a `kind: "daily"` commit with no author — a
 *      "daily" is "the one shared card for a day, posted BY a person" and
 *      has no meaning without one. This is the guard that keeps an unsigned
 *      row from ever reaching the day-pairing logic in the first place.
 *   3. `todaySnapshot` — the day-pairing read — never counts an unsigned row
 *      as either Eva's or Adam's, even if one somehow existed (defence in
 *      depth: rule 2 means this should be unreachable through the app, but
 *      the read path does not trust that and stays correct on its own).
 *
 * The gateway is a simple in-memory object with spy methods, same pattern as
 * `photos.test.ts`'s own `FakeGateway`: `commitPhoto`/`todaySnapshot` are the
 * REAL implementations; only the database gate is substituted.
 */

import { describe, expect, it, vi } from "vitest";
import { commitPhoto, todaySnapshot, type CommitPhotoInput, type PhotoDeps } from "../photos";
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
import { ADAM_ROW, EVA_ROW, row } from "./fake-gateway";

/** A minimal, valid, EXIF-free JPEG: SOI immediately followed by EOI, no
    segments in between for `findMetadataEvidence` to find anything in. */
const CLEAN_JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer;

class FakeGateway implements DataGateway {
  photos = new Map<string, PhotoRow>();
  members: MemberRow[] = [EVA_ROW, ADAM_ROW];
  supersedePriorDailyMock = vi.fn(
    async (_args: {
      authorMemberId: string;
      sharedDay: string;
      exceptClientUuid: string;
      at: string;
    }) => 0,
  );

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

  async supersedePriorDaily(args: {
    authorMemberId: string;
    sharedDay: string;
    exceptClientUuid: string;
    at: string;
  }): Promise<number> {
    return this.supersedePriorDailyMock(args);
  }

  async dailyPhotosForDay(sharedDay: string): Promise<PhotoRow[]> {
    return [...this.photos.values()].filter(
      (p) => p.kind === "daily" && p.shared_day === sharedDay && p.deleted_at === null,
    );
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
  updateBookEntry(_id: string, _patch: BookEntryPatch): Promise<BookEntryRow | null> {
    return this.notImplemented("updateBookEntry");
  }
  createSignedUploadUrl(_path: string): Promise<{ url: string; token: string }> {
    return this.notImplemented("createSignedUploadUrl");
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

function baseInput(overrides: Partial<CommitPhotoInput> = {}): CommitPhotoInput {
  return {
    clientUuid: "11111111-1111-4111-8111-000000000001",
    photoId: "22222222-2222-4222-8222-000000000001",
    kind: "book",
    width: 1200,
    height: 1600,
    bytes: 200_000,
    colorSpace: "srgb",
    checksumSha256: "a".repeat(64),
    ...overrides,
  };
}

function deps(gateway: FakeGateway, now: Date = new Date("2026-08-05T12:00:00Z")): PhotoDeps {
  return { gateway, now: () => now, newId: () => "unused-in-these-tests" };
}

describe("commitPhoto — unsigned commits (migration 12)", () => {
  it("commits kind: \"book\" with no author as author_member_id: null, inventing nothing", async () => {
    const gw = new FakeGateway();

    const result = await commitPhoto(deps(gw), baseInput(), { authenticated: false });

    expect(result.created).toBe(true);
    expect(result.photo.authorMemberId).toBeNull();
    // No `authorSlug` is ever attached at this layer — that happens in
    // lib/data/archive.ts/today.ts from the roster, and an unsigned photo's
    // authorMemberId (null) never matches a roster id.
    expect(result.photo.authorSlug).toBeUndefined();
    expect(result.photo.attributionSource).toBe("self_declared");
  });

  it("refuses a kind: \"daily\" commit with no author", async () => {
    const gw = new FakeGateway();

    await expect(
      commitPhoto(deps(gw), baseInput({ kind: "daily" }), { authenticated: false }),
    ).rejects.toMatchObject({ kind: "invalid" } satisfies Partial<DataError>);

    // Refused before any write — nothing was inserted.
    expect(gw.photos.size).toBe(0);
  });

  it("never calls supersedePriorDaily for an unsigned (book) commit", async () => {
    const gw = new FakeGateway();

    await commitPhoto(deps(gw), baseInput(), { authenticated: false });

    expect(gw.supersedePriorDailyMock).not.toHaveBeenCalled();
  });

  it("a signed daily commit is unaffected — still supersedes and still resolves the author's own zone", async () => {
    const gw = new FakeGateway();

    const result = await commitPhoto(
      deps(gw),
      baseInput({
        clientUuid: "11111111-1111-4111-8111-000000000002",
        photoId: "22222222-2222-4222-8222-000000000002",
        kind: "daily",
        author: "eva",
      }),
      { authenticated: false },
    );

    expect(result.photo.authorMemberId).toBe(EVA_ROW.id);
    expect(result.photo.sharedDayTz).toBe(EVA_ROW.home_timezone);
    expect(gw.supersedePriorDailyMock).toHaveBeenCalledWith(
      expect.objectContaining({ authorMemberId: EVA_ROW.id }),
    );
  });
});

describe("todaySnapshot — an unsigned row never completes a day's pair", () => {
  it("excludes a row with author_member_id: null from both eva and adam", async () => {
    const gw = new FakeGateway();
    const day = "2026-08-05";
    // Directly injected — commitPhoto itself refuses to produce this shape
    // (the test above proves it). This is the read path's own defence, not
    // a scenario the write path is expected to create.
    gw.photos.set(
      "unsigned-daily",
      row({
        id: "unsigned-daily",
        kind: "daily",
        author_member_id: null,
        shared_day: day,
        created_at: "2026-08-05T12:00:00Z",
      }),
    );
    gw.photos.set(
      "eva-daily",
      row({
        id: "eva-daily",
        kind: "daily",
        author_member_id: EVA_ROW.id,
        shared_day: day,
        created_at: "2026-08-05T13:00:00Z",
      }),
    );

    const snapshot = await todaySnapshot(deps(gw, new Date("2026-08-05T18:00:00Z")), {
      slug: "eva",
    });

    expect(snapshot.eva?.id).toBe("eva-daily");
    expect(snapshot.adam).toBeNull();
  });
});
