/**
 * verify.ts — checksum re-read for the archive export
 *
 * Re-reads every written photo file, computes its SHA-256, and compares it
 * against the value stored in photos.checksum_sha256 (from the database).
 *
 * "An export that is not verified is a belief, not a backup." — B1 §6
 *
 * Exit behaviour:
 *   - All checksums match   → exits 0, prints a summary line
 *   - Any mismatch found    → prints each mismatch, exits 1
 *   - A file is missing     → counts as a mismatch, exits 1
 *
 * This function does NOT exit the process itself — it returns results so the
 * caller (index.ts) can decide when to call process.exit(). This makes it
 * testable without spawning a subprocess.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerifyEntry {
  /** Absolute path to the file on disk. */
  filePath: string;
  /** Expected SHA-256 hex digest from the database. */
  expectedChecksum: string;
  /** Identifier for error messages (photo id, relative path, etc.). */
  label: string;
}

export type VerifyStatus = "ok" | "mismatch" | "missing";

export interface VerifyResult {
  label: string;
  filePath: string;
  status: VerifyStatus;
  /** The checksum we computed, or null when the file was missing. */
  actualChecksum: string | null;
  expectedChecksum: string;
}

// ---------------------------------------------------------------------------
// SHA-256 of a Buffer
// ---------------------------------------------------------------------------

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// ---------------------------------------------------------------------------
// Core verifier
// ---------------------------------------------------------------------------

/**
 * Verify a list of files against their expected checksums.
 *
 * Reads files sequentially to avoid overwhelming the filesystem with
 * concurrent reads during a large export verify pass.
 */
export async function verifyFiles(
  entries: VerifyEntry[],
): Promise<VerifyResult[]> {
  const results: VerifyResult[] = [];

  for (const entry of entries) {
    if (!existsSync(entry.filePath)) {
      results.push({
        label: entry.label,
        filePath: entry.filePath,
        status: "missing",
        actualChecksum: null,
        expectedChecksum: entry.expectedChecksum,
      });
      continue;
    }

    const bytes = await readFile(entry.filePath);
    const actual = sha256Hex(bytes);
    // Normalise both to lowercase before comparing — DB may store uppercase.
    const match =
      actual.toLowerCase() === entry.expectedChecksum.toLowerCase();

    results.push({
      label: entry.label,
      filePath: entry.filePath,
      status: match ? "ok" : "mismatch",
      actualChecksum: actual,
      expectedChecksum: entry.expectedChecksum,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Summary helpers used by the CLI
// ---------------------------------------------------------------------------

export interface VerifySummary {
  total: number;
  ok: number;
  mismatches: VerifyResult[];
  missing: VerifyResult[];
  /** True when all files were present and checksums matched. */
  passed: boolean;
}

export function summariseResults(results: VerifyResult[]): VerifySummary {
  const mismatches = results.filter((r) => r.status === "mismatch");
  const missing = results.filter((r) => r.status === "missing");
  const ok = results.filter((r) => r.status === "ok").length;

  return {
    total: results.length,
    ok,
    mismatches,
    missing,
    passed: mismatches.length === 0 && missing.length === 0,
  };
}
