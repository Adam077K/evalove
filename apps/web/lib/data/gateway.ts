/**
 * The port the photo logic talks to.
 *
 * Everything in `lib/data/photos.ts` and `lib/data/book.ts` is written against
 * this interface, not against `@supabase/supabase-js`. There are two reasons
 * and both of them matter.
 *
 * The first is testability. The rules worth protecting here — that one
 * `client_uuid` produces exactly one row, that `shared_day` is derived from
 * the author's zone and never from the client's claim, that a purge removes
 * all three derivatives and not just the visible one — are rules about
 * sequencing and derivation, not about PostgREST. Against a real client they
 * would be testable only with a live database; against this interface they are
 * testable in milliseconds, in CI, with no network and no credentials.
 *
 * The second is the boundary the CTO set: all Supabase access lives in
 * `lib/data/*`. A narrow port makes that enforceable by reading one file's
 * imports rather than by trusting everyone to remember.
 *
 * The Supabase implementation is `lib/data/supabase-gateway.ts`. It gets its
 * client from `lib/data/client.ts`, which is the only file in the app that
 * imports the Supabase SDK.
 */

import type { DatePlanStatus } from "@/lib/types";

import type { BookEntryRow, DatePlanRow, PhotoRow } from "./rows";

/* ------------------------------------------------------------------ *
 * Members
 * ------------------------------------------------------------------ */

export interface MemberRow {
  id: string;
  slug: "eva" | "adam";
  display_name: string;
  home_timezone: string;
  created_at: string;
}

/* ------------------------------------------------------------------ *
 * Purge audit
 * ------------------------------------------------------------------ */

export interface PurgeAuditInsert {
  item_id: string;
  item_table: "photos";
  requested_at: string;
  requested_by: string;
  ip: string | null;
}

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */

/**
 * A page request against `photos`.
 *
 * Keyset, not offset. `(created_at, id)` descending is a total order — id
 * breaks the tie when two photos land in the same millisecond — and paging by
 * the last key seen means a photo committed mid-scroll cannot shift a page
 * boundary and make the reader skip or repeat a row. `limit` is decided by the
 * caller and capped there.
 */
export interface PhotoPageQuery {
  kind?: "daily" | "book";
  /** Inclusive lower bound on `shared_day`. */
  from?: string;
  /** Inclusive upper bound on `shared_day`. */
  to?: string;
  /** Exclusive keyset cursor: return rows strictly older than this. */
  before?: { createdAt: string; id: string };
  limit: number;
}

/** The columns a purge is allowed to write. Deliberately not `Partial<PhotoRow>`. */
export interface PhotoPatch {
  caption?: null;
  taken_at?: null;
  client_reported_tz?: null;
  storage_path_display?: string;
  storage_path_thumb?: string;
  storage_path_original?: null;
  original_location?: "none" | "supabase" | "r2" | "purged";
  checksum_sha256?: string;
  deleted_at?: string | null;
  purge_requested_at?: string | null;
  purged_at?: string | null;
}

/** The columns a book-entry PATCH is allowed to write. */
export interface BookEntryPatch {
  position?: number;
  caption?: string | null;
  date_label?: string | null;
}

/**
 * A read against `date_plans`.
 *
 * No keyset cursor and no `before`. This table holds one row per date two
 * people propose to each other, so the whole live set fits in a single small
 * page; a paging contract here would be machinery guarding nothing. `limit` is
 * still required so a bug cannot turn into an unbounded select.
 */
export interface DatePlanQuery {
  /** Restrict to these statuses. Omitted means every status. */
  statuses?: readonly DatePlanStatus[];
  /** Only plans filed under this shared day. */
  sharedDay?: string;
  /** Only plans starting at or after this instant. */
  startingAtOrAfter?: string;
  limit: number;
}

/**
 * The columns an answer or a marking is allowed to write.
 *
 * Deliberately not `Partial<DatePlanRow>`: `kind`, `shared_day`, `window_id`
 * and `starts_at` are what was agreed, and nothing in this application may
 * quietly move a date after the fact. Changing when it happens means proposing
 * a different one.
 */
export interface DatePlanPatch {
  status?: DatePlanStatus;
  answered_by?: string | null;
  answered_at?: string | null;
  happened_at?: string | null;
}

/* ------------------------------------------------------------------ *
 * The port
 * ------------------------------------------------------------------ */

export interface DataGateway {
  /* -- members ---------------------------------------------------- */

  /** The roster. Two rows, forever. */
  listMembers(): Promise<MemberRow[]>;

  /* -- photos ----------------------------------------------------- */

  /**
   * Insert, or do nothing if this `client_uuid` is already taken.
   *
   * Implements `on conflict (client_uuid) do nothing` and then returns the row
   * that actually holds the key — the one just written, or the one that was
   * already there. The caller cannot tell the two apart and must not need to:
   * that indistinguishability IS the idempotency guarantee, and a caller that
   * branched on it would have re-introduced the double-flush bug.
   */
  insertPhotoIfAbsent(row: PhotoRow): Promise<PhotoRow>;

  findPhotoById(id: string): Promise<PhotoRow | null>;

  findPhotoByClientUuid(clientUuid: string): Promise<PhotoRow | null>;

