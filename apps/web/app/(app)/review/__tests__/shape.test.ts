/**
 * The shape guarantee behind the review door.
 *
 * `middleware.ts` and `review/layout.tsx` both agree the whole `/review/`
 * prefix is a development-only surface. Neither of them says anything about
 * what these pages are *allowed to do* once a request reaches them — that
 * promise is made once, in the block comment on every page under here
 * ("fixture data only"), and nothing checks it.
 *
 * A count-based test ("there are exactly 2 review pages") would fire on
 * every new harness and be silenced within a week; the property worth
 * protecting is not the count, it is the shape: a review page renders from
 * fixtures, full stop. So this walks every `page.tsx` under `/review/` and
 * its transitive local imports, and fails if any of them touch a live data
 * source — a raw `fetch(`, a `cookies()` read, `next/headers`, or anything
 * under `lib/data/` (the app's single, documented gateway to Supabase; see
 * the comment on `lib/data/client.ts`). External packages are not followed:
 * this is a shape check on this repo's own code, not a license audit.
 *
 * This passes today because every review harness is fixture-only. It is
 * meant to fail the day someone wires one to real data — which is exactly
 * the day this promise stops being true and the day the audit that asked
 * for this test wanted to know about it.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ *
 * Filesystem plumbing
 * ------------------------------------------------------------------ */

// This file lives at app/(app)/review/__tests__/shape.test.ts — four
// directories below the apps/web root.
const webRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const reviewRoot = resolve(webRoot, "app/(app)/review");

const CODE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

function collectPageFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      found.push(...collectPageFiles(full));
    } else if (entry.name === "page.tsx") {
      found.push(full);
    }
  }
  return found;
}

/** Resolves a `from "..."` specifier to a file on disk, or `null` for a
 * package import (anything not starting with "." or "@/") this repo does
 * not own the source of. */
function resolveLocalImport(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = resolve(webRoot, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = resolve(dirname(fromFile), specifier);
  } else {
    return null;
  }

  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of CODE_EXTENSIONS) {
    if (existsSync(base + ext)) return base + ext;
  }
  for (const ext of CODE_EXTENSIONS) {
    const indexPath = join(base, `index${ext}`);
    if (existsSync(indexPath)) return indexPath;
  }
  return null;
}

/** Every static and dynamic import specifier in a source file. Good enough
 * for this repo's plain ESM — not a substitute for a real parser, but this
 * is a shape guard, not a bundler. */
function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [/\bfrom\s+["']([^"']+)["']/g, /\bimport\(\s*["']([^"']+)["']\s*\)/g];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier !== undefined) specifiers.push(specifier);
    }
  }
  return specifiers;
}

/* ------------------------------------------------------------------ *
 * The rule
 * ------------------------------------------------------------------ */

const FORBIDDEN_PACKAGE_SPECIFIERS = [/^next\/headers(\/.*)?$/];

function isServerDataModule(resolvedPath: string): boolean {
  const marker = `${sep}lib${sep}data${sep}`;
  return `${resolvedPath}${sep}`.includes(marker) || resolvedPath.endsWith(`${sep}lib${sep}data.ts`);
}

function relativeToWebRoot(absolutePath: string): string {
  return absolutePath.startsWith(webRoot) ? absolutePath.slice(webRoot.length) : absolutePath;
}

function violationsIn(file: string, seen: Set<string> = new Set()): string[] {
  if (seen.has(file)) return [];
  seen.add(file);

  const source = readFileSync(file, "utf8");
  const violations: string[] = [];
  const label = relativeToWebRoot(file);

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(`${label} calls fetch(...) — review harnesses render fixtures only`);
  }
  if (/\bcookies\s*\(\s*\)/.test(source)) {
    violations.push(`${label} calls cookies() — review harnesses must not read request state`);
  }

  for (const specifier of importSpecifiers(source)) {
    if (FORBIDDEN_PACKAGE_SPECIFIERS.some((pattern) => pattern.test(specifier))) {
      violations.push(`${label} imports "${specifier}" — server-only, not fixture data`);
      continue;
    }

    const resolved = resolveLocalImport(specifier, file);
    if (resolved === null) continue; // external package — out of scope

    if (isServerDataModule(resolved)) {
      violations.push(
        `${label} imports "${specifier}" -> ${relativeToWebRoot(resolved)} — a server data module`,
      );
      continue;
    }

    violations.push(...violationsIn(resolved, seen));
  }

  return violations;
}

/* ------------------------------------------------------------------ *
 * Tests
 * ------------------------------------------------------------------ */

const pageFiles = collectPageFiles(reviewRoot);

describe("review harnesses stay fixture-only", () => {
  it("finds at least one review page to check — an empty walk would pass for the wrong reason", () => {
    expect(pageFiles.length).toBeGreaterThan(0);
  });

  it.each(pageFiles.map((file) => [relativeToWebRoot(file), file] as const))(
    "%s and its local imports touch no live data source",
    (_label, file) => {
      expect(violationsIn(file)).toEqual([]);
    },
  );
});
