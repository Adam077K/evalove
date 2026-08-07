/**
 * Today and The Book render real photographs, not fixtures — a structural
 * test over the module graph, not a mock.
 *
 * THE BUG THIS GUARDS AGAINST. `lib/data/photos.ts` exports `listPhotos` and
 * `todaySnapshot` — the real read layer against Supabase — and for a whole
 * wave they had zero callers. Every rendered page imported from
 * `lib/fixtures/` instead and showed picsum.photos stock images: a
 * photograph either person sent was written to the database and never
 * displayed to anyone. A test that renders the page and asserts on props
 * cannot catch this, because the page rendered fine — it just rendered the
 * wrong data, by construction, every time. The only check that catches "the
 * whole page is wired to the wrong data source" is one that reads the wiring
 * itself: what does each page actually import, transitively, all the way
 * down.
 *
 * WHAT THIS WALKS. Starting from Today's and The Book's three page files,
 * this follows every `@/`-aliased and relative import, recursively, and
 * collects the full set of source files each page's render tree can reach —
 * the same shape `lib/__tests__/no-client-secrets.test.ts` checks for
 * `"use client"` boundaries, extended to actually traverse rather than
 * inspect one file's own imports.
 *
 * TWO ASSERTIONS ON THAT SET:
 *
 *   1. No file in the reachable set imports a `lib/fixtures/*` module,
 *      except the small, named, reasoned ALLOWLIST below. A fixture import
 *      anywhere in the graph — not just in the page file itself — is exactly
 *      how the original bug hid inside `TodayPair()`/`todaysObject()` and
 *      `bookLeaves()`, two and three components removed from the page.
 *   2. The reachable set DOES include `lib/data/*` — proving the ban above
 *      isn't satisfied by accident (a page that imports nothing at all would
 *      vacuously pass assertion 1).
 *
 * WHY `@/lib/fixtures/resolve` IS THE ONE MODULE EXEMPT, GLOBALLY. `photoSrc`
 * / `thumbSrc` are not stand-in data — they are the seam that turns any
 * `Photo` (fixture or real) into a URL, and for a real photo id they resolve
 * to the honest `/p/{id}/{variant}.jpg` proxy path (see the doc comment on
 * `photoSrc` itself). Banning it here would either break every real photo
 * on screen or force duplicating that resolution logic outside the
 * directory it happens to live in. `lib/fixtures/photos.ts`, `book.ts`,
 * `clock.ts` and (for identity) `members.ts` carry no such exemption: they
 * are the stand-in archive, calendar and roster this task existed to stop
 * Today and The Book from reading.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = path.join(__dirname, "..", "..");

const ENTRY_POINTS = [
  "app/(app)/today/page.tsx",
  "app/(app)/book/page.tsx",
  "app/(app)/book/days/page.tsx",
];

/**
 * Every `lib/fixtures/*` import this walk is allowed to find, and why.
 * Each entry is (importing file, exact specifier) — as narrow as the
 * copy-law tree walk's own ALLOWLIST, for the same reason: a new entry here
 * must be a deliberate, reviewable line, not a way to silence this test.
 */
const FIXTURE_ALLOWLIST: { file: string; specifier: string; reason: string }[] = [
  {
    file: "components/home/SealedCard.tsx",
    specifier: "@/lib/fixtures/members",
    reason:
      "the sealed-note-left-for-later feature (SealedCard), not a photograph. " +
      "It has no live data source at all yet — no table backs `lib/fixtures/left.ts` " +
      "— and was out of scope for this task, which wired `listPhotos`/`todaySnapshot`. " +
      "Tracked separately; see the next two entries.",
  },
  {
    file: "components/home/SealedCard.tsx",
    specifier: "@/lib/fixtures/left",
    reason: "same feature, same gap — the fixture archive of notes left for later.",
  },
  {
    file: "lib/viewer.ts",
    specifier: "@/lib/fixtures/members",
    reason:
      "`useViewer()`, reached one hop further down the same SealedCard subtree above " +
      "(nothing else in Today's or the Book's render tree calls it) — resolves the " +
      "fixture Eva/Adam `Member` record for whichever profile the cookie names, so " +
      "SealedCard can filter that person's own waiting notes. Same out-of-scope feature, " +
      "not a photograph.",
  },
  {
    file: "lib/resurface.ts",
    specifier: "@/lib/fixtures/photos",
    reason:
      "the DEFAULT VALUE of `whatCameBack`'s second parameter, never evaluated on a real " +
      "surface: `liveWhatCameBack` (`lib/data/archive.ts`) always calls `whatCameBack(now, " +
      "archive)` with the real archive supplied explicitly, and the review harness and " +
      "`lib/__tests__/resurface.test.ts` both rely on this exact default for ~20 assertions " +
      "each — removing it to satisfy this walk would be editing an established test suite's " +
      "behaviour to chase a false positive, not fixing a real fixture leak.",
  },
];

