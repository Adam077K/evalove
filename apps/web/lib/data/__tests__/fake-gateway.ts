/**
 * A `DataGateway` backed by an in-memory array, shared by the tests in this
 * directory that exercise `lib/data/today.ts` and `lib/data/archive.ts`.
 *
 * Only `listMembers`, `listPhotos`, `dailyPhotosForDay` and
 * `countDaysTogether` are real — those are the only gateway calls
 * `liveTodayObject`/`listAllPhotos`/`liveWhatCameBack`/`liveBookLeaves`
 * make. Everything else throws, same pattern as `photos.test.ts`'s own
 * `FakeGateway`: a test that needs one of them should implement it for
 * real, not receive a silently-stubbed return value.
 *
 * `listPhotos`'s ordering and cursor semantics are reimplemented here
 * deliberately, matching `supabase-gateway.ts`'s own contract (`(created_at,
 * id)` descending; `before` is a strict "older than" bound) rather than
 * just returning everything — `listAllPhotos`'s paging loop is exactly what
 * would go silently untested by a fake that ignores the cursor.
 */

import type {
  DataGateway,
  MemberRow,
  PhotoPageQuery,
  PhotoPatch,
  BookEntryPatch,
  PurgeAuditInsert,
} from "../gateway";
import type { BookEntryRow, PhotoRow } from "../rows";

export const EVA_ROW: MemberRow = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "eva",
  display_name: "Eva",
  home_timezone: "America/New_York",
  created_at: "2026-07-20T12:00:00Z",
};

export const ADAM_ROW: MemberRow = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "adam",
  display_name: "Adam",
  home_timezone: "Asia/Jerusalem",
  created_at: "2026-07-20T12:00:00Z",
};

/** A minimal, valid `PhotoRow`. Tests override what they care about. */
export function row(
  overrides: Partial<PhotoRow> &
    Pick<PhotoRow, "id" | "author_member_id" | "shared_day" | "created_at">,
): PhotoRow {
  const base: PhotoRow = {
    id: overrides.id,
    client_uuid: overrides.id,
    kind: "daily",
    author_member_id: overrides.author_member_id,
    attribution_source: "self_declared",
    shared_day: overrides.shared_day,
    shared_day_tz: "America/New_York",
    client_reported_tz: null,
    taken_at: null,
    caption: null,
    storage_path_display: `p/${overrides.id}/display.jpg`,
    storage_path_thumb: `p/${overrides.id}/thumb.jpg`,
    storage_path_original: `p/${overrides.id}/original.jpg`,
    original_location: "supabase",
    width: 1200,
    height: 1600,
    bytes: 200_000,
    mime: "image/jpeg",
    color_space: "srgb",
    checksum_sha256: "a".repeat(64),
    exif_stripped: true,
    created_at: overrides.created_at,
    deleted_at: null,
    purge_requested_at: null,
    purged_at: null,
  };
  return { ...base, ...overrides };
}

class FakeGateway implements DataGateway {
  photos: PhotoRow[] = [];
  members: MemberRow[] = [EVA_ROW, ADAM_ROW];
  private notImplemented(method: string): never {
    throw new Error(
      `FakeGateway.${method} is not implemented — the functions under test do not call it.`,
    );
  }

  async listMembers(): Promise<MemberRow[]> {
    return this.members;
  }

  async listPhotos(query: PhotoPageQuery): Promise<PhotoRow[]> {
    let rows = this.photos.filter((p) => p.deleted_at === null && p.purged_at === null);
    if (query.kind !== undefined) rows = rows.filter((p) => p.kind === query.kind);
    if (query.from !== undefined) rows = rows.filter((p) => p.shared_day >= query.from!);
    if (query.to !== undefined) rows = rows.filter((p) => p.shared_day <= query.to!);

    // (created_at, id) descending — the same total order supabase-gateway.ts
    // sorts by.
    rows = [...rows].sort((a, b) =>
      a.created_at !== b.created_at
        ? b.created_at.localeCompare(a.created_at)
        : b.id.localeCompare(a.id),
    );

    if (query.before !== undefined) {
      const { createdAt, id } = query.before;
      rows = rows.filter(
        (p) =>
          p.created_at < createdAt || (p.created_at === createdAt && p.id < id),
      );
    }

    return rows.slice(0, query.limit);
  }

  async dailyPhotosForDay(sharedDay: string): Promise<PhotoRow[]> {
    return this.photos
      .filter(
        (p) =>
          p.kind === "daily" &&
          p.shared_day === sharedDay &&
          p.deleted_at === null &&
          p.purged_at === null,
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async countDaysTogether(): Promise<number> {
    const byDay = new Map<string, Set<string>>();
    for (const p of this.photos) {
      if (p.kind !== "daily" || p.purged_at !== null) continue;
      const slugs = byDay.get(p.shared_day) ?? new Set<string>();
      const member = this.members.find((m) => m.id === p.author_member_id);
      if (member) slugs.add(member.slug);
      byDay.set(p.shared_day, slugs);
    }
    return [...byDay.values()].filter((s) => s.has("eva") && s.has("adam")).length;
  }

  /* -- everything else: not used by the functions under test -- */

  insertPhotoIfAbsent(_row: PhotoRow): Promise<PhotoRow> {
    return this.notImplemented("insertPhotoIfAbsent");
  }
  findPhotoById(_id: string): Promise<PhotoRow | null> {
    return this.notImplemented("findPhotoById");
  }
  findPhotoByClientUuid(_clientUuid: string): Promise<PhotoRow | null> {
    return this.notImplemented("findPhotoByClientUuid");
  }
  updatePhoto(_id: string, _patch: PhotoPatch): Promise<PhotoRow | null> {
    return this.notImplemented("updatePhoto");
  }
  supersedePriorDaily(_args: {
    authorMemberId: string;
    sharedDay: string;
    exceptClientUuid: string;
    at: string;
  }): Promise<number> {
    return this.notImplemented("supersedePriorDaily");
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
  downloadObject(_path: string): Promise<ArrayBuffer | null> {
    return this.notImplemented("downloadObject");
  }
  removeObjects(_paths: readonly string[]): Promise<string[]> {
    return this.notImplemented("removeObjects");
  }
}

export function fakeGateway(): FakeGateway {
  return new FakeGateway();
}