  /**
   * Find a live (not purged) photo whose bytes matched this SHA-256 checksum.
   *
   * Used by the book-photo commit path to detect content-identical photographs
   * before a second row is written. Scoped to non-purged rows only: a purged
   * photo is destroyed and the slot is available again — a re-upload of the same
   * bytes after a purge is not a duplicate, it is a new photo.
   *
   * Returns the first row found, or `null` if no live photo carries this digest.
   */
  findPhotoByChecksumSha256(checksum: string): Promise<PhotoRow | null>;

  listPhotos(query: PhotoPageQuery): Promise<PhotoRow[]>;

  /** Live daily photos for one shared day, both authors. */
  dailyPhotosForDay(sharedDay: string): Promise<PhotoRow[]>;

  updatePhoto(id: string, patch: PhotoPatch): Promise<PhotoRow | null>;

  /**
   * Soft-delete the live daily this author already has on this day.
   *
   * Scoped to a *different* `client_uuid` so that replaying one commit can
   * never soft-delete the row that commit itself produced. Returns how many
   * rows were retired, which is 0 or 1 — the unique index in migration 03
   * cannot allow more.
   */
  supersedePriorDaily(args: {
    authorMemberId: string;
    sharedDay: string;
    exceptClientUuid: string;
    at: string;
  }): Promise<number>;

  /* -- the tally -------------------------------------------------- */

  /**
   * `select count(*) from v_days_together`.
   *
   * Read, never recomputed. The view filters on `purged_at`, not `deleted_at`,
   * on purpose — tidying an old photo must not retroactively erase a day they
   * both showed up for — and any tally assembled here from `photos` would
   * quietly lose that property.
   */
  countDaysTogether(): Promise<number>;

  /* -- purge audit ------------------------------------------------ */

  countPurgeRequestsSince(since: string): Promise<number>;

  insertPurgeAudit(row: PurgeAuditInsert): Promise<number>;

  markPurgeAuditStoragePurged(auditId: number, at: string): Promise<void>;

  /* -- book ------------------------------------------------------- */

  listBookEntries(): Promise<BookEntryRow[]>;

  updateBookEntry(id: string, patch: BookEntryPatch): Promise<BookEntryRow | null>;

  /* -- date plans ------------------------------------------------- */

  /**
   * Insert a proposal.
   *
   * Throws `DataError('conflict')` when the partial unique index refuses it —
   * which is the double-tap case, not a caller error. `proposeDate` turns that
   * into the row that is already there, so asking twice reads as asking once.
   */
  insertDatePlan(row: DatePlanRow): Promise<DatePlanRow>;

  findDatePlanById(id: string): Promise<DatePlanRow | null>;

  /**
   * The live plan occupying one (kind, day, window) slot, if there is one.
   *
   * Live means `proposed` or `agreed` — the two statuses the partial unique
   * index covers. Used to answer a double-tap with the existing row.
   */
  findLiveDatePlanInSlot(args: {
    kind: string;
    sharedDay: string;
    windowId: string;
  }): Promise<DatePlanRow | null>;

  listDatePlans(query: DatePlanQuery): Promise<DatePlanRow[]>;

  updateDatePlan(id: string, patch: DatePlanPatch): Promise<DatePlanRow | null>;

  /* -- storage ---------------------------------------------------- */

  /**
   * A write-only, single-path upload authorisation.
   *
   * One call, one object name. Nothing about the returned credential permits a
   * read, a list, or a write to any other path.
   */
  createSignedUploadUrl(path: string): Promise<{ url: string; token: string }>;

  /** The bytes of one object, or `null` if the object is not there. */
  downloadObject(path: string): Promise<ArrayBuffer | null>;

  /**
   * Delete objects. Returns the paths storage confirmed it removed.
   *
   * A path that was already absent is not an error — a purge retried after a
   * partial failure must be able to finish.
   */
  removeObjects(paths: readonly string[]): Promise<string[]>;
}

/**
 * Exhaustive list of every method declared on DataGateway.
 *
 * The `satisfies Record<keyof DataGateway, true>` makes this a compile-time
 * check: if DataGateway grows a method and this record is not updated,
 * TypeScript errors here rather than silently dropping the method from the
 * list. That means DATA_GATEWAY_METHODS is always complete — which in turn
 * means assertGatewayComplete (fake-gateway.ts) can catch stubs that are
 * missing a method at stub-construction time rather than at the call site
 * inside business logic.
 */
const _GATEWAY_METHOD_EXHAUSTIVE = {
  listMembers: true,
  insertPhotoIfAbsent: true,
  findPhotoById: true,
  findPhotoByClientUuid: true,
  findPhotoByChecksumSha256: true,
  listPhotos: true,
  dailyPhotosForDay: true,
  updatePhoto: true,
  supersedePriorDaily: true,
  countDaysTogether: true,
  countPurgeRequestsSince: true,
  insertPurgeAudit: true,
  markPurgeAuditStoragePurged: true,
  listBookEntries: true,
  updateBookEntry: true,
  insertDatePlan: true,
  findDatePlanById: true,
  findLiveDatePlanInSlot: true,
  listDatePlans: true,
  updateDatePlan: true,
  createSignedUploadUrl: true,
  downloadObject: true,
  removeObjects: true,
} satisfies Record<keyof DataGateway, true>;

/** All method names declared on DataGateway. Always in sync with the interface via the satisfies above. */
export const DATA_GATEWAY_METHODS = Object.keys(
  _GATEWAY_METHOD_EXHAUSTIVE,
) as Array<keyof DataGateway>;
