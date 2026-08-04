#!/usr/bin/env node
/**
 * index.ts — Eva & Adam archive export CLI
 *
 * Reads the whole archive out of Supabase and writes a folder tree of files
 * openable on a laptop in ten years with this app gone and this company gone.
 *
 * Usage (from apps/web/):
 *   npm run export -- [options] [output-dir]
 *   node --experimental-strip-types ../../tools/export/index.ts [options] [output-dir]
 *
 * Options:
 *   --verify           Re-read every written file and compare SHA-256 against
 *                      photos.checksum_sha256. Exits 1 if any mismatch.
 *                      The gate on considering an export a real backup.
 *   --include-vault    Also export vault items to private/. Requires the
 *                      VAULT_PASSPHRASE env var as an acknowledgement that
 *                      you are exporting sensitive content. Vault bytes are
 *                      never written to photos/, only to private/.
 *
 * Required env vars:
 *   SUPABASE_URL           project URL (same as NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY   service role key (same as SUPABASE_SERVICE_ROLE_KEY)
 *
 * Optional env vars:
 *   VAULT_PASSPHRASE   required when --include-vault is passed. Not used to
 *                      decrypt anything — used as explicit acknowledgement.
 *
 * Output structure:
 *   eva-and-adam-archive/
 *     README.txt
 *     index.html
 *     index.csv
 *     photos/YYYY-MM-DD/YYYY-MM-DD--<author>--<HHMM>--<short-id>.jpg
 *     book/book.csv
 *     data/{photos,members,book_entries,dates,date_turns}.csv
 *     private/                       (--include-vault only)
 *       README.txt
 *       YYYY-MM-DD/YYYY-MM-DD--<author>--<HHMM>--<short-id>.jpg
 *
 * Resumable: re-running skips files already present with a matching checksum.
 * A dropped connection does not mean starting over.
 *
 * DELIBERATE ARCH §6.3 VIOLATION in read.ts — see that file's header.
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";

import {
  createExportClient,
  fetchMembers,
  fetchPhotos,
  fetchVaultItems,
  fetchBookEntries,
  fetchDates,
  fetchDateTurns,
  downloadStorageObject,
} from "./read.ts";
import type { DbMember, DbPhoto, DbVaultItem } from "./read.ts";
import {
  EXPORT_ROOT_NAME,
  buildPhotoFilename,
  buildPhotoRelativePath,
  buildVaultRelativePath,
  listRequiredDirs,
  absPhotoPath,
  toHHMM,
} from "./layout.ts";
import {
  buildIndexCsv,
  buildBookCsv,
  buildMembersCsv,
  buildPhotosCsv,
  buildBookEntriesCsv,
  buildDatesCsv,
  buildDateTurnsCsv,
} from "./manifest.ts";
import type { PhotoIndexRow, BookIndexRow } from "./manifest.ts";
import { buildIndexHtml } from "./index-html.ts";
import {
  verifyFiles,
  summariseResults,
  sha256Hex,
} from "./verify.ts";
import type { VerifyEntry } from "./verify.ts";

// ---------------------------------------------------------------------------
// Argument parsing — manual, no new runtime deps
// ---------------------------------------------------------------------------

interface CliArgs {
  verify: boolean;
  includeVault: boolean;
  outputDir: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2); // skip 'node' and script path
  let verify = false;
  let includeVault = false;
  let outputDir: string | null = null;

  for (const arg of args) {
    if (arg === "--verify") {
      verify = true;
    } else if (arg === "--include-vault") {
      includeVault = true;
    } else if (!arg.startsWith("--")) {
      outputDir = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      console.error("Usage: export [--verify] [--include-vault] [output-dir]");
      process.exit(1);
    }
  }

  return {
    verify,
    includeVault,
    outputDir: outputDir ?? EXPORT_ROOT_NAME,
  };
}

// ---------------------------------------------------------------------------
// Env var validation
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Required environment variable ${name} is not set.`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

function writeUtf8(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, "utf8");
}

function writeBytes(filePath: string, bytes: Buffer): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, bytes);
}

// ---------------------------------------------------------------------------
// Resume check — skip a file if it already exists with a matching checksum
// ---------------------------------------------------------------------------

async function shouldSkip(
  filePath: string,
  expectedChecksum: string,
): Promise<boolean> {
  if (!existsSync(filePath)) return false;
  try {
    const bytes = await readFile(filePath);
    const actual = sha256Hex(bytes);
    return actual.toLowerCase() === expectedChecksum.toLowerCase();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// README content
// ---------------------------------------------------------------------------

function buildReadmeTxt(
  outputDir: string,
  photoCount: number,
  vaultCount: number,
  exportedAt: string,
  includesVault: boolean,
): string {
  const dateStr = new Date(exportedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Eva & Adam — archive
====================

Exported on ${dateStr}.
${photoCount} photograph${photoCount === 1 ? "" : "s"} in this archive.
${includesVault && vaultCount > 0 ? `${vaultCount} vault item${vaultCount === 1 ? "" : "s"} in the private/ folder.\n` : ""}

HOW TO VIEW
-----------
Open index.html in any web browser. It works offline — no internet required.
Open index.csv in a spreadsheet app (Numbers, Excel, LibreOffice Calc) to
sort and filter all photographs.

The photos/ folder holds the photograph files, organised by date:
  photos/YYYY-MM-DD/YYYY-MM-DD--author--HHMM--id.jpg

What each part of the filename means:
  YYYY-MM-DD  the date the photograph was posted
  author      who posted it (eva or adam)
  HHMM        their local time when it was posted
  id          a short identifier

VARIANTS
--------
Some photographs are labelled 'display' in index.csv under the file_variant
column. This means the original full-resolution file was not stored at the
time of export — what you have is a 1600-pixel-wide version, not the device's
original. The label is honest: a display copy is not the original.

FILES IN THIS FOLDER
--------------------
  index.html          browse everything in a web browser (works offline)
  index.csv           all photographs as a spreadsheet
  photos/             the photograph files, by date
  book/book.csv       The Book's page list
  data/               full table exports as spreadsheets
    photos.csv
    members.csv
    book_entries.csv
    dates.csv
    date_turns.csv
${includesVault ? `
PRIVATE FOLDER
--------------
The private/ folder contains vault items exported with the --include-vault
flag. These are separate from the ordinary photographs. They are display
variants only — vault items have no original stored here.

This folder was included deliberately by passing --include-vault when running
the export. A standard export (without that flag) does not include this folder.
` : ""}
NO SPECIAL SOFTWARE NEEDED
--------------------------
Every file in this archive opens with what you already have: a web browser,
a photo viewer, and a spreadsheet app. There is no proprietary format here.
This was designed to be openable on a laptop in ten years.
`.trimEnd() + "\n";
}

function buildVaultReadmeTxt(exportedAt: string): string {
  const dateStr = new Date(exportedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Eva & Adam — vault export
=========================

Exported on ${dateStr} with --include-vault.

This folder contains vault items — private photographs kept separate from
the main archive. They are display variants (1600px wide); vault items do
not have originals stored in this system (migration 04).

These were not included in the main archive's index.html or index.csv.
They are in this folder only.

IMPORTANT: this copy exists because the --include-vault flag was passed
explicitly. A standard export does not produce this folder.
`.trimEnd() + "\n";
}

// ---------------------------------------------------------------------------
// Member lookup helper
// ---------------------------------------------------------------------------

function buildMemberMap(members: DbMember[]): Map<string, DbMember> {
  return new Map(members.map((m) => [m.id, m]));
}

// ---------------------------------------------------------------------------
// Taken-at local time for CSV
// ---------------------------------------------------------------------------

function takenAtLocal(
  takenAt: string | null,
  createdAt: string,
  timezone: string,
): string {
  const ts = takenAt ?? createdAt;
  const date = new Date(ts);
  if (isNaN(date.getTime())) return ts;
  try {
    return date.toLocaleString("sv-SE", { timeZone: timezone }); // 'YYYY-MM-DD HH:MM:SS'
  } catch {
    return ts;
  }
}

// ---------------------------------------------------------------------------
// Main export logic
// ---------------------------------------------------------------------------

async function runExport(args: CliArgs): Promise<void> {
  const { verify, includeVault, outputDir } = args;

  // --- validate vault flag before doing any work ---
  if (includeVault) {
    const passphrase = process.env["VAULT_PASSPHRASE"];
    if (!passphrase || passphrase.trim() === "") {
      console.error(
        "ERROR: --include-vault requires VAULT_PASSPHRASE to be set in the environment.",
      );
      console.error(
        "This is an acknowledgement that you are exporting vault content.",
      );
      process.exit(1);
    }
  }

  const resolvedOutput = resolve(outputDir);
  console.log(`Output directory: ${resolvedOutput}`);

  // --- connect ---
  const db = createExportClient();

  // --- fetch all data ---
  console.log("Fetching data from Supabase...");
  const [members, photos, bookEntries, dates, dateTurns] = await Promise.all([
    fetchMembers(db),
    fetchPhotos(db),
    fetchBookEntries(db),
    fetchDates(db),
    fetchDateTurns(db),
  ]);

  let vaultItems: DbVaultItem[] = [];
  if (includeVault) {
    console.log("Fetching vault items...");
    vaultItems = await fetchVaultItems(db);
  }

  const memberMap = buildMemberMap(members);

  console.log(
    `Found ${photos.length} photo${photos.length === 1 ? "" : "s"}, ` +
      `${bookEntries.length} book entr${bookEntries.length === 1 ? "y" : "ies"}, ` +
      `${dates.length} date${dates.length === 1 ? "" : "s"}.` +
      (includeVault ? ` ${vaultItems.length} vault item${vaultItems.length === 1 ? "" : "s"}.` : ""),
  );

  // --- create directory structure ---
  for (const dir of listRequiredDirs(resolvedOutput, includeVault)) {
    ensureDir(dir);
  }

  // --- download and write photos ---
  const exportedAt = new Date().toISOString();
  const indexRows: PhotoIndexRow[] = [];
  const verifyEntries: VerifyEntry[] = [];

  let skipped = 0;
  let downloaded = 0;
  let unavailable = 0;

  for (const photo of photos) {
    const member = memberMap.get(photo.author_member_id);
    if (!member) {
      console.warn(
        `  WARN: photo ${photo.id} has unknown author_member_id ${photo.author_member_id} — skipping`,
      );
      continue;
    }

    const filename = buildPhotoFilename(
      photo.shared_day,
      member.slug,
      photo.taken_at,
      photo.created_at,
      member.home_timezone,
      photo.id,
    );
    const relativePath = buildPhotoRelativePath(photo.shared_day, filename);
    const absolutePath = absPhotoPath(resolvedOutput, relativePath);

    // Determine which variant to download
    const useOriginal =
      photo.original_location === "supabase" &&
      photo.storage_path_original != null;
    const storagePath = useOriginal
      ? photo.storage_path_original!
      : photo.storage_path_display;
    const fileVariant: "original" | "display" = useOriginal
      ? "original"
      : "display";

    if (fileVariant === "display" && photo.original_location !== "none") {
      console.log(
        `  INFO: photo ${photo.id} original_location='${photo.original_location}' — using display variant`,
      );
    }

    // Resume: skip if file exists with matching checksum
    if (await shouldSkip(absolutePath, photo.checksum_sha256)) {
      skipped++;
    } else {
      const bytes = await downloadStorageObject(db, storagePath);
      if (!bytes) {
        console.warn(
          `  WARN: could not download ${storagePath} (photo ${photo.id}) — skipping`,
        );
        unavailable++;
        continue;
      }
      writeBytes(absolutePath, bytes);
      downloaded++;
    }

    const localTime = takenAtLocal(
      photo.taken_at,
      photo.created_at,
      member.home_timezone,
    );

    indexRows.push({
      id: photo.id,
      shared_day: photo.shared_day,
      author: member.slug,
      taken_at_local: localTime,
      caption: photo.caption,
      kind: photo.kind,
      file_path: relativePath.replace(/\\/g, "/"), // normalise to forward slashes
      file_variant: fileVariant,
      checksum_sha256: photo.checksum_sha256,
    });

    verifyEntries.push({
      filePath: absolutePath,
      expectedChecksum: photo.checksum_sha256,
      label: `${photo.id} (${relativePath})`,
    });
  }

  console.log(
    `Photos: ${downloaded} downloaded, ${skipped} skipped (checksum match), ${unavailable} unavailable.`,
  );

  // --- vault items ---
  const vaultVerifyEntries: VerifyEntry[] = [];

  if (includeVault && vaultItems.length > 0) {
    const vaultPrivateDir = join(resolvedOutput, "private");
    ensureDir(vaultPrivateDir);

    let vaultSkipped = 0;
    let vaultDownloaded = 0;

    for (const item of vaultItems) {
      const member = memberMap.get(item.author_member_id);
      if (!member) {
        console.warn(
          `  WARN: vault item ${item.id} has unknown author_member_id — skipping`,
        );
        continue;
      }

      const filename = buildPhotoFilename(
        item.shared_day,
        member.slug,
        item.taken_at,
        item.created_at,
        member.home_timezone,
        item.id,
      );
      const relativePath = buildVaultRelativePath(item.shared_day, filename);
      const absolutePath = absPhotoPath(resolvedOutput, relativePath);

      if (await shouldSkip(absolutePath, item.checksum_sha256)) {
        vaultSkipped++;
      } else {
        const bytes = await downloadStorageObject(
          db,
          item.storage_path_display,
        );
        if (!bytes) {
          console.warn(
            `  WARN: could not download vault item ${item.id} — skipping`,
          );
          continue;
        }
        writeBytes(absolutePath, bytes);
        vaultDownloaded++;
      }

      vaultVerifyEntries.push({
        filePath: absolutePath,
        expectedChecksum: item.checksum_sha256,
        label: `vault:${item.id} (${relativePath})`,
      });
    }

    console.log(
      `Vault: ${vaultDownloaded} downloaded, ${vaultSkipped} skipped.`,
    );

    writeUtf8(
      join(resolvedOutput, "private", "README.txt"),
      buildVaultReadmeTxt(exportedAt),
    );
  }

  // --- build and write index files ---
  console.log("Writing index files...");

  // index.csv
  writeUtf8(
    join(resolvedOutput, "index.csv"),
    buildIndexCsv(indexRows),
  );

  // index.html
  writeUtf8(
    join(resolvedOutput, "index.html"),
    buildIndexHtml({
      exportedAt,
      photoCount: indexRows.length,
      includesVault: includeVault && vaultItems.length > 0,
      rows: indexRows,
    }),
  );

  // book/book.csv
  const photoPathByPhotoId = new Map(
    indexRows.map((r) => [r.id, r.file_path]),
  );
  const bookRows: BookIndexRow[] = bookEntries
    .filter((e) => e.deleted_at == null)
    .map((e) => ({
      entry_id: e.id,
      position: String(e.position),
      photo_file_path: e.photo_id ? (photoPathByPhotoId.get(e.photo_id) ?? null) : null,
      date_id: e.date_id,
      caption: e.caption,
      date_label: e.date_label,
      created_at: e.created_at,
    }));
  writeUtf8(join(resolvedOutput, "book", "book.csv"), buildBookCsv(bookRows));

  // data/*.csv — full table snapshots
  writeUtf8(join(resolvedOutput, "data", "members.csv"), buildMembersCsv(members));
  writeUtf8(join(resolvedOutput, "data", "photos.csv"), buildPhotosCsv(photos));
  writeUtf8(join(resolvedOutput, "data", "book_entries.csv"), buildBookEntriesCsv(bookEntries));
  writeUtf8(join(resolvedOutput, "data", "dates.csv"), buildDatesCsv(dates));
  writeUtf8(join(resolvedOutput, "data", "date_turns.csv"), buildDateTurnsCsv(dateTurns));

  // README.txt
  writeUtf8(
    join(resolvedOutput, "README.txt"),
    buildReadmeTxt(
      resolvedOutput,
      indexRows.length,
      vaultItems.length,
      exportedAt,
      includeVault,
    ),
  );

  console.log("Export complete.");
  console.log(`  Output: ${resolvedOutput}`);

  // --- verify pass ---
  if (verify) {
    const allEntries = [...verifyEntries, ...vaultVerifyEntries];
    console.log(`\nVerifying ${allEntries.length} file${allEntries.length === 1 ? "" : "s"}...`);

    const results = await verifyFiles(allEntries);
    const summary = summariseResults(results);

    if (summary.missing.length > 0) {
      console.error("\nMISSING FILES:");
      for (const r of summary.missing) {
        console.error(`  MISSING  ${r.label}`);
      }
    }

    if (summary.mismatches.length > 0) {
      console.error("\nCHECKSUM MISMATCHES:");
      for (const r of summary.mismatches) {
        console.error(`  MISMATCH ${r.label}`);
        console.error(`    expected: ${r.expectedChecksum}`);
        console.error(`    actual:   ${r.actualChecksum}`);
      }
    }

    if (summary.passed) {
      console.log(`\nVERIFY PASS: all ${summary.total} file${summary.total === 1 ? "" : "s"} verified OK.`);
    } else {
      console.error(
        `\nVERIFY FAIL: ${summary.mismatches.length} mismatch${summary.mismatches.length === 1 ? "" : "es"}, ` +
          `${summary.missing.length} missing of ${summary.total} total.`,
      );
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const args = parseArgs(process.argv);

runExport(args).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nEXPORT FAILED: ${message}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
