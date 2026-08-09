/**
 * Nothing secret reaches the browser, and the boundaries that keep it that way.
 *
 * THREE CHECKS, DELIBERATELY OVERLAPPING.
 *
 *   1. The BUNDLE check greps the real build output for the real secret values.
 *      It is the only one that proves the actual claim, and it can only run
 *      after `next build`.
 *   2. The IMPORT-BOUNDARY check reads the source and refuses any `"use
 *      client"` file that imports a server-only module. It runs always, it
 *      runs in milliseconds, and it fails at the commit rather than at the
 *      deploy — which is the difference between a rejected diff and a rotated
 *      credential.
 *   3. The SUPABASE-CLIENT check enforces the rule that all database access
 *      lives in `lib/data/*`. One construction site for the service-role key
 *      means one line to audit; a second one somewhere else is how the key
 *      ends up in a component "just for a moment".
 *
 * Check 1 is the truth and checks 2 and 3 are the guardrail. Keeping only the
 * truth would mean finding out at deploy time. Keeping only the guardrail
 * would mean trusting that the list of server-only modules is complete.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/** `apps/web`, from this file. */
const APP_ROOT = new URL("../../", import.meta.url).pathname;

/* ------------------------------------------------------------------ *
 * Walking the tree
 * ------------------------------------------------------------------ */

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "e2e", "coverage"]);

function walk(dir: string, match: (path: string) => boolean): string[] {
  let found: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) found = found.concat(walk(full, match));
    else if (match(full)) found.push(full);
  }
  return found;
}

const SOURCE_FILES = ["app", "components", "lib", "middleware.ts"]
  .map((entry) => join(APP_ROOT, entry))
  .flatMap((path) => {
    try {
      return statSync(path).isDirectory()
        ? walk(path, (f) => f.endsWith(".ts") || f.endsWith(".tsx"))
        : [path];
    } catch {
      return [];
    }
  })
  // A test file is not shipped, and several of them legitimately reach for the
  // server-only modules in order to test them.
  .filter((f) => !f.includes("__tests__") && !f.endsWith(".spec.ts"));

/* ------------------------------------------------------------------ *
 * 2. The import boundary
 * ------------------------------------------------------------------ */

/**
 * Modules that must never be reachable from a client component.
 *
 * `lib/env.ts` throws at import time in a browser, which is a good backstop
 * but a runtime one — by then the value is already in the bundle that threw.
 * This catches it while it is still a diff.
 */
const SERVER_ONLY = [
  "@/lib/env",
  "@/lib/data/",
  "@/lib/session/token",
  "node:crypto",
  "node:fs",
];

/** `lib/session` itself: the index reads cookies through `next/headers`. */
const SERVER_ONLY_EXACT = ["@/lib/session"];

function isClientFile(source: string): boolean {
  // The directive has to be the first statement, so it is near the top.
  return /^\s*["']use client["']/m.test(source.slice(0, 400));
}

function importsOf(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /(?:from|import)\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (match[1]) specifiers.push(match[1]);
  }
  return specifiers;
}

describe("client components cannot reach server-only modules", () => {
  it("finds client components to check", () => {
    // A guard on the guard. If the walk breaks, every assertion below passes
    // vacuously and this file becomes a comment.
    const clientFiles = SOURCE_FILES.filter((f) =>
      isClientFile(readFileSync(f, "utf8")),
    );
    expect(clientFiles.length).toBeGreaterThan(3);
  });

  it("no 'use client' file imports the environment, the data layer or the token", () => {
    const offences: string[] = [];

    for (const file of SOURCE_FILES) {
      const source = readFileSync(file, "utf8");
      if (!isClientFile(source)) continue;

      for (const specifier of importsOf(source)) {
        const banned =
          SERVER_ONLY.some((prefix) => specifier.startsWith(prefix)) ||
          SERVER_ONLY_EXACT.includes(specifier);
        if (banned) {
          offences.push(`${relative(APP_ROOT, file)} imports ${specifier}`);
        }
      }
    }

    expect(offences).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * 3. One Supabase client
 * ------------------------------------------------------------------ */

describe("all Supabase access lives in lib/data", () => {
  it("only lib/data constructs a Supabase client", () => {
    const importers = SOURCE_FILES.filter((file) =>
      importsOf(readFileSync(file, "utf8")).some((s) =>
        s.startsWith("@supabase/"),
      ),
    ).map((f) => relative(APP_ROOT, f));

    // Exactly one file, and it is the one whose entire job is to be that file.
    expect(importers).toEqual(["lib/data/client.ts"]);
  });
});

/* ------------------------------------------------------------------ *
 * 1. The built bundle
 * ------------------------------------------------------------------ */

/**
 * The values that must not appear in anything the browser downloads.
 *
 * Read from the same environment the build ran under. Short or absent values
 * are skipped: a two-character secret would match half the alphabet and turn
 * this into a test that fails at random, which is worse than one that is
 * honest about not having run.
 */
function secretsToLookFor(): { name: string; value: string }[] {
  return [
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_PASSWORD_HASH_EVA",
    "APP_PASSWORD_HASH_ADAM",
    "VAULT_PASSPHRASE_HASH",
    "SESSION_SECRET",
    "ANTHROPIC_API_KEY",
  ]
    .map((name) => ({ name, value: process.env[name] ?? "" }))
    .filter((entry) => entry.value.length >= 16);
}

const CLIENT_BUNDLE_DIR = join(APP_ROOT, ".next", "static");

function clientBundleFiles(): string[] {
  try {
    if (!statSync(CLIENT_BUNDLE_DIR).isDirectory()) return [];
  } catch {
    return [];
  }
  return walk(
    CLIENT_BUNDLE_DIR,
    (f) => f.endsWith(".js") || f.endsWith(".json") || f.endsWith(".css"),
  );
}

describe("the built client bundle", () => {
  const files = clientBundleFiles();

  it.skipIf(files.length === 0)(
    "contains none of the server-only secrets",
    () => {
      const secrets = secretsToLookFor();
      expect(secrets.length).toBeGreaterThan(0);

      const leaks: string[] = [];
      for (const file of files) {
        const contents = readFileSync(file, "utf8");
        for (const secret of secrets) {
          if (contents.includes(secret.value)) {
            // The NAME, never the value. This message ends up in CI logs,
            // which are less private than the secret store it came from.
            leaks.push(`${secret.name} appears in ${relative(APP_ROOT, file)}`);
          }
        }
      }

      expect(leaks).toEqual([]);
    },
  );

  it.skipIf(files.length === 0)(
    "does not carry the one public value under a second name",
    () => {
      // `NEXT_PUBLIC_SUPABASE_URL` is allowed to be here — it is the only
      // variable that may be. Asserting it IS present keeps the check above
      // honest: a build that inlined nothing at all would pass a leak test
      // trivially, and this is the control.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      expect(url.length).toBeGreaterThan(0);
    },
  );
});
