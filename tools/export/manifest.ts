/**
 * manifest.ts — CSV emitters for the archive export
 *
 * Pure functions only. No I/O, no Supabase, no side effects.
 *
 * CSV is the primary index format (criterion 4). A spreadsheet opens in ten
 * years without a browser. JSON needs code to read; CSV is already data.
 *
 * Escaping follows RFC 4180:
 *   - Fields containing commas, double-quotes, or newlines are wrapped in
 *     double-quote delimiters.
 *   - A double-quote inside a quoted field is escaped as two double-quotes.
 *   - Newlines inside a field are preserved (the row spans multiple lines in
 *     the file, which RFC 4180 explicitly allows).
 *
 * Real captions contain all three: commas (lists, parentheticals), quotes
 * (speech, scare quotes), and newlines (line breaks the author typed).
 * All three are tested in __tests__/manifest.test.ts.
 */

import type { DbPhoto, DbMember, DbBookEntry, DbDate, DbDateTurn } from "./read.ts";

// ---------------------------------------------------------------------------
// Core CSV escaping
// ---------------------------------------------------------------------------

/**
 * Escape a single CSV field value per RFC 4180.
 * Wraps in double-quotes when the value contains commas, double-quotes, or newlines.
 */
export function escapeCsvField(value: string | null | undefined): string {
  const s = value == null ? "" : String(value);

  // Fields needing quoting: contain comma, double-quote, CR, or LF.
  if (s.includes(",") || s.includes('"') || s.includes("\r") || s.includes("\n")) {
    // Escape internal double-quotes by doubling them, then wrap.
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a single CSV row from an array of values. */
export function csvRow(fields: ReadonlyArray<string | null | undefined>): string {
  return fields.map(escapeCsvField).join(",");
}

/** Build a complete CSV document from a header row and data rows. */
export function buildCsv(
  header: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string | null | undefined>>,
): string {
  const lines = [csvRow(header), ...rows.map(csvRow)];
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Per-table CSV exports (data/ folder)
// ---------------------------------------------------------------------------

export function buildMembersCsv(members: DbMember[]): string {
  return buildCsv(
    ["id", "slug", "display_name", "home_timezone", "created_at"],
    members.map((m) => [m.id, m.slug, m.display_name, m.home_timezone, m.created_at]),
  );
}

export function buildPhotosCsv(photos: DbPhoto[]): string {
  return buildCsv(
    [
      "id",
      "kind",
      "author_member_id",
      "shared_day",
      "shared_day_tz",
      "taken_at",
      "caption",
      "original_location",
      "storage_path_display",
      "storage_path_original",
      "checksum_sha256",
      "created_at",
    ],
    photos.map((p) => [
      p.id,
      p.kind,
      p.author_member_id,
      p.shared_day,
      p.shared_day_tz,
      p.taken_at,
      p.caption,
      p.original_location,
      p.storage_path_display,
      p.storage_path_original,
      p.checksum_sha256,
      p.created_at,
    ]),
  );
}

export function buildBookEntriesCsv(entries: DbBookEntry[]): string {
  return buildCsv(
    ["id", "photo_id", "date_id", "position", "caption", "date_label", "created_at"],
    entries.map((e) => [
      e.id,
      e.photo_id,
      e.date_id,
      String(e.position),
      e.caption,
      e.date_label,
      e.created_at,
    ]),
  );
}

export function buildDatesCsv(dates: DbDate[]): string {
  return buildCsv(
    ["id", "kind", "status", "started_by", "created_at", "finished_at"],
    dates.map((d) => [
      d.id,
      d.kind,
      d.status,
      d.started_by,
      d.created_at,
      d.finished_at,
    ]),
  );
}

export function buildDateTurnsCsv(turns: DbDateTurn[]): string {
  return buildCsv(
    ["id", "date_id", "member_id", "seq", "turn_kind", "body", "created_at"],
    turns.map((t) => [
      t.id,
      t.date_id,
      t.member_id,
      String(t.seq),
      t.turn_kind,
      t.body,
      t.created_at,
    ]),
  );
}

// ---------------------------------------------------------------------------
// index.csv — the primary browsable index of photos
// ---------------------------------------------------------------------------

export interface PhotoIndexRow {
  id: string;
  shared_day: string;
  author: "eva" | "adam";
  taken_at_local: string; // 'YYYY-MM-DD HH:MM' in author's timezone
  caption: string | null;
  kind: "daily" | "book";
  file_path: string; // relative from export root, e.g. 'photos/2026-08-03/...'
  /** 'original' when the original was downloaded; 'display' when only the 1600px variant exists. */
  file_variant: "original" | "display";
  checksum_sha256: string;
}

export function buildIndexCsv(rows: PhotoIndexRow[]): string {
  return buildCsv(
    [
      "id",
      "shared_day",
      "author",
      "taken_at_local",
      "caption",
      "kind",
      "file_path",
      "file_variant",
      "checksum_sha256",
    ],
    rows.map((r) => [
      r.id,
      r.shared_day,
      r.author,
      r.taken_at_local,
      r.caption,
      r.kind,
      r.file_path,
      r.file_variant,
      r.checksum_sha256,
    ]),
  );
}

// ---------------------------------------------------------------------------
// book/book.csv — the book layout
// ---------------------------------------------------------------------------

export interface BookIndexRow {
  entry_id: string;
  position: string;
  photo_file_path: string | null;
  date_id: string | null;
  caption: string | null;
  date_label: string | null;
  created_at: string;
}

export function buildBookCsv(rows: BookIndexRow[]): string {
  return buildCsv(
    ["entry_id", "position", "photo_file_path", "date_id", "caption", "date_label", "created_at"],
    rows.map((r) => [
      r.entry_id,
      r.position,
      r.photo_file_path,
      r.date_id,
      r.caption,
      r.date_label,
      r.created_at,
    ]),
  );
}
