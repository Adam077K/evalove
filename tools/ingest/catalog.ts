/**
 * catalog.ts — loads the three vision-agent catalogues checked into
 * `tools/ingest/catalog/`.
 *
 * These are copies of `/tmp/evapics-{A,B,C}/catalog.jsonl`, produced by three
 * parallel vision passes over the 52 source files before this tool was
 * written (see the ingest session brief). They are copied into the repo
 * rather than read from `/tmp` because `/tmp` is not durable — it does not
 * survive a reboot and is not shared across machines — and a manifest step
 * that depends on it would not be reproducible.
 *
 * Every field here is advisory. The only thing this tool trusts a catalogue
 * row for is `caption_seed` (a caption draft) and the `people`/`likely_shooter`
 * hints used to seed a best-guess author in authorship.tsv — never anything
 * that decides what gets kept. The founder chose all 52 files already.
 */

import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export interface CatalogEntry {
  file: string;
  date: string;
  people: string;
  subject: string;
  setting: string;
  time_of_day: string;
  likely_shooter: string;
  mood: string;
  text_visible: string | null;
  caption_seed: string;
  quality: string;
  notes: string;
  /** Present only on the three video rows. */
  is_video?: boolean;
  duration_seconds?: number;
  dimensions?: string;
}

const CATALOG_DIR = fileURLToPath(new URL("./catalog", import.meta.url));

/** Every catalogue row, keyed by the exact filename (colons and all). */
export function loadCatalog(dir: string = CATALOG_DIR): Map<string, CatalogEntry> {
  const byFile = new Map<string, CatalogEntry>();
  const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
  for (const file of files) {
    const contents = readFileSync(join(dir, file), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const entry = JSON.parse(trimmed) as CatalogEntry;
      if (byFile.has(entry.file)) {
        throw new Error(
          `Duplicate catalogue entry for "${entry.file}" — found in ${file} and again elsewhere.`,
        );
      }
      byFile.set(entry.file, entry);
    }
  }
  return byFile;
}
