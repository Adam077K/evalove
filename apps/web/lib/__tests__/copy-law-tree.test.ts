/**
 * The repo-wide sweep `RELATIVE_TIME_PATTERN`'s own header comment points
 * at: everything else that imports the pattern checks one known string
 * against it, which is exactly why two more breaches (SealedCard.tsx,
 * stamp.ts's dstNote — see lib/copy-law.ts) shipped after the first three
 * were fixed. Nothing walked the tree, so a breach anywhere else was
 * invisible until someone happened to re-read that exact file.
 *
 * This test walks `app/`, `components/` and `lib/` for every string literal
 * and template literal in the source (via the TypeScript compiler API, not
 * a text grep — comments and non-literal code are never candidates, and a
 * `${…}` interpolation can't hide a static prefix or suffix from it either)
 * and asserts none of them match `RELATIVE_TIME_PATTERN`, except the named,
 * reasoned exceptions below.
 *
 * Two allowlists, on purpose:
 *
 *   ALLOWLIST      — judged, permanent, non-breaches. Each entry pairs an
 *                     exact (file, literal text) match with the reasoning
 *                     for why it is not a Rule 1 violation.
 *   OPEN_FINDINGS  — real matches this sweep did NOT judge safe and did NOT
 *                     fix, because the surface belongs to a decision this
 *                     task wasn't scoped to make. Excluded here so the
 *                     suite stays green, but printed as a warning on every
 *                     run and reported to the team lead — an entry here is
 *                     a flag, not a verdict. `Do not allowlist something
 *                     just to get the test green` (team-lead brief,
 *                     2026-08-07) is why this list is not just folded into
 *                     ALLOWLIST.
 *
 * Adding a new entry to either list is a deliberate, reviewable line — the
 * bar for ALLOWLIST is "this is provably not a relative-time claim about a
 * specific record", not "this made the test pass."
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { RELATIVE_TIME_PATTERN } from "@/lib/copy-law";

const WEB_ROOT = path.join(__dirname, "..", "..");
const SCAN_DIRS = ["app", "components", "lib"];

function shouldSkipPath(p: string): boolean {
  const parts = p.split(path.sep);
  if (parts.includes("node_modules") || parts.includes(".next")) return true;
  // __tests__ dirs, and the odd `sw.__tests__` directory name — test code
  // legitimately contains the banned phrases as fixtures/expectations.
  if (parts.some((seg) => seg.includes("__tests__"))) return true;
  if (/\.(test|spec)\.tsx?$/.test(p)) return true;
  return false;
}

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (shouldSkipPath(full)) continue;
    if (entry.isDirectory()) {
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

interface Hit {
  /** Relative to apps/web, forward-slashed, e.g. "lib/stamp.ts". */
  file: string;
  line: number;
  /** The literal's static text. Template interpolations are rendered as
      the literal "${…}" placeholder — never the runtime value, which this
      static walk never evaluates. */
  text: string;
}

function literalTextOf(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map((span) => `\${…}${span.literal.text}`),
    ].join("");
  }
  return undefined;
}

