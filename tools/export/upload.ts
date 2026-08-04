#!/usr/bin/env node
/**
 * upload.ts — Upload the Eva & Adam archive to Eva's Cloudflare R2 bucket.
 *
 * Run AFTER tools/export/index.ts --verify exits 0. A verification failure
 * is worse than a missing upload; do not upload a corrupt export.
 *
 * Usage (from repo root):
 *   NODE_PATH=tools/node_modules node --experimental-strip-types \
 *     tools/export/upload.ts <archive-dir>
 *
 * Required env vars — Eva's R2 credentials. NO fallback to any other account.
 *
 *   R2_EVA_ACCOUNT_ID          Cloudflare account ID (Eva's own account)
 *   R2_EVA_BUCKET_NAME         R2 bucket name (in Eva's account)
 *   R2_EVA_ACCESS_KEY_ID       R2 S3-compatible access key ID
 *   R2_EVA_SECRET_ACCESS_KEY   R2 S3-compatible secret access key
 *
 * If any of those four are absent, this script exits 1 immediately.
 * A copy in Adam's account is the status quo wearing a backup's clothes —
 * he is already the single point of failure this job exists to route around.
 *
 * Exit 0: every file uploaded; storage class verified STANDARD on a probe object.
 * Exit 1: missing credentials · upload failure · storage class not STANDARD.
 *
 * STORAGE CLASS ASSERTION (criterion 3)
 * Infrequent Access carries a per-GB retrieval charge that would destroy the
 * restore-costs-nothing property that justified choosing R2. Standard must be
 * asserted on every run, not assumed once during setup. This script reads back
 * the storage class of the first uploaded object and fails loudly if the result
 * is not STANDARD. A silent misconfiguration is worse than a failing job.
 *
 * NOT A MIRROR (criterion 4)
 * This job does not propagate deletes. The founder has ruled that nothing in
 * this system is ever permanently destroyed — everything stays in storage.
 * Eva's copy preserves that unconditionally. Even if permanent deletion is
 * later implemented in the main app, the copy in Eva's account is not
 * reachable by Adam's delete operations. That is the point.
 * Ref: PRODUCT-VISION-V2 §6 item 5, ARCH §5.7 (contradicted deliberately).
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

// ---------------------------------------------------------------------------
// Credential check — fail loudly if Eva's account is not available
// ---------------------------------------------------------------------------

function requireCredential(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    // Do not echo the var value — the check is presence, not content
    console.error(
      `UPLOAD BLOCKED: required credential '${name}' is not set. ` +
      `This upload requires Eva's own R2 account credentials. ` +
      `There is no fallback — a copy in any other account is not an independent backup.`,
    );
    process.exit(1);
  }
  return value;
}

const R2_ACCOUNT_ID = requireCredential("R2_EVA_ACCOUNT_ID");
const R2_BUCKET = requireCredential("R2_EVA_BUCKET_NAME");
const R2_ACCESS_KEY_ID = requireCredential("R2_EVA_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = requireCredential("R2_EVA_SECRET_ACCESS_KEY");

// ---------------------------------------------------------------------------
// R2 client — S3-compatible endpoint on Eva's Cloudflare account
// ---------------------------------------------------------------------------

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---------------------------------------------------------------------------
// MIME type map — enough for the archive's file types
// ---------------------------------------------------------------------------

function contentTypeFor(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".html":
      return "text/html; charset=utf-8";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

// ---------------------------------------------------------------------------
// Recursive directory walk — yields absolute paths
// ---------------------------------------------------------------------------

function* walkDir(dirPath: string): Generator<string> {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

// ---------------------------------------------------------------------------
// Upload a single file
// ---------------------------------------------------------------------------

async function uploadFile(
  localPath: string,
  r2Key: string,
): Promise<void> {
  const body = readFileSync(localPath);
  const contentType = contentTypeFor(localPath);

  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: body,
    ContentType: contentType,
    // Explicitly request Standard. R2 only supports Standard, but stating it
    // explicitly makes the intent impossible to misread.
    StorageClass: "STANDARD",
  });

  await r2.send(cmd);
}

// ---------------------------------------------------------------------------
// Storage class assertion — reads back one object and fails if not STANDARD
// ---------------------------------------------------------------------------

async function assertStorageClass(probeKey: string): Promise<void> {
  const cmd = new HeadObjectCommand({
    Bucket: R2_BUCKET,
    Key: probeKey,
  });

  const response = await r2.send(cmd);
  const storageClass = response.StorageClass;

  // R2 returns "STANDARD" or omits it — both mean Standard.
  // Any other explicit value (e.g., "STANDARD_IA") means a per-GB
  // retrieval charge applies and the restore-costs-nothing property is lost.
  if (storageClass !== undefined && storageClass !== "STANDARD") {
    console.error(
      `STORAGE CLASS ASSERTION FAILED.\n` +
      `  Object:        ${probeKey}\n` +
      `  Expected:      STANDARD\n` +
      `  Got:           ${storageClass}\n` +
      `\n` +
      `Infrequent Access carries a per-GB retrieval charge that destroys the\n` +
      `restore-costs-nothing property that justified choosing R2 (ARCH §5.8).\n` +
      `Investigate bucket configuration immediately.`,
    );
    process.exit(1);
  }

  console.log(
    `Storage class verified: ${storageClass ?? "STANDARD (default)"} on ${probeKey}`,
  );
}

// ---------------------------------------------------------------------------
// Main upload logic
// ---------------------------------------------------------------------------

async function runUpload(archiveDir: string): Promise<void> {
  if (!existsSync(archiveDir)) {
    console.error(
      `UPLOAD FAILED: archive directory not found: ${archiveDir}\n` +
      `Run tools/export/index.ts --verify first.`,
    );
    process.exit(1);
  }

  console.log(`Uploading archive to Eva's R2 bucket: ${R2_BUCKET}`);
  console.log(`Source: ${archiveDir}`);
  console.log(`Endpoint: ${R2_ENDPOINT}`);
  // Do not log access key ID or secret

  const files = Array.from(walkDir(archiveDir));
  if (files.length === 0) {
    console.error("UPLOAD FAILED: archive directory is empty.");
    process.exit(1);
  }

  console.log(`Found ${files.length} file${files.length === 1 ? "" : "s"} to upload.`);

  let probeKey: string | null = null;
  let uploaded = 0;
  let failed = 0;

  for (const localPath of files) {
    // R2 key = path relative to archive dir, with forward slashes
    const r2Key = relative(archiveDir, localPath).replace(/\\/g, "/");

    try {
      await uploadFile(localPath, r2Key);
      uploaded++;
      if (probeKey === null) {
        probeKey = r2Key;
      }
      // Log file name without any credential material
      process.stdout.write(`  OK  ${r2Key}\n`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Do not include the full URL in error output as it contains the bucket name
      console.error(`  FAIL  ${r2Key}: ${message}`);
      failed++;
    }
  }

  console.log(
    `\nUpload complete: ${uploaded} succeeded, ${failed} failed of ${files.length} total.`,
  );

  if (failed > 0) {
    console.error(`UPLOAD FAILED: ${failed} file${failed === 1 ? "" : "s"} could not be uploaded.`);
    process.exit(1);
  }

  // Storage class assertion — must run after at least one successful upload
  if (probeKey === null) {
    console.error("UPLOAD FAILED: no files were uploaded successfully.");
    process.exit(1);
  }

  console.log("\nVerifying storage class on probe object...");
  await assertStorageClass(probeKey);

  console.log("\nDone. Archive is in Eva's R2 bucket.");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const archiveDir = process.argv[2];
if (!archiveDir) {
  console.error(
    "Usage: node --experimental-strip-types tools/export/upload.ts <archive-dir>\n" +
    "Example: node --experimental-strip-types tools/export/upload.ts apps/web/eva-and-adam-archive",
  );
  process.exit(1);
}

runUpload(archiveDir).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nUPLOAD FAILED: ${message}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
