/**
 * Photos: issue, commit, read, delete, purge.
 *
 * Every rule that has consequences lives in this file rather than in a route
 * handler, because a rule that only holds in an HTTP handler is a rule that
 * does not hold in a test. The handlers below `app/api/photos/` validate their
 * input and call in here; they contain no product logic at all.
 *
 * The four things this file is careful about:
 *
 *   1. `client_uuid` is the idempotency key, end to end. The same key twice
 *      produces exactly one row and both callers see the same photo. A double
 *      flush from the offline outbox is a normal event, not an incident.
 *
 *   2. `shared_day` is derived here, server-side, from the AUTHOR's resolved
 *      zone, and the same instant used to derive it is written to
 *      `created_at`. The database re-derives it in the trigger from migration
 *      08 and rejects the write with SQLSTATE 23514 if the two disagree. That
 *      check is the point; the way to never see it is to compute the value
 *      correctly, not to work around it.
 *
 *   3. Photo bytes never traverse a Vercel function on the way IN. The upload
 *      is a signed, write-only, single-path authorisation and the browser PUTs
 *      straight to Supabase Storage, which is what dodges the 4.5 MB request
 *      body limit on a serverless function.
 *
 *   4. A purge is not a bigger delete. It removes all three derivatives —
 *      display, thumb and original, not just the visible one — writes an audit
 *      row, and leaves the photo row behind as a tombstone with its content
 *      columns emptied, so that restoring a backup cannot resurrect it.
 */

import {
  MS_SECOND,
  boundsOf,
  resolveTz,
  sharedDayOf,
} from "@/lib/shared-day";
import {
  photoDisplayPath,
  photoOriginalPath,
  photoThumbPath,
} from "@/lib/schema";
import type {
  ColorSpace,
  IanaTimeZone,
  IsoDate,
  IsoDateTime,
  MemberSlug,
  Photo,
  PhotoKind,
  Uuid,
} from "@/lib/types";

import { DataError } from "./errors";
import type { DataGateway, MemberRow, PhotoPageQuery } from "./gateway";
import { toPhoto, type PhotoRow } from "./rows";

/* ------------------------------------------------------------------ *
 * Dependencies
 * ------------------------------------------------------------------ */

/**
 * What this module needs from the outside world.
 *
 * `now` is injected rather than called directly so that a test can pin an
 * instant. Every day-boundary bug this product can have is a bug about which
 * instant was used, and a test that cannot choose the instant cannot find one.
 */
export interface PhotoDeps {
  gateway: DataGateway;
  now: () => Date;
  /** Fresh photo ids. Injected so an issuance test can predict the paths. */
  newId: () => Uuid;
}

/* ------------------------------------------------------------------ *
 * Upload authorisation
 * ------------------------------------------------------------------ */

/**
 * How many photos one issuance call may authorise.
 *
 * The cap is not politeness. A signed upload URL is short-lived, and a batch
 * of thirty photos takes longer to upload than one of these URLs stays valid —
 * so the last ones in the batch would be issued, sit in a queue, and expire
 * before their turn. Issuing in chunks of five, just in time, means a URL is
 * used within seconds of being minted no matter how large the batch is. The
 * client asks again for the next five.
 */
export const MAX_UPLOAD_URLS_PER_REQUEST = 5;

/**
 * How long the caller may consider an issued URL usable, in milliseconds.
 *
 * KNOWN LIMIT, WRITTEN DOWN RATHER THAN HIDDEN: `createSignedUploadUrl` in
 * `@supabase/storage-js` takes no expiry argument — the token's real lifetime
 * is set by the storage service, not by us, and this constant cannot shorten
 * it. What this value does is define the contract on our side: the response
 * carries `expiresAt`, a client must not start an upload after it, and an
 * expired slot is re-issued rather than retried. Combined with the chunk cap
 * above, that keeps every URL young in practice, which is the property the
 * short TTL was for. Lowering the service-side ceiling needs a Supabase
 * project setting and is out of this module's reach.
 */
