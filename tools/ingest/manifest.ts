/**
 * manifest.ts — the shapes of manifest.json and authorship.tsv, plus the
 * best-guess author heuristic and the TSV round-trip.
 *
 * The founder was explicit that the file FORMAT (HEIC vs JPG/PNG, which the
 * catalogue's `likely_shooter` field is built from — "HEIC + Apple EXIF ⇒
 * on_this_phone") does NOT indicate authorship. This module deliberately does
 * not use `likely_shooter` to decide a guess for that reason; it is carried
 * into the manifest only as diagnostic context. The guess used here instead
 * follows the founder's own suggested heuristic: a photo with exactly one
 * person in it was probably taken by the other one. That is read off the
 * catalogue's free-text `people`/`subject`/`notes` fields, which is inherently
 * approximate — which is exactly why every guess is written to a column
 * labelled as a guess, next to a blank column for the founder's correction.
 */

import { writeFileSync } from "node:fs";
import type { CatalogEntry } from "./catalog.ts";
import type { MediaKind } from "./filename.ts";
import { isMachineShapedCaption } from "@/lib/caption-law.ts";

/* ------------------------------------------------------------------ *
 * manifest.json
 * ------------------------------------------------------------------ */

export interface DerivativeRef {
  path: string;
  width: number;
  height: number;
  bytes: number;
  checksumSha256: string;
}

export interface VideoDerivativeRef extends DerivativeRef {
  durationSeconds: number;
}

export interface ManifestItem {
  file: string;
  isoDate: string;
  /** Present only for the one file with a filename/EXIF date mismatch. */
  exifDate?: string;
  kind: MediaKind;
  captionSeed: string;
  /** Diagnostic only — never used to decide authorship. See file header. */
  catalogPeople: string;
  catalogLikelyShooter: string;
  derivatives: {
    display?: DerivativeRef;
    thumb?: DerivativeRef;
    video?: VideoDerivativeRef;
    poster?: DerivativeRef;
  };
  sourceHadExif: boolean;
  sourceHadGps: boolean;
  verifiedClean: boolean;
  /** Always null in the manifest itself — see authorship.tsv for the guess. */
  author: null;
}

export interface DroppedFile {
  file: string;
  reason: string;
}

export interface Manifest {
  generatedAt: string;
  sourceCount: number;
  items: ManifestItem[];
  dropped: DroppedFile[];
}

