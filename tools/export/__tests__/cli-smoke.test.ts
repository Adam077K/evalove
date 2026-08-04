/**
 * cli-smoke.test.ts — subprocess smoke test for tools/export/index.ts
 *
 * Spawns the CLI with a completely empty environment (no env vars at all)
 * and asserts that:
 *
 *   1. The process exits non-zero.
 *   2. stderr contains a recognisable configuration error (missing SUPABASE_URL
 *      or similar), proving that module resolution succeeded and the program
 *      started.
 *   3. stderr does NOT contain ERR_MODULE_NOT_FOUND, which would mean
 *      @supabase/supabase-js (or another import) could not be resolved.
 *
 * This test requires no database, no credentials, no network.
 * It is the cheapest possible proof that the import graph works.
 *
 * If this test fails with ERR_MODULE_NOT_FOUND, a dependency is missing from
 * tools/package.json. Fix: add the dependency and run pnpm install in tools/.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Absolute path to the CLI entry point
const CLI_PATH = join(__dirname, "..", "index.ts");

describe("export CLI — module resolution smoke test", () => {
  it("exits non-zero with a configuration error, not a module-resolution error", () => {
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", CLI_PATH],
      {
        // Empty environment — no SUPABASE_URL, no anything.
        // This forces the program to fail at the config-validation step,
        // which only runs after all imports have resolved successfully.
        env: {},
        encoding: "utf8",
        // Give it 15 seconds — strip-types startup is slower than pre-compiled.
        timeout: 15_000,
      },
    );

    // Should have exited — not still running.
    expect(result.status, "process should have exited").not.toBeNull();

    // Should exit non-zero (config error or module error — both are non-zero,
    // but we distinguish them below).
    expect(result.status, "exit code should be non-zero").not.toBe(0);

    const stderr = result.stderr ?? "";

    // The fatal failure: module resolution failure. If this appears, the
    // dependency is missing from tools/package.json.
    expect(
      stderr,
      "ERR_MODULE_NOT_FOUND must not appear — add missing dep to tools/package.json",
    ).not.toContain("ERR_MODULE_NOT_FOUND");

    // The expected failure: the CLI started, cleared module resolution, reached
    // createExportClient() in read.ts, and threw on the missing URL guard.
    // This exact string is what read.ts line 127 throws when SUPABASE_URL is absent.
    // Using the exact string (not a substring) catches any regression where the
    // error message changes to something unexpected.
    expect(
      stderr,
      `stderr should contain the config-error string from read.ts. Got:\n${stderr}`,
    ).toContain("Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set");
  });
});
