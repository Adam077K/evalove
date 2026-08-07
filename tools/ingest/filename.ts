/**
 * filename.ts — the DD:MM:YY[-N].EXT grammar the founder named these files with.
 *
 * `24:7:26-10.HEIC` = 24 July 2026, item 10. The `:` separators are literal —
 * these are macOS filenames, not paths, so a colon in a `basename` is legal.
 * The trailing `-N` counter is meaningless (not a time, not a sequence within
 * the day in any useful order) and is discarded once it has served to make the
 * filename unique.
 *
 * Two corrections are hard-coded here because they were established by hand
 * (byte comparison, EXIF read) by the three cataloguing passes and are cheap
 * to encode as data rather than re-derived on every run:
 *
 *   - `24:7:26-11.HEIC` and `24:7:26-12.HEIC` are byte-identical (MD5 match).
 *     `-12` is the one dropped; see DUPLICATE_DROPS.
 *   - `24:7:26-21.HEIC`'s EXIF capture date is 2026-07-23, one day before the
 *     filename. The filename date is authoritative per the founder's explicit
 *     instruction — he named these by hand — so `isoDate` below is always the
 *     filename date. `exifDate` is carried separately, only for the record.
 */

export type MediaKind = "image" | "video";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "heic"]);
const VIDEO_EXTENSIONS = new Set(["mov", "mp4"]);

/**
 * `DD:MM:YY` optionally followed by `-<counter>`, then a `.` and an extension.
 * Day and month are 1 or 2 digits, unpadded in the source (`1:8:26-1.MOV`,
 * `16:7:26.JPG`). Year is always 2 digits, and every file in this batch is
 * 2026, so the century is hard-coded rather than guessed from a pivot year.
 */
const FILENAME_PATTERN =
  /^(\d{1,2}):(\d{1,2}):(\d{2})(?:-(\d+))?\.([A-Za-z0-9]+)$/;

export interface ParsedFilename {
  /** The original filename, exactly as it appears on disk. */
  file: string;
  /** `YYYY-MM-DD`, from the filename. Authoritative — see the file header. */
  isoDate: string;
  /** The meaningless trailing counter, kept only for diagnostics. `0` when absent. */
  counter: number;
  /** Lower-cased extension, without the dot. */
  extension: string;
  kind: MediaKind;
}

export class UnparsableFilenameError extends Error {
  constructor(readonly file: string, reason: string) {
    super(`"${file}" does not match the DD:MM:YY[-N].EXT grammar: ${reason}`);
    this.name = "UnparsableFilenameError";
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Parse one filename. Throws `UnparsableFilenameError` rather than guessing —
 * a file this cannot name is a file the rest of the pipeline must not silently
 * skip or misfile.
 */
export function parseFilename(file: string): ParsedFilename {
  const match = FILENAME_PATTERN.exec(file);
  if (!match) {
    throw new UnparsableFilenameError(
      file,
      "expected DD:MM:YY or DD:MM:YY-N before the extension",
    );
  }

  const [, dayStr, monthStr, yearStr, counterStr, extRaw] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = 2000 + Number(yearStr);

  if (month < 1 || month > 12) {
    throw new UnparsableFilenameError(file, `month ${month} is out of range`);
  }
  if (day < 1 || day > 31) {
    throw new UnparsableFilenameError(file, `day ${day} is out of range`);
  }

  const extension = (extRaw ?? "").toLowerCase();
  let kind: MediaKind;
  if (IMAGE_EXTENSIONS.has(extension)) {
    kind = "image";
  } else if (VIDEO_EXTENSIONS.has(extension)) {
    kind = "video";
  } else {
    throw new UnparsableFilenameError(
      file,
      `unrecognised extension ".${extension}"`,
    );
  }

  return {
    file,
    isoDate: `${year}-${pad2(month)}-${pad2(day)}`,
    counter: counterStr ? Number(counterStr) : 0,
    extension,
    kind,
  };
}

/**
 * A filesystem-safe, collision-free stem for derivative filenames.
 *
 * Must keep the extension: two source files can share a date and have no
 * counter at all — e.g. `24:7:26.HEIC` and `24:7:26.JPG` both appear in this
 * batch — and differ ONLY by extension. Stripping it collided the two onto
 * one derivative filename on the first real run (later file silently
 * overwrote the earlier one's derivatives); see the ingest session notes.
 */
export function deriveBaseName(file: string): string {
  return file.replace(/[:/]/g, "-").replace(/\./g, "-");
}

/* ------------------------------------------------------------------ *
 * Known corrections — established by hand during cataloguing
 * ------------------------------------------------------------------ */

/**
 * Files to drop as exact-duplicate artifacts, and why.
 *
 * The ONLY removals this pipeline is authorised to make on the founder's 52
 * chosen files (he was explicit: no curation, no editorial drops) — these are
 * not a second copy of the same moment shot slightly differently, they are the
 * same bytes twice.
 */
export const DUPLICATE_DROPS: Readonly<Record<string, string>> = {
  "24:7:26-12.HEIC":
    "byte-identical to 24:7:26-11.HEIC (MD5 5c0356fbb9839ec57984d0d40202916a on both); kept -11, dropped -12",
};

/**
 * Files whose EXIF capture date disagrees with their filename date.
 *
 * `filenameDate` is what `parseFilename` returns and is what the pipeline
 * files the photo under — the founder named these by hand and that naming is
 * authoritative. `exifDate` is recorded alongside it, never used for filing.
 */
export const FILENAME_EXIF_DATE_MISMATCHES: Readonly<
  Record<string, { filenameDate: string; exifDate: string }>
> = {
  "24:7:26-21.HEIC": { filenameDate: "2026-07-24", exifDate: "2026-07-23" },
};

export function isDroppedDuplicate(file: string): boolean {
  return file in DUPLICATE_DROPS;
}