export function writeManifest(path: string, manifest: Manifest): void {
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * The manifest's `captionSeed` for one file — `catalogEntry.caption_seed`,
 * UNLESS it reads as an internal/technical note about the photo file rather
 * than a caption (`lib/caption-law.ts`), in which case this returns `""`,
 * same as a file with no catalogue entry at all.
 *
 * This is the real fix for the 2026-08-08 breach ("Same photo as
 * 24:7:26-4.JPG at lower resolution." reaching the live Book as a caption):
 * `caption_seed` was always the field this tool trusted — the mapping was
 * never wrong — but nothing before this function ever looked at what was
 * IN it. `caption_seed` is authored by an automated vision pass with no
 * human review in between, so a catalogue row can carry notes-shaped prose
 * in the one field this tool assumes is caption-shaped; this function is
 * what makes that assumption true rather than merely convenient.
 *
 * Deliberately does not fall back to `notes` or any other field — the
 * founder's own standing rule for this pipeline (see prepare.ts, "no
 * curation happens here") is that an uncaptioned photograph is a completely
 * fine outcome; inventing a caption from a different free-text field is not
 * this tool's job, and load.ts's caption-worthy defaults already treat an
 * empty `captionSeed` as "no caption" for exactly this reason.
 */
export function resolveCaptionSeed(catalogEntry: CatalogEntry | undefined): string {
  const seed = catalogEntry?.caption_seed ?? "";
  if (seed !== "" && isMachineShapedCaption(seed)) return "";
  return seed;
}

/* ------------------------------------------------------------------ *
 * authorship.tsv
 * ------------------------------------------------------------------ */

export type AuthorGuess = "eva" | "adam" | "";

export interface AuthorshipGuess {
  guess: AuthorGuess;
  reason: string;
}

/**
 * A photo with exactly one person described in it was probably taken by the
 * other one — the founder's own heuristic. Applied to the catalogue's free
 * text, which is why it is read as prose rather than a structured field: the
 * vision passes never had ground truth for which face is Eva and which is
 * Adam, so `people` only ever says "unclear" / "both" / "neither", and the
 * signal lives in whether the description reads as one man, one woman, or
 * neither/both.
 */
export function guessAuthor(entry: CatalogEntry): AuthorshipGuess {
  const text = `${entry.people} ${entry.subject} ${entry.notes}`.toLowerCase();
  const soloWoman = /\bwoman\b|\bgirl\b/.test(text);
  const soloMan = /\bman\b|\bguy\b|\bboy\b/.test(text);
  // Plurals ("women", "men", "people", "group") mean more than one person is
  // described — a group scene, not the clean "one person in frame" case the
  // heuristic depends on — so they suppress a guess even if a singular word
  // also matched elsewhere in the text (e.g. "a man speaking ... women behind him").
  const groupSignal = /\bwomen\b|\bmen\b|\bgirls\b|\bboys\b|\bpeople\b|\bgroup\b/.test(
    text,
  );

  if (entry.people === "both" || groupSignal) {
    return {
      guess: "",
      reason: "more than one person described in frame — no solo subject to guess a shooter from",
    };
  }
  if (soloWoman && !soloMan) {
    return {
      guess: "adam",
      reason: "catalogue describes a solo woman in frame — guessing the other partner held the camera",
    };
  }
  if (soloMan && !soloWoman) {
    return {
      guess: "eva",
      reason: "catalogue describes a solo man in frame — guessing the other partner held the camera",
    };
  }
  return {
    guess: "",
    reason: "no reliable solo-person signal in the catalogue description",
  };
}

const TSV_HEADER = [
  "# authorship.tsv — one row per photograph. Fill in the LAST column only, with 'eva', 'adam' or 'unsigned'.",
  "# MANUAL OVERRIDE ONLY: load.ts assigns eva/adam/unsigned automatically from the authorship-pass",
  "# verdicts (verdicts.ts). Fill a row here only to correct one file's automatic result; leave the rest blank.",
  ["file", "date", "subject", "guess_author", "guess_reason", "author_correction"].join("\t"),
].join("\n");

function tsvEscape(value: string): string {
  return value.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}

export interface AuthorshipRow {
  file: string;
  isoDate: string;
  subject: string;
  guess: AuthorGuess;
  guessReason: string;
}

export function buildAuthorshipTsv(rows: AuthorshipRow[]): string {
  const lines = rows.map((row) =>
    [
      row.file,
      row.isoDate,
      tsvEscape(row.subject),
      row.guess,
      tsvEscape(row.guessReason),
      "", // author_correction — left blank for the founder to fill in
    ].join("\t"),
  );
  return [TSV_HEADER, ...lines].join("\n") + "\n";
}

export interface AuthorshipCorrection {
  /** The founder's manual override, if the row was filled in. */
  author: "eva" | "adam" | "unsigned" | null;
}

/**
 * Read a founder-edited authorship.tsv back — now a MANUAL OVERRIDE sheet
 * only. `load.ts` assigns eva/adam/unsigned to every row automatically from
 * the authorship-pass verdicts (`verdicts.ts`); a non-blank
 * `author_correction` here wins over that automatic result for that one
 * file, same idea as before but no longer the only path to a resolved
 * author. An empty correction with a non-empty `guess_author` still resolves
 * to `null` — a guess alone is never enough to override anything, per the
 * founder's own statement that the format-based signal isn't trustworthy.
 */
export function parseAuthorshipTsv(
  content: string,
): Map<string, AuthorshipCorrection> {
  const byFile = new Map<string, AuthorshipCorrection>();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.startsWith("#")) continue;
    const cols = line.split("\t");
    const file = cols[0];
    if (!file || file === "file") continue; // header row
    const correction = (cols[5] ?? "").trim().toLowerCase();
    const author =
      correction === "eva" || correction === "adam" || correction === "unsigned"
        ? correction
        : null;
    byFile.set(file, { author });
  }
  return byFile;
}