export const UPLOAD_URL_TTL_MS = 2 * 60 * 1000;

/** The three objects every photo has. All three are uploaded, always. */
export interface UploadTargets {
  display: SignedUpload;
  thumb: SignedUpload;
  original: SignedUpload;
}

export interface SignedUpload {
  /** Object name inside the media bucket. Never assembled by the client. */
  path: string;
  /** Write-only, single-path. Confers no read, no list, no other path. */
  url: string;
  token: string;
}

export interface UploadSlot {
  photoId: Uuid;
  urls: UploadTargets;
  /** Do not start an upload after this instant; ask for a new slot instead. */
  expiresAt: IsoDateTime;
}

/**
 * Mint `count` upload slots.
 *
 * The photo id is generated HERE, before any bytes exist, because the id names
 * the storage paths (`p/{id}/display.jpg`) and the same id has to be reachable
 * from the client's outbox entry so that a retry lands on the same three
 * objects rather than orphaning the first attempt's bytes.
 *
 * All three variants are authorised together and the client commits only once
 * all three have landed. That is what makes `original_location = 'supabase'`
 * a true statement at commit time, and it is what lets a purge delete three
 * known paths instead of guessing which ones exist.
 */
export async function issueUploadSlots(
  deps: PhotoDeps,
  input: { kind: PhotoKind; count: number },
): Promise<UploadSlot[]> {
  if (!Number.isSafeInteger(input.count) || input.count < 1) {
    throw new DataError("invalid", "count must be a positive integer", {
      count: input.count,
    });
  }
  if (input.count > MAX_UPLOAD_URLS_PER_REQUEST) {
    throw new DataError(
      "invalid",
      `count must be at most ${MAX_UPLOAD_URLS_PER_REQUEST}; ask again for the next chunk`,
      { count: input.count },
    );
  }

  const expiresAt = new Date(
    deps.now().getTime() + UPLOAD_URL_TTL_MS,
  ).toISOString();

  const slots: UploadSlot[] = [];
  for (let i = 0; i < input.count; i += 1) {
    const photoId = deps.newId();
    const [display, thumb, original] = await Promise.all([
      signOne(deps, photoDisplayPath(photoId)),
      signOne(deps, photoThumbPath(photoId)),
      signOne(deps, photoOriginalPath(photoId)),
    ]);
    slots.push({ photoId, urls: { display, thumb, original }, expiresAt });
  }
  return slots;
}

async function signOne(deps: PhotoDeps, path: string): Promise<SignedUpload> {
  const signed = await deps.gateway.createSignedUploadUrl(path);
  return { path, url: signed.url, token: signed.token };
}

/* ------------------------------------------------------------------ *
 * Commit
 * ------------------------------------------------------------------ */

export interface CommitPhotoInput {
  /** The idempotency key. Generated by the client, stable across retries. */
  clientUuid: Uuid;
  /** The id issued by `issueUploadSlots`. Names the three storage objects. */
  photoId: Uuid;
  kind: PhotoKind;
  /** Who says they took it. Self-declared unless the session proves otherwise. */
  author: MemberSlug;
  /** What the device claims its zone is. Advisory — see `resolveTz`. */
  clientTz?: IanaTimeZone;
  takenAt?: IsoDateTime;
  caption?: string;
  width: number;
  height: number;
  bytes: number;
  colorSpace: ColorSpace;
  checksumSha256: string;
}

export interface CommitPhotoResult {
  photo: Photo;
  /**
   * False when this `client_uuid` had already been committed.
   *
   * Exposed for logging and for the route's status code, and for nothing else.
   * No product behaviour may branch on it: the whole promise of the key is
   * that the caller does not have to care which flush won.
   */
  created: boolean;
}

