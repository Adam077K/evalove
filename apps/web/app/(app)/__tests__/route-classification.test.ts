/**
 * Route classification — every route under app/(app)/ must make one of two
 * explicit choices about the shell's shared gutter (see `../../../
 * components/chrome/Column.tsx` and this group's own `layout.tsx` doc
 * comment): full-bleed (opts out, supplies its own horizontal padding and
 * `--dock-footprint` bottom clearance directly) or Column-opted (wraps its
 * body in `<Column>`, which supplies both).
 *
 * `/book/days` and `/pocket` shipped as neither — the shell went edge-to-
 * edge by default, and both routes were dropped between the two choices
 * without anyone making one, because nothing asserted the set was
 * exhaustive. At 393px that meant a route with zero horizontal padding and,
 * on `/book/days`, no reserved space for the fixed dock over
 * `BookTurnControls` (the WCAG 2.5.7 keyboard/no-drag turn path).
 *
 * This test makes that state impossible to add silently: a new `page.tsx`
 * under `app/(app)/` must be named in `FULL_BLEED_ROUTES` or `EXCLUDED_ROUTES`
 * below, or import and render `<Column>`, before this test passes. It is a
 * static source-text check, not a render — the routes here need a live
 * session, member profiles and shared-day fixtures a plain render can't
 * supply uniformly, and the two questions this test asks ("is this route on
 * the named full-bleed list" and "does this route's source import and
 * render Column") don't need one.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_GROUP_DIR = path.join(__dirname, "..");

/**
 * Routes that render edge-to-edge on purpose and supply their own
 * horizontal padding directly rather than opting into `<Column>`. Each is a
 * "room" with its own `<Paper>` stock and its own dock-clearance figure —
 * see each file's own header comment for why:
 *
 *   today — `<Paper>`'s own `px-5 pb-16 md:px-8`, direct on the stock.
 *   book  — `BookObject` bleeds its spine off the left edge on purpose (no
 *           left padding for it); the doors below it carry `px-5 md:px-8`
 *           of their own. Mixed padding is the point — a uniform Column
 *           gutter would put a margin back on the one edge that must bleed.
 *
 * `book/days` is deliberately NOT here — see the page's own header comment
 * for why it was moved to Column instead (2026-08-07 orphan-route fix).
 */
const FULL_BLEED_ROUTES = new Set(["today", "book"]);

/**
 * Routes excluded from this check, each for a documented reason that is
 * explicitly NOT "forgot to classify it":
 *
 *   echo                 — `redirect()` only (app/(app)/echo/page.tsx); it
 *                           never renders a body, so neither category
 *                           applies to it.
 *   review/book-states,  — dev-only harnesses, gated twice (middleware.ts's
 *   review/today-pair      NODE_ENV check, and this tree's own
 *                           review/layout.tsx notFound()), unreachable from
 *                           the dock, never served in production. Both have
 *                           the same missing-gutter shape as the two P1/P2
 *                           bugs this test guards against, but fixing dev
 *                           harness padding was out of scope for that fix —
 *                           flagged to the team lead rather than silently
 *                           patched or silently ignored.
 */
const EXCLUDED_ROUTES = new Set(["echo", "review/book-states", "review/today-pair"]);

const COLUMN_IMPORT = /from\s+["']@\/components\/chrome\/Column["']/;
const COLUMN_USAGE = /<Column[\s>]/;

/** Every `page.tsx` under `dir`, as a route path relative to `dir` (e.g.
    "book/days"), skipping dotfiles and `__tests__` directories. */
function findPageRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "__tests__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const childBase = base ? `${base}/${entry.name}` : entry.name;
      routes.push(...findPageRoutes(full, childBase));
    } else if (entry.name === "page.tsx" && base !== "") {
      routes.push(base);
    }
  }
  return routes;
}

const routes = findPageRoutes(APP_GROUP_DIR);

describe("route classification — every app/(app) route makes an explicit gutter choice", () => {
  it("the walker still finds the known routes (canary against a discovery regression)", () => {
    expect(routes).toEqual(
      expect.arrayContaining([
        "today",
        "book",
        "book/days",
        "dates",
        "send",
        "pocket",
        "echo",
      ]),
    );
  });

  it.each(routes.filter((route) => !EXCLUDED_ROUTES.has(route)))(
    "%s is either on FULL_BLEED_ROUTES or imports and renders <Column>",
    (route) => {
      if (FULL_BLEED_ROUTES.has(route)) return; // named, deliberate choice

      const source = fs.readFileSync(path.join(APP_GROUP_DIR, route, "page.tsx"), "utf8");
      const usesColumn = COLUMN_IMPORT.test(source) && COLUMN_USAGE.test(source);

      expect(
        usesColumn,
        `app/(app)/${route}/page.tsx is neither in FULL_BLEED_ROUTES nor ` +
          `imports/renders <Column> in route-classification.test.ts — ` +
          `classify it explicitly (add to one of the named sets, or wrap the ` +
          `route in <Column>) before this passes.`,
      ).toBe(true);
    },
  );

  it("FULL_BLEED_ROUTES and EXCLUDED_ROUTES only name routes that actually exist", () => {
    // Guards the guard: a typo in either named set would otherwise silently
    // match nothing and the set would stop doing any work.
    for (const route of FULL_BLEED_ROUTES) {
      expect(routes, `FULL_BLEED_ROUTES has "${route}" but no such page.tsx was found`).toContain(
        route,
      );
    }
    for (const route of EXCLUDED_ROUTES) {
      expect(routes, `EXCLUDED_ROUTES has "${route}" but no such page.tsx was found`).toContain(
        route,
      );
    }
  });

  it("FULL_BLEED_ROUTES and EXCLUDED_ROUTES do not overlap", () => {
    const overlap = [...FULL_BLEED_ROUTES].filter((route) => EXCLUDED_ROUTES.has(route));
    expect(overlap).toEqual([]);
  });
});
