/**
 * verify.test.ts — tests for the checksum verifier
 *
 * Uses a temporary directory and real file I/O (node:fs/node:os).
 * No database, no network, no Supabase.
 *
 * Tests the pure sha256Hex function and the verifyFiles / summariseResults
 * pipeline against fixture bytes written to temp files.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

import {
  sha256Hex,
  verifyFiles,
  summariseResults,
} from "../verify.ts";
import type { VerifyEntry } from "../verify.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256OfString(s: string): string {
  return createHash("sha256").update(Buffer.from(s)).digest("hex");
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "eva-adam-verify-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// sha256Hex
// ---------------------------------------------------------------------------

describe("sha256Hex", () => {
  it("produces the correct SHA-256 for known input", () => {
    // SHA-256 of an empty buffer
    const empty = Buffer.alloc(0);
    const known = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(sha256Hex(empty)).toBe(known);
  });

  it("produces lowercase hex output", () => {
    const bytes = Buffer.from("test");
    const result = sha256Hex(bytes);
    expect(result).toBe(result.toLowerCase());
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different values for different inputs", () => {
    const a = sha256Hex(Buffer.from("alpha"));
    const b = sha256Hex(Buffer.from("beta"));
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// verifyFiles
// ---------------------------------------------------------------------------

describe("verifyFiles", () => {
  it("returns ok for a file whose checksum matches", async () => {
    const content = "a photograph in bytes";
    const filePath = join(tempDir, "ok.jpg");
    writeFileSync(filePath, Buffer.from(content));
    const expected = sha256OfString(content);

    const entries: VerifyEntry[] = [
      { filePath, expectedChecksum: expected, label: "test-ok" },
    ];
    const results = await verifyFiles(entries);

    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe("ok");
    expect(results[0]!.actualChecksum).toBe(expected);
  });

  it("returns mismatch for a file whose checksum does not match", async () => {
    const filePath = join(tempDir, "corrupted.jpg");
    writeFileSync(filePath, Buffer.from("actual content"));

    const entries: VerifyEntry[] = [
      { filePath, expectedChecksum: "0000000000000000000000000000000000000000000000000000000000000000", label: "test-mismatch" },
    ];
    const results = await verifyFiles(entries);

    expect(results[0]!.status).toBe("mismatch");
    expect(results[0]!.actualChecksum).not.toBe("0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("returns missing for a file that does not exist", async () => {
    const filePath = join(tempDir, "does-not-exist.jpg");

    const entries: VerifyEntry[] = [
      { filePath, expectedChecksum: "irrelevant", label: "test-missing" },
    ];
    const results = await verifyFiles(entries);

    expect(results[0]!.status).toBe("missing");
    expect(results[0]!.actualChecksum).toBeNull();
  });

  it("performs case-insensitive checksum comparison", async () => {
    const content = "case insensitive bytes";
    const filePath = join(tempDir, "case.jpg");
    writeFileSync(filePath, Buffer.from(content));

    // Compute expected, then uppercase it
    const expected = sha256OfString(content).toUpperCase();

    const entries: VerifyEntry[] = [
      { filePath, expectedChecksum: expected, label: "test-case" },
    ];
    const results = await verifyFiles(entries);

    // Should match even though the stored checksum is uppercase
    expect(results[0]!.status).toBe("ok");
  });

  it("handles an empty entry list", async () => {
    const results = await verifyFiles([]);
    expect(results).toHaveLength(0);
  });

  it("verifies multiple files, reporting each independently", async () => {
    const file1 = join(tempDir, "f1.jpg");
    const file2 = join(tempDir, "f2.jpg");
    writeFileSync(file1, Buffer.from("content-one"));
    writeFileSync(file2, Buffer.from("content-two"));

    const entries: VerifyEntry[] = [
      {
        filePath: file1,
        expectedChecksum: sha256OfString("content-one"),
        label: "f1",
      },
      {
        filePath: file2,
        expectedChecksum: "wrongchecksum",
        label: "f2",
      },
    ];
    const results = await verifyFiles(entries);

    expect(results).toHaveLength(2);
    expect(results[0]!.status).toBe("ok");
    expect(results[1]!.status).toBe("mismatch");
  });
});

// ---------------------------------------------------------------------------
// summariseResults
// ---------------------------------------------------------------------------

describe("summariseResults", () => {
  it("reports passed:true when all files are ok", async () => {
    const filePath = join(tempDir, "good.jpg");
    const content = "good bytes";
    writeFileSync(filePath, Buffer.from(content));

    const results = await verifyFiles([
      { filePath, expectedChecksum: sha256OfString(content), label: "good" },
    ]);
    const summary = summariseResults(results);

    expect(summary.passed).toBe(true);
    expect(summary.ok).toBe(1);
    expect(summary.mismatches).toHaveLength(0);
    expect(summary.missing).toHaveLength(0);
  });

  it("reports passed:false when any file has a mismatch", async () => {
    const filePath = join(tempDir, "bad.jpg");
    writeFileSync(filePath, Buffer.from("bad bytes"));

    const results = await verifyFiles([
      { filePath, expectedChecksum: "wrongchecksum", label: "bad" },
    ]);
    const summary = summariseResults(results);

    expect(summary.passed).toBe(false);
    expect(summary.mismatches).toHaveLength(1);
  });

  it("reports passed:false when any file is missing", async () => {
    const filePath = join(tempDir, "gone.jpg");
    // Do not create the file

    const results = await verifyFiles([
      { filePath, expectedChecksum: "any", label: "gone" },
    ]);
    const summary = summariseResults(results);

    expect(summary.passed).toBe(false);
    expect(summary.missing).toHaveLength(1);
  });

  it("counts total correctly", async () => {
    const file1 = join(tempDir, "v1.jpg");
    const file2 = join(tempDir, "v2.jpg");
    writeFileSync(file1, Buffer.from("a"));
    writeFileSync(file2, Buffer.from("b"));

    const results = await verifyFiles([
      { filePath: file1, expectedChecksum: sha256OfString("a"), label: "v1" },
      { filePath: file2, expectedChecksum: sha256OfString("b"), label: "v2" },
    ]);
    const summary = summariseResults(results);

    expect(summary.total).toBe(2);
    expect(summary.ok).toBe(2);
    expect(summary.passed).toBe(true);
  });
});
