/**
 * `commitPhoto` refuses a machine-shaped caption (lib/caption-law.ts) — the
 * structural fix for the 2026-08-08 breach: an ingest catalogue's internal
 * deduplication note ("Same photo as 24:7:26-4.JPG at lower resolution.")
 * reached the live Book as if a person had written it.
 *
 * This is the backstop, not the only fix — tools/ingest/prepare.ts and
 * tools/ingest/load.ts both filter the same way, earlier in the pipeline
 * (see tools/ingest/__tests__/manifest.test.ts and
 * caption-law-catalog.test.ts). This suite proves the funnel every caption
 * ultimately passes through — commitPhoto itself — refuses one on its own,
 * so no future caller (a rewritten loader, an admin script, a caption
 * suggestion feature) can reintroduce this class of defect by skipping an
 * upstream check that happens to exist today.
 *
 * Same FakeGateway shape as commit-unsigned.test.ts — commitPhoto is the
 * real implementation; only the database gate is substituted.
 */
import { describe, expect, it } from "vitest";
import { commitPhoto, type CommitPhotoInput, type PhotoDeps } from "../photos";
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

/** A minimal, valid, EXIF-free JPEG: SOI immediately followed by EOI. */
const CLEAN_JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer;

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
    clientUuid: "33333333-3333-4333-8333-000000000001",
    photoId: "44444444-4444-4444-8444-000000000001",
    kind: "book",
    width: 1200,
    height: 1600,
    bytes: 200_000,
    colorSpace: "srgb",
    checksumSha256: "b".repeat(64),
    ...overrides,
  };
}

function deps(gateway: FakeGateway): PhotoDeps {
  return {
    gateway,
    now: () => new Date("2026-08-08T12:00:00Z"),
    newId: () => "unused-in-these-tests",
  };
}

describe("commitPhoto — the machine-shaped-caption guard", () => {
  it("refuses the exact breach caption that shipped live", async () => {
    const gw = new FakeGateway();

    await expect(
      commitPhoto(
        deps(gw),
        baseInput({ caption: "Same photo as 24:7:26-4.JPG at lower resolution." }),
        { authenticated: false },
      ),
    ).rejects.toMatchObject({ kind: "invalid" } satisfies Partial<DataError>);

    // Refused before any write.
    expect(gw.photos.size).toBe(0);
  });

  it("refuses a caption naming a file by extension, from any caller", async () => {
    const gw = new FakeGateway();

    await expect(
      commitPhoto(deps(gw), baseInput({ caption: "duplicate of IMG_0142.heic" }), {
        authenticated: false,
      }),
    ).rejects.toThrow(DataError);
  });

  it("commits normally with a clean, human-sounding caption", async () => {
    const gw = new FakeGateway();

    const result = await commitPhoto(
      deps(gw),
      baseInput({ caption: "the tomatoes at the market, obscene" }),
      { authenticated: false },
    );

    expect(result.created).toBe(true);
    expect(result.photo.caption).toBe("the tomatoes at the market, obscene");
  });

  it("commits normally with no caption at all — an uncaptioned photo is fine", async () => {
    const gw = new FakeGateway();

    const result = await commitPhoto(deps(gw), baseInput(), { authenticated: false });

    expect(result.created).toBe(true);
    expect(result.photo.caption).toBeUndefined();
  });
});
