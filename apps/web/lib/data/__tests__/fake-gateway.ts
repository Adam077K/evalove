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

import { DataError } from "../errors";
import { DATA_GATEWAY_METHODS } from "../gateway";
import type {
  DataGateway,
  DatePlanPatch,
  DatePlanQuery,
  MemberRow,
  PhotoPageQuery,
  PhotoPatch,
  BookEntryPatch,
  PurgeAuditInsert,
} from "../gateway";
import type { BookEntryRow, DatePlanRow, PhotoRow } from "../rows";

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

/** A minimal, valid `BookEntryRow` pointing at a photo. Tests override what they care about. */
export function bookEntryRow(
  overrides: Partial<BookEntryRow> & Pick<BookEntryRow, "id" | "photo_id" | "position">,
): BookEntryRow {
  const base: BookEntryRow = {
    id: overrides.id,
    photo_id: overrides.photo_id,
    date_id: null,
    position: overrides.position,
    caption: null,
    date_label: null,
    created_at: "2026-08-01T00:00:00Z",
    deleted_at: null,
  };
  return { ...base, ...overrides };
}

/** A minimal, valid `DatePlanRow`. Tests override what they care about. */
export function datePlanRow(
  overrides: Partial<DatePlanRow> &
    Pick<DatePlanRow, "id" | "kind" | "proposed_by" | "shared_day" | "window_id">,
): DatePlanRow {
  const base: DatePlanRow = {
    id: overrides.id,
    kind: overrides.kind,
    status: "proposed",
    proposed_by: overrides.proposed_by,
    shared_day: overrides.shared_day,
    window_id: overrides.window_id,
    starts_at: "2026-08-14T16:00:00.000Z",
    note: null,
    answered_by: null,
    answered_at: null,
    happened_at: null,
    created_at: "2026-08-10T12:00:00.000Z",
  };
  return { ...base, ...overrides };
}

class FakeGateway implements DataGateway {
  photos: PhotoRow[] = [];
  members: MemberRow[] = [EVA_ROW, ADAM_ROW];
  bookEntries: BookEntryRow[] = [];
  datePlans: DatePlanRow[] = [];
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
  findPhotoByChecksumSha256(_checksum: string): Promise<PhotoRow | null> {
    return this.notImplemented("findPhotoByChecksumSha256");
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
  async listBookEntries(): Promise<BookEntryRow[]> {
    return this.bookEntries
      .filter((e) => e.deleted_at === null)
      .sort((a, b) => a.position - b.position);
  }
  updateBookEntry(_id: string, _patch: BookEntryPatch): Promise<BookEntryRow | null> {
    return this.notImplemented("updateBookEntry");
  }

  /* -- date plans: real, because lib/data/dates.ts is tested against this -- */

  /**
   * Reimplements `date_plans_live_slot_idx` — the PARTIAL unique index on
   * (kind, shared_day, window_id) where status is 'proposed' or 'agreed'.
   *
   * Written out rather than stubbed because `proposeDate`'s whole
   * double-tap-is-idempotent branch hangs off this index refusing a second
   * insert. A fake that accepted every insert would let that branch go
   * permanently untested while the suite stayed green.
   */
  async insertDatePlan(row: DatePlanRow): Promise<DatePlanRow> {
    const clash = this.datePlans.find(
      (p) =>
        p.kind === row.kind &&
        p.shared_day === row.shared_day &&
        p.window_id === row.window_id &&
        (p.status === "proposed" || p.status === "agreed"),
    );
    if (clash !== undefined && (row.status === "proposed" || row.status === "agreed")) {
      throw new DataError("conflict", "insertDatePlan: duplicate key value", {
        code: "23505",
      });
    }
    this.datePlans.push(row);
    return row;
  }

  async findDatePlanById(id: string): Promise<DatePlanRow | null> {
    return this.datePlans.find((p) => p.id === id) ?? null;
  }

  async findLiveDatePlanInSlot(args: {
    kind: string;
    sharedDay: string;
    windowId: string;
  }): Promise<DatePlanRow | null> {
    return (
      this.datePlans.find(
        (p) =>
          p.kind === args.kind &&
          p.shared_day === args.sharedDay &&
          p.window_id === args.windowId &&
          (p.status === "proposed" || p.status === "agreed"),
      ) ?? null
    );
  }

  async listDatePlans(query: DatePlanQuery): Promise<DatePlanRow[]> {
    let rows = [...this.datePlans];
    if (query.statuses !== undefined) {
      rows = rows.filter((p) => query.statuses!.includes(p.status));
    }
    if (query.sharedDay !== undefined) {
      rows = rows.filter((p) => p.shared_day === query.sharedDay);
    }
    if (query.startingAtOrAfter !== undefined) {
      rows = rows.filter((p) => p.starts_at >= query.startingAtOrAfter!);
    }
    rows.sort((a, b) =>
      a.starts_at !== b.starts_at
        ? a.starts_at.localeCompare(b.starts_at)
        : a.id.localeCompare(b.id),
    );
    return rows.slice(0, query.limit);
  }

  async updateDatePlan(
    id: string,
    patch: DatePlanPatch,
  ): Promise<DatePlanRow | null> {
    const index = this.datePlans.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const current = this.datePlans[index];
    if (current === undefined) return null;
    const next: DatePlanRow = { ...current, ...patch };
    this.datePlans[index] = next;
    return next;
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

/**
 * Validates that every method declared on DataGateway is present as a function
 * on `gateway`. Call this in the constructor of any in-test FakeGateway stub.
 *
 * WHY: vitest uses esbuild (not tsc) to run tests. TypeScript's `implements
 * DataGateway` is erased — a stub that is silently missing a method passes
 * the type check at compile time but blows up with "is not a function" at
 * runtime, inside business logic, where the error message gives no hint about
 * which stub is incomplete. Calling assertGatewayComplete in the constructor
 * moves the failure to stub-construction time, where the message is explicit.
 *
 * The method list comes from DATA_GATEWAY_METHODS (gateway.ts), which is kept
 * exhaustive by `satisfies Record<keyof DataGateway, true>`. Adding a method
 * to DataGateway without updating that record is a TypeScript error, so the
 * two cannot drift.
 */
export function assertGatewayComplete(gateway: DataGateway, label = "stub"): void {
  for (const method of DATA_GATEWAY_METHODS) {
    if (typeof (gateway as unknown as Record<string, unknown>)[method] !== "function") {
      throw new Error(
        `Gateway stub "${label}" is missing method "${method}". ` +
          `The DataGateway interface was extended since this stub was written. ` +
          `Add "${method}" to prevent a silent TypeError at the call site in business logic.`,
      );
    }
  }
}
