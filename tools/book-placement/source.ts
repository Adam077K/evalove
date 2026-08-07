/**
 * source.ts — the merged, committed input this tool plans against.
 *
 * `source-items.json` is generated ONCE, offline, from two things that do
 * not live in this repository and are not durable inputs for a tool that
 * has to be re-runnable and testable without them:
 *
 *   - `tools/ingest/output/manifest.json` (on `feat/photo-ingest`, not this
 *     branch) — the 51 catalogued files, their ISO dates, kinds and
 *     display-derivative checksums.
 *   - `/tmp/evapics-{A,B,C}/catalog.jsonl` — the content catalogue (subject,
 *     setting, time of day, mood, quality, notes) this session generated.
 *     `/tmp` does not survive a reboot and this tool must still run after
 *     one.
 *
 * Merging them into one committed file means `planPlacement` (`plan.ts`) is
 * fully testable and re-runnable from source control alone, with zero
 * dependency on a sibling worktree or an ephemeral directory. When
 * `tools/ingest` lands in this tree for real, regenerating this file from
 * its manifest is a five-line script, not a rewrite — the merge shape
 * (`SourceItem`) does not change.
 *
 * What is NOT here: photo ids. `book_entries.photo_id` only exists once
 * `tools/ingest/load.ts` has actually committed a row, which requires a
 * founder-confirmed author in `authorship.tsv` — as of this file's
 * generation, every row's `author_correction` column is blank, so nothing
 * has been committed yet. `place.ts` resolves `file` -> live `photos.id` at
 * run time, by `checksum_sha256`, which is why that field is carried here.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_SOURCE_ITEMS_PATH = resolve(HERE, "source-items.json");

export type SourceKind = "image" | "video";

export interface SourceItem {
  /** The original filename, exactly as `tools/ingest` catalogued it — the
      one stable, human-legible key every stage of this pipeline agrees on. */
  file: string;
  /** `YYYY-MM-DD`. */
  isoDate: string;
  kind: SourceKind;
  /** The display derivative's checksum — `null` for video items, which
      have no display derivative. This is the join key against live
      `photos.checksum_sha256` rows (`load.ts` writes the same value). */
  checksumSha256: string | null;
  captionSeed: string | null;
  subject: string | null;
  setting: string | null;
  timeOfDay: string | null;
  mood: string | null;
  quality: string | null;
  notes: string | null;
}

interface SourceItemsFile {
  generatedAt: string;
  sourceManifest: string;
  items: SourceItem[];
}

function isSourceKind(value: unknown): value is SourceKind {
  return value === "image" || value === "video";
}

/** A loud, specific failure beats a silently-wrong plan — this file is the
    one thing standing between a typo in `source-items.json` and 51 items
    quietly becoming 50. */
function assertSourceItem(value: unknown, index: number): asserts value is SourceItem {
  if (typeof value !== "object" || value === null) {
    throw new Error(`source-items.json[${index}] is not an object`);
  }
  const v = value as Record<string, unknown>;
  if (typeof v["file"] !== "string" || v["file"] === "") {
    throw new Error(`source-items.json[${index}] has no "file"`);
  }
  if (typeof v["isoDate"] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v["isoDate"])) {
    throw new Error(`source-items.json[${index}] ("${v["file"]}") has a malformed "isoDate"`);
  }
  if (!isSourceKind(v["kind"])) {
    throw new Error(`source-items.json[${index}] ("${v["file"]}") has an unknown "kind"`);
  }
  if (v["checksumSha256"] !== null && typeof v["checksumSha256"] !== "string") {
    throw new Error(`source-items.json[${index}] ("${v["file"]}") has a malformed "checksumSha256"`);
  }
}

/**
 * Load and validate the committed source data. Pure apart from the one file
 * read — pass `path` in tests that need a fixture on disk; the pure merge
 * and shape checks are exercised directly in `__tests__/source.test.ts`
 * without touching the filesystem at all.
 */
export function loadSourceItems(path: string = DEFAULT_SOURCE_ITEMS_PATH): SourceItem[] {
  const raw = JSON.parse(readFileSync(path, "utf8")) as SourceItemsFile;
  if (!Array.isArray(raw.items)) {
    throw new Error(`${path}: "items" is not an array`);
  }
  raw.items.forEach((item, index) => assertSourceItem(item, index));
  return raw.items;
}
