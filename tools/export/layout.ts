/**
 * layout.ts — path grammar and filename composition for the archive export
 *
 * Pure functions only. No I/O, no Supabase, no side effects.
 *
 * Filename shape:
 *   YYYY-MM-DD--<author>--<HHMM local>--<short id>.jpg
 *
 * Where:
 *   YYYY-MM-DD  — the photo's shared_day (the canonical date the photo belongs to)
 *   <author>    — member slug: 'eva' or 'adam' — never 'a'/'b'. Migration 02
 *                 explains why: couple.a / couple.b ordering disagrees with the
 *                 product name, so a letter index is a latent wrong-attribution bug
 *   <HHMM local>— hour and minute of taken_at (or created_at when taken_at is null)
 *                 in the author's home timezone (IANA). Falls back to '0000' when
 *                 neither timestamp is parseable.
 *   <short id>  — first 8 hex characters of the photo's uuid
 *
 * The filename carries the meaning: even if every index file is lost, the folder
 * still says what happened, when, and who posted it.
 */

import { join } from "node:path";

// ---------------------------------------------------------------------------
// Output root
// ---------------------------------------------------------------------------

/** Canonical name for the export folder. */
export const EXPORT_ROOT_NAME = "eva-and-adam-archive" as const;

// ---------------------------------------------------------------------------
// Filename building
// ---------------------------------------------------------------------------

/**
 * Local HHMM in the member's timezone for a given ISO timestamp.
 * Returns '0000' when the timestamp is null or unparseable.
 */
export function toHHMM(
  isoTimestamp: string | null,
  ianaTimezone: string,
): string {
  if (!isoTimestamp) return "0000";

  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return "0000";

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minutePart = parts.find((p) => p.type === "minute")?.value ?? "00";

    // Normalize: some implementations emit '24' for midnight.
    const h = String(parseInt(hourPart, 10) % 24).padStart(2, "0");
    const m = minutePart.padStart(2, "0");
    return `${h}${m}`;
  } catch {
    return "0000";
  }
}

/** First 8 hex characters of a uuid — short enough to be readable, unique enough to be useful. */
export function shortId(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8);
}

/**
 * Build the filename (no path) for a photo file.
 *
 * Example: '2026-08-03--eva--0930--a1b2c3d4.jpg'
 */
export function buildPhotoFilename(
  sharedDay: string,
  authorSlug: "eva" | "adam",
  takenAt: string | null,
  createdAt: string,
  memberHomeTimezone: string,
  photoId: string,
): string {
  const timestamp = takenAt ?? createdAt;
  const hhmm = toHHMM(timestamp, memberHomeTimezone);
  const id = shortId(photoId);
  return `${sharedDay}--${authorSlug}--${hhmm}--${id}.jpg`;
}

// ---------------------------------------------------------------------------
// Path building
// ---------------------------------------------------------------------------

/**
 * Relative path from the export root for a photo file.
 *
 * Example: 'photos/2026-08-03/2026-08-03--eva--0930--a1b2c3d4.jpg'
 */
export function buildPhotoRelativePath(
  sharedDay: string,
  filename: string,
): string {
  return join("photos", sharedDay, filename);
}

/**
 * Relative path from the export root for a vault item.
 * Vault items are written to private/, never to photos/.
 *
 * Example: 'private/2026-08-03/2026-08-03--eva--0930--a1b2c3d4.jpg'
 */
export function buildVaultRelativePath(
  sharedDay: string,
  filename: string,
): string {
  return join("private", sharedDay, filename);
}

// ---------------------------------------------------------------------------
// Directory structure helpers
// ---------------------------------------------------------------------------

/** All directories that must exist in the export output. */
export function listRequiredDirs(
  outputDir: string,
  includeVault: boolean,
): string[] {
  const dirs = [
    outputDir,
    join(outputDir, "photos"),
    join(outputDir, "book"),
    join(outputDir, "data"),
  ];
  if (includeVault) {
    dirs.push(join(outputDir, "private"));
  }
  return dirs;
}

/** Absolute path for a photo file on disk given the output root. */
export function absPhotoPath(outputDir: string, relativePath: string): string {
  return join(outputDir, relativePath);
}
