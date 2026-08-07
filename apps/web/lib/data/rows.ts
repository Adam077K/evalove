/**
 * The wire shape of the tables this module owns, and the translation to and
 * from the domain types in `lib/types.ts`.
 *
 * PostgreSQL speaks snake_case and TypeScript speaks camelCase, and something
 * has to sit between them. That something is here and only here: no route
 * handler, no component and no other file in `lib/data` writes a column name
 * as a string literal. A column rename is then one file to change and one
 * compile error per call site, rather than a grep that misses the one spelling
 * that was inside a template string.
 *
 * `null` on the way out of the database becomes `undefined` on the way into
 * the domain, because `lib/types.ts` models absence with optional properties.
 * The two are not interchangeable at the JSON boundary — `{"caption": null}`
 * and `{}` are different documents, and the second is the one the domain
 * describes.
 */

import type {
  AttributionSource,
  BookEntry,
  ColorSpace,
  ImageMime,
  OriginalLocation,
  Photo,
  PhotoKind,
} from "@/lib/types";

/* ------------------------------------------------------------------ *
 * public.photos
 * ------------------------------------------------------------------ */

/** A row of `public.photos`, exactly as migration 03 declares it. */
export interface PhotoRow {
  id: string;
  client_uuid: string;
  kind: PhotoKind;
  /** `null` for a deliberately unsigned photo (migration 12). See the note
      on `Photo.authorMemberId` in `lib/types.ts`. */
  author_member_id: string | null;
  attribution_source: AttributionSource;

  shared_day: string;
  shared_day_tz: string;
  client_reported_tz: string | null;

  taken_at: string | null;
  caption: string | null;

  storage_path_display: string;
  storage_path_thumb: string;
  storage_path_original: string | null;
  original_location: OriginalLocation;

  width: number;
  height: number;
  bytes: number;
  mime: ImageMime;
  color_space: ColorSpace;
  checksum_sha256: string;
  exif_stripped: boolean;

  created_at: string;
  deleted_at: string | null;
  purge_requested_at: string | null;
  purged_at: string | null;
}

/** Every column of `public.photos`, for an explicit `select`. */
export const PHOTO_COLUMNS = [
  "id",
  "client_uuid",
  "kind",
  "author_member_id",
  "attribution_source",
  "shared_day",
  "shared_day_tz",
  "client_reported_tz",
  "taken_at",
  "caption",
  "storage_path_display",
  "storage_path_thumb",
  "storage_path_original",
  "original_location",
  "width",
  "height",
  "bytes",
  "mime",
  "color_space",
  "checksum_sha256",
  "exif_stripped",
  "created_at",
  "deleted_at",
  "purge_requested_at",
  "purged_at",
].join(",");

/** Drop a key entirely when the database said `null`. */
function optional<T>(value: T | null): { present: true; value: T } | null {
  return value === null ? null : { present: true, value };
}

/** Spread helper: `...maybe("caption", row.caption)`. */
function maybe<K extends string, T>(
  key: K,
  value: T | null,
): Record<K, T> | Record<string, never> {
  const held = optional(value);
  return held === null ? {} : ({ [key]: held.value } as Record<K, T>);
}

export function toPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    clientUuid: row.client_uuid,
    kind: row.kind,
    authorMemberId: row.author_member_id,
    attributionSource: row.attribution_source,

    sharedDay: row.shared_day,
    sharedDayTz: row.shared_day_tz,
    ...maybe("clientReportedTz", row.client_reported_tz),

    ...maybe("takenAt", row.taken_at),
    ...maybe("caption", row.caption),

    storagePathDisplay: row.storage_path_display,
    storagePathThumb: row.storage_path_thumb,
    ...maybe("storagePathOriginal", row.storage_path_original),
    originalLocation: row.original_location,

    width: row.width,
    height: row.height,
    bytes: row.bytes,
    mime: row.mime,
    colorSpace: row.color_space,
    checksumSha256: row.checksum_sha256,
    exifStripped: row.exif_stripped,

    createdAt: row.created_at,
    ...maybe("deletedAt", row.deleted_at),
    ...maybe("purgeRequestedAt", row.purge_requested_at),
    ...maybe("purgedAt", row.purged_at),
  };
}

/* ------------------------------------------------------------------ *
 * public.book_entries
 * ------------------------------------------------------------------ */

/**
 * A row of `public.book_entries`.
 *
 * `position` is `numeric` in the schema and PostgREST renders numeric as a
 * JSON number, so it arrives as a number here. The schema comment explains
 * why numeric and not int: a reorder writes one row by taking the midpoint of
 * its two neighbours, and between any two distinct numerics there is always
 * another one.
 */
export interface BookEntryRow {
  id: string;
  photo_id: string | null;
  date_id: string | null;
  position: number;
  caption: string | null;
  date_label: string | null;
  created_at: string;
  deleted_at: string | null;
}

export const BOOK_ENTRY_COLUMNS = [
  "id",
  "photo_id",
  "date_id",
  "position",
  "caption",
  "date_label",
  "created_at",
  "deleted_at",
].join(",");

/**
 * A row becomes one arm of the `BookEntry` union or the conversion refuses.
 *
 * The SQL enforces the XOR with a check constraint and the union enforces it
 * in the compiler; this function is the seam between the two, and it is the
 * one place where a row that satisfies neither could slip through. It throws
 * rather than guessing, because a book entry pointing at nothing is a bug in
 * the write path and hiding it here would leave that bug to be found by
 * whoever tries to render the page.
 */
export function toBookEntry(row: BookEntryRow): BookEntry {
  const base = {
    id: row.id,
    position: row.position,
    ...maybe("caption", row.caption),
    ...maybe("dateLabel", row.date_label),
    createdAt: row.created_at,
    ...maybe("deletedAt", row.deleted_at),
  };

  if (row.photo_id !== null && row.date_id === null) {
    return { ...base, photoId: row.photo_id };
  }
  if (row.date_id !== null && row.photo_id === null) {
    return { ...base, dateId: row.date_id };
  }

  throw new Error(
    `book_entries row ${row.id} satisfies neither arm of the photo/date XOR ` +
      `(photo_id=${String(row.photo_id)}, date_id=${String(row.date_id)}). ` +
      `The check constraint book_entry_is_photo_xor_date should have made this ` +
      `impossible; investigate the write that produced it.`,
  );
}
