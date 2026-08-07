#!/usr/bin/env node
/**
 * prepare.ts — Eva & Adam photo ingest, steps 1–5
 *
 * Reads every file in the source folder, derives its date and kind from the
 * filename, converts it to web-viewable, metadata-free derivatives, verifies
 * those derivatives are actually clean (re-reading them off disk — see
 * verify.ts), and writes manifest.json + authorship.tsv. It does not touch
 * the database; that is load.ts.
 *
 * Usage (from tools/, after `pnpm install`):
 *   pnpm ingest:prepare
 *   pnpm ingest:prepare -- --limit 5          process only the first 5 files
 *   pnpm ingest:prepare -- --source <dir> --out <dir>
 *
 * Or directly:
 *   npx tsx ingest/prepare.ts [--source dir] [--out dir] [--limit n]
 *
 * The source folder is read-only: nothing here ever writes, moves, or renames
 * an original file. The ONLY files this tool omits from its output are exact
 * byte-identical duplicates (see filename.ts's DUPLICATE_DROPS) — every other
 * one of the founder's 52 chosen files gets a manifest row, on purpose: no
 * curation happens here.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DUPLICATE_DROPS,
  FILENAME_EXIF_DATE_MISMATCHES,
  UnparsableFilenameError,
  deriveBaseName,
  isDroppedDuplicate,
  parseFilename,
} from "./filename.ts";
import { loadCatalog, type CatalogEntry } from "./catalog.ts";
import {
  checkToolAvailability,
  convertImage,
  convertVideo,
  withVideoDimensions,
} from "./media.ts";
import { readSourceMetadata, verifyDerivativeClean } from "./verify.ts";
import {
  buildAuthorshipTsv,
  guessAuthor,
  writeManifest,
  type AuthorshipRow,
  type DroppedFile,
  type ManifestItem,
} from "./manifest.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_SOURCE = resolve(HERE, "../../Eva-app-images");
const DEFAULT_OUT = resolve(HERE, "output");

interface CliArgs {
  source: string;
  outDir: string;
  limit: number | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  let source = DEFAULT_SOURCE;
  let outDir = DEFAULT_OUT;
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--source") source = resolve(args[++i] ?? "");
    else if (arg === "--out") outDir = resolve(args[++i] ?? "");
    else if (arg === "--limit") limit = Number(args[++i]);
    else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }
  return { source, outDir, limit };
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  console.log(`Source: ${args.source}`);
  console.log(`Output: ${args.outDir}`);

  const tools = checkToolAvailability();
  console.log(
    `Tools — sips: ${tools.sips ? "ok" : "MISSING"}, ffmpeg: ${tools.ffmpeg ? "ok" : "MISSING"}, ffprobe: ${tools.ffprobe ? "ok" : "MISSING"}`,
  );
  if (!tools.ffmpeg || !tools.ffprobe) {
    console.error(
      "\nBLOCKED: ffmpeg/ffprobe is required to resize+strip images and to " +
        "transcode video, and is not on PATH. Stopping rather than half-doing it.",
    );
    process.exit(1);
  }
  if (!tools.sips) {
    console.error(
      "\nBLOCKED: sips is required to decode HEIC (this is a macOS-only tool). " +
        "Not on PATH. Stopping rather than guessing at HEIC support via ffmpeg alone.",
    );
    process.exit(1);
  }

  if (!existsSync(args.source)) {
    console.error(`\nBLOCKED: source folder does not exist: ${args.source}`);
    process.exit(1);
  }

  const derivativesDir = join(args.outDir, "derivatives");
  const tmpDir = join(args.outDir, ".tmp");
  // Wipe and recreate rather than writing into whatever is already there. A
  // stale derivative from a filename scheme this file used to have (see
  // deriveBaseName's header — an earlier scheme collided two source files
  // onto one output name) must not silently survive a rerun; the derivatives
  // directory should always describe exactly the manifest this run produces,
  // nothing older.
  rmSync(derivativesDir, { recursive: true, force: true });
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(derivativesDir, { recursive: true });
  mkdirSync(tmpDir, { recursive: true });

  const catalog = loadCatalog();
  let files = listSourceFiles(args.source);
  console.log(`\nFound ${files.length} file(s) in source.`);
  if (args.limit !== null) {
    files = files.slice(0, args.limit);
    console.log(`--limit ${args.limit}: processing ${files.length} file(s).`);
  }

  const items: ManifestItem[] = [];
  const dropped: DroppedFile[] = [];
  const authorshipRows: AuthorshipRow[] = [];
  const failures: { file: string; error: string }[] = [];

  let imageCount = 0;
  let videoCount = 0;

  for (const file of files) {
    if (isDroppedDuplicate(file)) {
      const reason = DUPLICATE_DROPS[file]!;
      console.log(`  DROP (duplicate): ${file} — ${reason}`);
      dropped.push({ file, reason });
      continue;
    }

    let parsed;
    try {
      parsed = parseFilename(file);
    } catch (error) {
      if (error instanceof UnparsableFilenameError) {
        console.error(`  FAILED to parse filename: ${file} — ${error.message}`);
        failures.push({ file, error: error.message });
        continue;
      }
      throw error;
    }

    const catalogEntry: CatalogEntry | undefined = catalog.get(file);
    if (!catalogEntry) {
      console.warn(`  WARN: no catalogue entry for ${file} — proceeding with an empty caption seed`);
    }

    const srcPath = join(args.source, file);
    const baseName = deriveBaseName(file);

    console.log(`  Processing ${file} (${parsed.isoDate}, ${parsed.kind})...`);

    try {
      const sourceMeta = readSourceMetadata(srcPath);

      const item: ManifestItem = {
        file,
        isoDate: parsed.isoDate,
        kind: parsed.kind,
        captionSeed: catalogEntry?.caption_seed ?? "",
        catalogPeople: catalogEntry?.people ?? "unclear",
        catalogLikelyShooter: catalogEntry?.likely_shooter ?? "unclear",
        derivatives: {},
        sourceHadExif: sourceMeta.present,
        sourceHadGps: sourceMeta.hasGps,
        verifiedClean: false,
        author: null,
      };

      const mismatch = FILENAME_EXIF_DATE_MISMATCHES[file];
      if (mismatch) item.exifDate = mismatch.exifDate;

      const verifications: boolean[] = [];

      if (parsed.kind === "image") {
        imageCount++;
        const converted = convertImage(srcPath, parsed.extension, derivativesDir, baseName, tmpDir);
        item.derivatives.display = converted.display;
        item.derivatives.thumb = converted.thumb;
        verifications.push(verifyDerivativeClean(converted.display.path).clean);
        verifications.push(verifyDerivativeClean(converted.thumb.path).clean);
      } else {
        videoCount++;
        const converted = convertVideo(srcPath, derivativesDir, baseName);
        const videoFile = withVideoDimensions(
          converted.video,
          converted.width,
          converted.height,
        );
        item.derivatives.video = {
          ...videoFile,
          durationSeconds: converted.durationSeconds,
        };
        item.derivatives.poster = converted.poster;
        // The mp4 container isn't a JPEG the byte-scan understands; the poster is.
        verifications.push(verifyDerivativeClean(converted.poster.path).clean);
      }

      item.verifiedClean = verifications.every(Boolean);
      if (!item.verifiedClean) {
        console.error(`    METADATA VERIFICATION FAILED for ${file} — see manifest.json`);
      }

      items.push(item);

      if (catalogEntry) {
        const { guess, reason } = guessAuthor(catalogEntry);
        authorshipRows.push({
          file,
          isoDate: parsed.isoDate,
          subject: catalogEntry.subject,
          guess,
          guessReason: reason,
        });
      } else {
        authorshipRows.push({
          file,
          isoDate: parsed.isoDate,
          subject: "",
          guess: "",
          guessReason: "no catalogue entry",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAILED to convert ${file}: ${message}`);
      failures.push({ file, error: message });
    }
  }

  writeManifest(join(args.outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    sourceCount: files.length,
    items,
    dropped,
  });

  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    join(args.outDir, "authorship.tsv"),
    buildAuthorshipTsv(authorshipRows),
    "utf8",
  );

  console.log("\n--- Summary ---");
  console.log(`Images converted: ${imageCount}`);
  console.log(`Videos converted: ${videoCount}`);
  console.log(`Dropped (duplicate): ${dropped.length}`);
  console.log(`Failed: ${failures.length}`);
  const unclean = items.filter((i) => !i.verifiedClean);
  console.log(`Metadata verification: ${items.length - unclean.length}/${items.length} clean`);
  if (unclean.length > 0) {
    console.error(`  UNCLEAN: ${unclean.map((i) => i.file).join(", ")}`);
  }
  if (failures.length > 0) {
    console.error(`  FAILURES: ${failures.map((f) => `${f.file} (${f.error})`).join("; ")}`);
  }
  console.log(`\nWrote ${join(args.outDir, "manifest.json")}`);
  console.log(`Wrote ${join(args.outDir, "authorship.tsv")}`);

  if (unclean.length > 0 || failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nPREPARE FAILED: ${message}`);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