function collectHits(file: string): Hit[] {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const hits: Hit[] = [];
  const relFile = path.relative(WEB_ROOT, file).split(path.sep).join("/");

  function visit(node: ts.Node) {
    const text = literalTextOf(node);
    if (text !== undefined && RELATIVE_TIME_PATTERN.test(text)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      hits.push({ file: relFile, line: line + 1, text });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

const files = SCAN_DIRS.flatMap((dir) => collectSourceFiles(path.join(WEB_ROOT, dir)));
const allHits = files.flatMap(collectHits);

interface AllowlistEntry {
  file: string;
  text: string;
  reason: string;
}

/**
 * Legitimate, permanent non-breaches. Route paths and internal ids are
 * grouped first (never rendered as prose), then the two exception
 * categories `RELATIVE_TIME_PATTERN`'s own header comment already
 * documents: the "Today" proper noun, and an activity/game template's own
 * present-moment instruction (the existing "tonight" precedent).
 */
const ALLOWLIST: AllowlistEntry[] = [
  // Route paths — technical strings a person never reads as prose.
  { file: "app/(app)/echo/page.tsx", text: "/today", reason: "redirect() target, a route path" },
  { file: "app/page.tsx", text: "/today", reason: "redirect target, a route path" },
  { file: "components/auth/LoginForm.tsx", text: "/today", reason: "post-login redirect target, a route path" },
  { file: "components/chrome/Dock.tsx", text: "/today", reason: "tab href, a route path" },

  // "Today" the proper noun — the room's own name (the dock tab, the page
  // title, the region landmark), not a claim about when something
  // happened. Same exception the pattern's header comment already carves
  // out for this exact family of string.
  { file: "components/chrome/Dock.tsx", text: "Today", reason: "proper noun — dock tab label" },
  { file: "app/(app)/today/page.tsx", text: "Today — Eva & Adam", reason: "proper noun — page title" },
  {
    file: "app/(app)/review/today-pair/page.tsx",
    text: "Review: today pair — dev",
    reason:
      "proper noun (names the /today route) in a dev-only page title, gated twice — middleware.ts's NODE_ENV check and review/layout.tsx's notFound(); never served in production",
  },
  { file: "components/home/TodayPair.tsx", text: "Today", reason: "proper noun — region aria-label, all four render branches" },
  {
    file: "components/home/TodayPair.tsx",
    text: "Today's newest photograph",
    reason: "proper noun possessive — fallback alt text naming which half of the Today pair this is, only used when the photo has no caption; not a claim about when it was taken",
  },
  {
    file: "components/home/TodayPair.tsx",
    text: "Today's other photograph",
    reason: "proper noun possessive — fallback alt text, same as above",
  },

  // Internal identifiers — seeds for Mounted/Taped's own deterministic
  // angle/elevation choices, never rendered as visible copy.
  { file: "components/home/TodayPair.tsx", text: "today-hero", reason: "internal Mounted context id, not copy" },
  { file: "components/materials/Mounted.tsx", text: "today-hero", reason: "internal context id, not copy" },

  // Activity/game-template category, not a record's timestamp — the same
  // shape the pattern's header comment already carves out for "tonight" in
  // HOW_IT_WORKS: read and answered in the moment, never a claim about
  // when something was recorded.
  {
    file: "lib/fixtures/dates.ts",
    text: "What did you see out a window today that the other one would have photographed?",
    reason:
      "the paired-question prompt — asks about the day it's read and answered, not a stored record's timestamp",
  },
  {
    file: "lib/ai/chat.ts",
    text: "That's me done for today. There's more of the day left than there is of me — ",
    reason:
      "present-moment capacity statement (\"done for today\" = for the remainder of the current day), not a claim about when a past record happened — the same category as the tonight exception, not a record timestamp",
  },

  // Not a timestamp claim at all — a rate-limit policy window. This is a
  // real gap the forward-relative branch (added 2026-08-07 to catch
  // "tomorrow" / "in three days") opened: "in 24 hours" reads the same to
  // the pattern whether it means "will happen three days from now" or "per
  // rolling 24-hour period", and only the second is true here. Recorded
  // here rather than complicating the pattern further to tell them apart.
  {
    file: "lib/data/photos.ts",
    text: "at most ${…} purges may be requested in 24 hours",
    reason: "rate-limit policy window (\"N per 24h\"), not a claim about when an event happened",
  },
];

/**
 * Real matches this sweep found and did NOT judge safe — each is a
 * genuine candidate Rule 1 breach in user-visible copy that this task
 * chose to report rather than fix or wave through, because the surface it
 * lives in is under a decision this task wasn't scoped to make. See the
 * file header for why this is a separate list from ALLOWLIST.
 */
const OPEN_FINDINGS: AllowlistEntry[] = [
  {
    file: "components/echo/EchoChat.tsx",
    text: "What did ${…} post this week?",
    reason:
      "a suggested-question chip inside Echo, shown before anything is sent — this reads as a genuine Rule 1 candidate (\"this week\" describing a search window read the same way \"3 days ago\" does), but Echo is explicitly a pending founder decision right now (project state, AI-PARTNER-SPEC.md §12) and this task was not scoped to rewrite its suggested prompts. Reported to the team lead rather than rewritten or allowlisted as legitimate.",
  },
];

describe("copy-law tree walk — every string/template literal under app/, components/, lib/", () => {
  it("scanned a non-trivial number of files (canary against a walker regression)", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("found exactly the known matches — a new, unclassified match must fail this test", () => {
    const known = new Set(
      [...ALLOWLIST, ...OPEN_FINDINGS].map((entry) => `${entry.file} ${entry.text}`),
    );
    const unclassified = allHits.filter(
      (hit) => !known.has(`${hit.file} ${hit.text}`),
    );

    expect(
      unclassified,
      unclassified
        .map((h) => `${h.file}:${h.line}  ${JSON.stringify(h.text)} — not in ALLOWLIST or OPEN_FINDINGS`)
        .join("\n"),
    ).toEqual([]);
  });

  it("ALLOWLIST and OPEN_FINDINGS entries still exist in the tree (no stale allowlisting)", () => {
    const present = new Set(allHits.map((hit) => `${hit.file} ${hit.text}`));
    for (const entry of [...ALLOWLIST, ...OPEN_FINDINGS]) {
      expect(
        present.has(`${entry.file} ${entry.text}`),
        `${entry.file}: ${JSON.stringify(entry.text)} is listed but no longer matches anything in the tree — remove the stale entry`,
      ).toBe(true);
    }
  });

  if (OPEN_FINDINGS.length > 0) {
    it("prints OPEN_FINDINGS so a real, unresolved candidate breach is never silent", () => {
      // eslint-disable-next-line no-console -- deliberate: this is the
      // whole point of keeping OPEN_FINDINGS separate from ALLOWLIST.
      console.warn(
        `\ncopy-law-tree: ${OPEN_FINDINGS.length} open finding(s), not fixed, not judged legitimate:\n` +
          OPEN_FINDINGS.map((f) => `  - ${f.file}: ${JSON.stringify(f.text)}\n    ${f.reason}`).join("\n") +
          "\n",
      );
      expect(OPEN_FINDINGS.length).toBeGreaterThan(0);
    });
  }
});