/** `@/lib/fixtures/resolve` is exempt everywhere — see the file header. */
const GLOBALLY_EXEMPT_SPECIFIER = "@/lib/fixtures/resolve";

/* ------------------------------------------------------------------ *
 * Resolving one import specifier to a file, and walking the graph
 * ------------------------------------------------------------------ */

function importsOf(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /(?:from|import)\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (match[1]) specifiers.push(match[1]);
  }
  return specifiers;
}

/** `.ts`, `.tsx`, then the two `index` forms — the resolutions Next's own
    bundler would try, in the order it tries them. */
function resolveToFile(absNoExt: string): string | undefined {
  for (const candidate of [
    `${absNoExt}.tsx`,
    `${absNoExt}.ts`,
    path.join(absNoExt, "index.tsx"),
    path.join(absNoExt, "index.ts"),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

/** Absolute path for an import specifier, or `undefined` for a bare package
    specifier (`react`, `next/link`, `lucide-react`, …) — nothing under this
    repo's own source tree, so nothing for the walk to follow. */
function resolveSpecifier(specifier: string, fromFile: string): string | undefined {
  if (specifier.startsWith("@/")) {
    return resolveToFile(path.join(WEB_ROOT, specifier.slice(2)));
  }
  if (specifier.startsWith(".")) {
    return resolveToFile(path.join(path.dirname(fromFile), specifier));
  }
  return undefined; // a bare package specifier — not part of this repo's tree
}

interface WalkResult {
  /** Absolute paths of every file reachable from the entry points. */
  reached: Set<string>;
  /** Every `lib/fixtures/*` (file, specifier) pair the walk found, minus
      the globally exempt specifier. */
  fixtureHits: { file: string; specifier: string }[];
}

function walk(entryFiles: string[]): WalkResult {
  const reached = new Set<string>();
  const fixtureHits: { file: string; specifier: string }[] = [];
  const queue = [...entryFiles];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (reached.has(file)) continue;
    reached.add(file);

    const source = fs.readFileSync(file, "utf8");
    const relFile = path.relative(WEB_ROOT, file).split(path.sep).join("/");

    for (const specifier of importsOf(source)) {
      if (
        specifier.startsWith("@/lib/fixtures/") &&
        specifier !== GLOBALLY_EXEMPT_SPECIFIER
      ) {
        fixtureHits.push({ file: relFile, specifier });
      }

      const resolved = resolveSpecifier(specifier, file);
      if (resolved !== undefined) queue.push(resolved);
    }
  }

  return { reached, fixtureHits };
}

/* ------------------------------------------------------------------ *
 * The walk, run once for both assertions below
 * ------------------------------------------------------------------ */

const entryFiles = ENTRY_POINTS.map((p) => path.join(WEB_ROOT, p));
const { reached, fixtureHits } = walk(entryFiles);

describe("Today and The Book read the real archive, not fixtures", () => {
  it("the walk actually traversed something (canary against a resolver regression)", () => {
    // A guard on the guard, same as copy-law-tree.test.ts's own canary: if
    // `resolveSpecifier` silently stops resolving anything, every assertion
    // below passes vacuously and this file becomes a comment.
    expect(reached.size).toBeGreaterThan(15);
  });

  it("the reachable set includes lib/data/ — proving the pages are wired to it, not just avoiding fixtures by not reading anything", () => {
    const dataFiles = [...reached].filter((f) =>
      f.split(path.sep).join("/").includes("/lib/data/"),
    );
    const relDataFiles = dataFiles.map((f) => path.relative(WEB_ROOT, f).split(path.sep).join("/"));

    expect(relDataFiles).toEqual(
      expect.arrayContaining([
        "lib/data/today.ts",
        "lib/data/archive.ts",
        "lib/data/photos.ts",
      ]),
    );
  });

  it("no fixture import outside the named, reasoned allowlist", () => {
    const known = new Set(
      FIXTURE_ALLOWLIST.map((e) => `${e.file} ${e.specifier}`),
    );
    const unclassified = fixtureHits.filter(
      (hit) => !known.has(`${hit.file} ${hit.specifier}`),
    );

    expect(
      unclassified,
      unclassified
        .map((h) => `${h.file} imports ${h.specifier} — not in FIXTURE_ALLOWLIST`)
        .join("\n"),
    ).toEqual([]);
  });

  it("FIXTURE_ALLOWLIST entries still exist in the tree (no stale allowlisting)", () => {
    const present = new Set(fixtureHits.map((h) => `${h.file} ${h.specifier}`));
    for (const entry of FIXTURE_ALLOWLIST) {
      expect(
        present.has(`${entry.file} ${entry.specifier}`),
        `${entry.file}: ${entry.specifier} is allowlisted but no longer imported — remove the stale entry`,
      ).toBe(true);
    }
  });
});