/**
 * Write the permanent record for one photo.
 *
 * Order matters and is not arbitrary:
 *
 *   1. Look the key up. A hit returns immediately, before anything is written
 *      and before any prior daily is retired — a replayed flush must not have
 *      side effects.
 *   2. Resolve the author and their zone from the roster.
 *   3. Take ONE instant. It is both the derivation input and the row's
 *      `created_at`; see the note on `createdAt` below.
 *   4. Retire the author's prior live daily for that day, if there is one.
 *   5. Insert, ignoring a duplicate key, and read back whoever holds it.
 */
export async function commitPhoto(
  deps: PhotoDeps,
  input: CommitPhotoInput,
  identity: { memberId?: Uuid; authenticated: boolean },
): Promise<CommitPhotoResult> {
  const existing = await deps.gateway.findPhotoByClientUuid(input.clientUuid);
  if (existing !== null) {
    return { photo: toPhoto(existing), created: false };
  }

  const member = await memberBySlug(deps, input.author);

  /*
   * ONE INSTANT, USED TWICE, AND SENT EXPLICITLY.
   *
   * `photos.created_at` defaults to `now()`, so it is tempting to leave the
   * column out and let the database fill it. That would be a real bug rather
   * than a stylistic one: this code would derive `shared_day` from the instant
   * it read here, the database would fill `created_at` with an instant some
   * milliseconds later, and the trigger from migration 08 compares the two. A
   * commit that happens to straddle local midnight would then be rejected with
   * 23514 — rarely, unreproducibly, and always at midnight.
   *
   * So the instant is captured once and written down. The application and the
   * database are then comparing the same number, and the only way they can
   * disagree is if the derivation itself is wrong, which is exactly what the
   * trigger exists to catch.
   */
  const createdAt = deps.now();

  const sharedDayTz = resolveTz(input.clientTz, member.home_timezone);
  const sharedDay = sharedDayOf(createdAt, sharedDayTz);

  if (input.kind === "daily") {
    await deps.gateway.supersedePriorDaily({
      authorMemberId: member.id,
      sharedDay,
      exceptClientUuid: input.clientUuid,
      at: createdAt.toISOString(),
    });
  }

  const row: PhotoRow = {
    id: input.photoId,
    client_uuid: input.clientUuid,
    kind: input.kind,
    author_member_id: member.id,
    attribution_source:
      identity.authenticated && identity.memberId === member.id
        ? "authenticated"
        : "self_declared",

    shared_day: sharedDay,
    shared_day_tz: sharedDayTz,
    client_reported_tz: input.clientTz ?? null,

    taken_at: input.takenAt ?? null,
    caption: input.caption ?? null,

    storage_path_display: photoDisplayPath(input.photoId),
    storage_path_thumb: photoThumbPath(input.photoId),
    storage_path_original: photoOriginalPath(input.photoId),
    original_location: "supabase",

    width: input.width,
    height: input.height,
    bytes: input.bytes,
    mime: "image/jpeg",
    color_space: input.colorSpace,
    checksum_sha256: input.checksumSha256,
    // The client strips EXIF while it resizes; the server never sees the
    // untouched file and so cannot re-verify this. Recorded as the claim it
    // is, in the column the schema already defaults to true.
    exif_stripped: true,

    created_at: createdAt.toISOString(),
    deleted_at: null,
    purge_requested_at: null,
    purged_at: null,
  };

  const written = await deps.gateway.insertPhotoIfAbsent(row);
  return { photo: toPhoto(written), created: written.id === input.photoId };
}

/* ------------------------------------------------------------------ *
 * Read
 * ------------------------------------------------------------------ */

/** The page size a caller gets when it does not ask for one. */
export const DEFAULT_PAGE_SIZE = 30;
/** The largest page anyone gets. An unbounded list is a slow query waiting. */
export const MAX_PAGE_SIZE = 100;

export interface ListPhotosInput {
  kind?: PhotoKind;
  from?: IsoDate;
  to?: IsoDate;
  cursor?: string;
  limit?: number;
}

