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

import type { BookEntryRow, PhotoRow } from "./rows";

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