export interface ListPhotosResult {
  photos: Photo[];
  /** Pass back as `?cursor=`. `null` when this was the last page. */
  nextCursor: string | null;
}

export async function listPhotos(
  deps: PhotoDeps,
  input: ListPhotosInput,
): Promise<ListPhotosResult> {
  const limit = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const query: PhotoPageQuery = { limit: limit + 1 };
  if (input.kind !== undefined) query.kind = input.kind;
  if (input.from !== undefined) query.from = input.from;
  if (input.to !== undefined) query.to = input.to;
  if (input.cursor !== undefined) query.before = decodeCursor(input.cursor);

  // One row more than asked for: its existence is how we know there is a next
  // page, without a second count query that would be wrong the moment it ran.
  const rows = await deps.gateway.listPhotos(query);
  const page = rows.slice(0, limit);
  const last = page.at(-1);

  return {
    photos: page.map(toPhoto),
    nextCursor:
      rows.length > limit && last !== undefined
        ? encodeCursor({ createdAt: last.created_at, id: last.id })
        : null,
  };
}

/**
 * The cursor is an opaque string and must stay that way.
 *
 * base64url of `created_at|id`. Not encrypted and not signed — it contains
 * nothing that is not already in the response it came from — but opaque enough
 * that no client starts parsing it and depending on the ordering key, which is
 * the thing we would want to be free to change.
 */
function encodeCursor(key: { createdAt: string; id: string }): string {
  return Buffer.from(`${key.createdAt}|${key.id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const raw = Buffer.from(cursor, "base64url").toString("utf8");
  const sep = raw.lastIndexOf("|");
  const createdAt = sep === -1 ? "" : raw.slice(0, sep);
  const id = sep === -1 ? "" : raw.slice(sep + 1);

  if (createdAt === "" || id === "" || Number.isNaN(Date.parse(createdAt))) {
    throw new DataError("invalid", "cursor is not a cursor this API issued", {
      cursor,
    });
  }
  return { createdAt, id };
}

/* ------------------------------------------------------------------ *
 * The read proxy
 * ------------------------------------------------------------------ */

export type PhotoVariant = "display" | "thumb";

export interface PhotoBytes {
  body: ArrayBuffer;
  contentType: "image/jpeg";
}

/**
 * The bytes behind `/p/{id}/{variant}.jpg`.
 *
 * A soft-deleted photo still serves. A soft delete hides a photo from the
 * interface and is reversible; refusing to serve bytes that are still there,
 * on a URL every offline cache already holds, would be theatre. A PURGED photo
 * does not serve, because there is genuinely nothing left — that is the
 * difference between the two operations, expressed at the one place a reader
 * would notice it.
 */
export async function readPhotoBytes(
  deps: PhotoDeps,
  photoId: Uuid,
  variant: PhotoVariant,
): Promise<PhotoBytes> {
  const row = await deps.gateway.findPhotoById(photoId);
  if (row === null) {
    throw new DataError("not_found", "no such photo", { photoId });
  }
  if (row.purged_at !== null) {
    throw new DataError("not_found", "this photo was purged", {
      photoId,
      purgedAt: row.purged_at,
    });
  }

  const path =
    variant === "display" ? row.storage_path_display : row.storage_path_thumb;

  const body = await deps.gateway.downloadObject(path);
  if (body === null) {
    throw new DataError("not_found", "the object is not in storage", {
      photoId,
      path,
    });
  }
  return { body, contentType: "image/jpeg" };
}

/* ------------------------------------------------------------------ *
 * Delete
 * ------------------------------------------------------------------ */

/**
 * Soft delete. Hidden from the interface, bytes untouched, fully reversible.
 *
 * Note what this does NOT do: it does not change the tally. `v_days_together`
 * filters on `purged_at`, not on `deleted_at`, precisely so that tidying up an
 * old photo cannot retroactively erase a day they both showed up for.
 */
export async function softDeletePhoto(
  deps: PhotoDeps,
  photoId: Uuid,
): Promise<void> {
  const row = await deps.gateway.findPhotoById(photoId);
  if (row === null) {
    throw new DataError("not_found", "no such photo", { photoId });
  }
  if (row.purged_at !== null) {
    throw new DataError("not_found", "this photo was purged", { photoId });
  }
  if (row.deleted_at !== null) return; // Already hidden. Deleting twice is fine.

  await deps.gateway.updatePhoto(photoId, {
    deleted_at: deps.now().toISOString(),
  });
}

/* ------------------------------------------------------------------ *
 * Purge
 * ------------------------------------------------------------------ */

/**
 * How many purges may be requested in a rolling day.
 *
 * A purge is irreversible and it is the only operation in this product that
 * destroys something. The cap is not about load; it is a speed bump in front
 * of the one action nobody can take back — a script, a stuck retry loop or a
 * very bad evening cannot empty the book before somebody notices.
 */
export const PURGE_LIMIT_PER_DAY = 20;
const PURGE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface PurgeRequest {
  /** Member slug, self-declared. Recorded as the claim it is. */
  requestedBy: string;
  /** Caller IP, when the platform gave us one. */
  ip?: string;
}

export interface PurgeResult {
  photoId: Uuid;
  purgedAt: IsoDateTime;
  /** The object names storage confirmed are gone. */
  objectsRemoved: string[];
  auditId: number;
}

/**
 * Destroy the bytes. Keep the receipt.
 *
 * The sequence is deliberate and each step is recoverable if the next one
 * fails:
 *
 *   1. Mark the request on the row. If everything after this dies, the photo
 *      is visibly pending a purge rather than silently intact.
 *   2. Write the audit row FIRST, before deleting anything. An audit written
 *      after the deletion is an audit that can be missing for the deletions
 *      that crashed halfway — which is the only case anyone will ever want it
 *      for.
 *   3. Remove all three derivatives: display, thumb AND original. Deleting
 *      only the display copy is the mistake this list exists to prevent; the
 *      thumb is a legible picture and the original is the whole file.
 *   4. Empty the row's content columns and set `purged_at`. What remains is a
 *      tombstone: the id, the timestamps, the author and the day. Restoring a
 *      database backup taken before the purge would bring the row back, but
 *      the bytes it points at are gone from storage and the tombstone records
 *      that they were destroyed on purpose. That is what makes the deletion
 *      provable rather than merely claimed.
 *
 * `client_uuid` is deliberately KEPT. It is the idempotency key, and leaving
 * it in place means a stale outbox entry replaying the same commit finds the
 * tombstone and returns it, instead of writing the photo back into existence.
 */
export async function purgePhoto(
  deps: PhotoDeps,
  photoId: Uuid,
  request: PurgeRequest,
): Promise<PurgeResult> {
  const row = await deps.gateway.findPhotoById(photoId);
  if (row === null) {
    throw new DataError("not_found", "no such photo", { photoId });
  }
  if (row.purged_at !== null) {
    throw new DataError("conflict", "this photo has already been purged", {
      photoId,
      purgedAt: row.purged_at,
    });
  }

  const now = deps.now();
  const since = new Date(now.getTime() - PURGE_WINDOW_MS).toISOString();
  const recent = await deps.gateway.countPurgeRequestsSince(since);
  if (recent >= PURGE_LIMIT_PER_DAY) {
    throw new DataError(
      "rate_limited",
      `at most ${PURGE_LIMIT_PER_DAY} purges may be requested in 24 hours`,
      { requested: recent, since },
    );
  }

  const requestedAt = now.toISOString();

  await deps.gateway.updatePhoto(photoId, { purge_requested_at: requestedAt });

  const auditId = await deps.gateway.insertPurgeAudit({
    item_id: photoId,
    item_table: "photos",
    requested_at: requestedAt,
    requested_by: request.requestedBy,
    ip: request.ip ?? null,
  });

  // All three. The original is the one that gets forgotten, and it is the one
  // that still has the full-resolution picture in it.
  const targets = [
    row.storage_path_display,
    row.storage_path_thumb,
    row.storage_path_original ?? photoOriginalPath(photoId),
  ];
  const objectsRemoved = await deps.gateway.removeObjects(targets);

  await deps.gateway.markPurgeAuditStoragePurged(auditId, requestedAt);

  await deps.gateway.updatePhoto(photoId, {
    caption: null,
    taken_at: null,
    client_reported_tz: null,
    // NOT NULL columns cannot be nulled, so they are emptied. An empty object
    // name matches nothing in the bucket and reads unmistakably as "no bytes".
    storage_path_display: "",
    storage_path_thumb: "",
    storage_path_original: null,
    checksum_sha256: "",
    original_location: "purged",
    deleted_at: row.deleted_at ?? requestedAt,
    purged_at: requestedAt,
  });

  return { photoId, purgedAt: requestedAt, objectsRemoved, auditId };
}

/* ------------------------------------------------------------------ *
 * Today
 * ------------------------------------------------------------------ */

export interface TodaySnapshot {
  /** The shared day, as the viewer is living it. */
  day: IsoDate;
  eva: Photo | null;
  adam: Photo | null;
  /**
   * The instant this day stops accepting a photo, exclusive.
   *
   * A day is PENDING until it is over. It is never missed, and nothing in this
   * system can mark it lost — there is no counter, no break job and no decay
   * timer anywhere in the schema. This field is what "still time" means.
   */
  pendingUntil: IsoDateTime;
  /** `count(*)` over `v_days_together`. Read from the view, never recomputed. */
  daysTogether: number;
}

export async function todaySnapshot(
  deps: PhotoDeps,
  viewer: { slug: MemberSlug; clientTz?: IanaTimeZone },
): Promise<TodaySnapshot> {
  const member = await memberBySlug(deps, viewer.slug);
  const tz = resolveTz(viewer.clientTz, member.home_timezone);
  const day = sharedDayOf(deps.now(), tz);

  const [rows, roster, daysTogether] = await Promise.all([
    deps.gateway.dailyPhotosForDay(day),
    deps.gateway.listMembers(),
    deps.gateway.countDaysTogether(),
  ]);

  const slugById = new Map(roster.map((m) => [m.id, m.slug]));
  const bySlug = new Map<MemberSlug, PhotoRow>();
  for (const row of rows) {
    const slug = slugById.get(row.author_member_id);
    if (slug !== undefined) bySlug.set(slug, row);
  }

  const eva = bySlug.get("eva");
  const adam = bySlug.get("adam");

  return {
    day,
    eva: eva === undefined ? null : toPhoto(eva),
    adam: adam === undefined ? null : toPhoto(adam),
    // `boundsOf().close` is the last whole second of the day; the exclusive
    // end is one second later. Reporting `close` here would tell the interface
    // the day was over one second before it is.
    pendingUntil: new Date(
      boundsOf(day).close.getTime() + MS_SECOND,
    ).toISOString(),
    daysTogether,
  };
}

/* ------------------------------------------------------------------ *
 * Roster
 * ------------------------------------------------------------------ */

/**
 * The member row for a slug.
 *
 * Read from the database rather than from `MEMBER_PROFILES`, because
 * `home_timezone` is the authority for the day boundary and the database is
 * where a zone change gets recorded. A built-in constant would keep filing
 * photos under the old zone for as long as nobody redeployed.
 */
async function memberBySlug(
  deps: PhotoDeps,
  slug: MemberSlug,
): Promise<MemberRow> {
  const roster = await deps.gateway.listMembers();
  const member = roster.find((m) => m.slug === slug);
  if (member === undefined) {
    throw new DataError("invalid", `no member with slug "${slug}"`, { slug });
  }
  return member;
}
