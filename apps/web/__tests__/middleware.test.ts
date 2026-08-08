/**
 * The review door — the one boundary in `middleware.ts` that is allowed to
 * differ between environments.
 *
 * Everything else on the allowlist is constant: the same paths are public in
 * every environment `middleware.ts` runs in. `/review/` is the single
 * exception, gated on `process.env.NODE_ENV`, and that makes it the one line
 * on the list worth its own suite rather than trusting the comment above it.
 *
 * `middleware.ts` reads `NODE_ENV` exactly once, at module evaluation, to
 * build `PUBLIC_PREFIXES` — that is what lets `next build` inline it away in
 * production (see the comment in the source). It also means a changed env
 * value only takes effect on a *fresh* import: `vi.resetModules()` plus a
 * dynamic `import()` inside `middlewareUnder` below is what forces that
 * re-evaluation once per case, rather than once for the whole file.
 *
 * THE FAIL-OPEN CASE IS THE WHOLE POINT. An earlier version of the guard was
 * `NODE_ENV !== "production"`, which reads as "closed in prod" but is
 * actually "open everywhere else" — including `NODE_ENV` values nobody
 * intended, like a CI runner's `"test"`, an unset variable, or a deploy
 * target named `"staging"`. This suite exists to hold the guard to the
 * opposite, narrower promise: `/review/` is open under exactly one literal
 * string, `"development"`, and gated under every other value a real
 * pipeline could plausibly produce. Only `"development"` may ever appear on
 * the open side below.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ *
 * Harness
 * ------------------------------------------------------------------ */

/**
 * Re-imports `middleware.ts` with `NODE_ENV` pinned for this call only.
 *
 * Widened to `string | undefined` on purpose: the risk this suite guards
 * against does not live in the three values a happy-path test would reach
 * for (`"production"`, `"development"`, `"test"`) — it lives in the infinite
 * set of other strings, and in the variable simply not being set at all.
 */
async function middlewareUnder(nodeEnv: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  const mod = await import("../middleware");
  return mod.middleware;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

function requestFor(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost"));
}

/**
 * True for `NextResponse.next()` — the one shape that means "not gated, keep
 * going". Every other outcome (redirect, 401) means the request was checked
 * for a session, which is what "not public" is supposed to guarantee.
 */
function isPassThrough(response: Response): boolean {
  return response.headers.get("x-middleware-next") === "1";
}

/**
 * A request with no session cookie hits one of these two gates. Which one
 * depends only on whether the path starts with `/api/` — see `middleware.ts`.
 */
async function expectGated(response: Response, pathname: string) {
  expect(isPassThrough(response)).toBe(false);
  if (pathname.startsWith("/api/")) {
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "No session.",
    });
  } else {
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  }
}

async function expectPublic(response: Response) {
  expect(isPassThrough(response)).toBe(true);
}

/** Real, non-review routes that must require a session in every environment. */
const ALWAYS_GATED = ["/today", "/book", "/dates", "/send", "/api/photos"];

/** Candidate paths under the review prefix — none of these need to exist as
 * real routes; the middleware boundary is a string prefix check, not a
 * router, and the test is about that check. */
const REVIEW_PATHS = ["/review/lay-probe", "/review/anything", "/review/book-states"];

const PREFIX_PRECISION_PATHS = [
  // No trailing slash: shorter than the "/review/" prefix, so it can never
  // satisfy `startsWith`.
  "/review",
  // A route that merely starts with the same six letters. If this were
  // ever treated as public, so would `/reviewer`, `/reviewed`, and so on —
  // exactly the `/login` vs `/login-history` mistake the file's own
  // comment on `PUBLIC_PATHS` warns about, just on a prefix instead.
  "/reviewX",
];

/**
 * Every value of `NODE_ENV` under which `/review/*` must stay gated —
 * i.e. everything except the literal string `"development"`. This is the
 * fail-open list: the guard being tested is `=== "development"`, so the
 * only way it opens by accident is if one of these values were ever treated
 * as equal to it.
 */
const GATED_NODE_ENVS: readonly (string | undefined)[] = [
  // The intended closed state.
  "production",
  // Nothing ever set it — a script, a worker, a misconfigured deploy.
  undefined,
  // Set, but falsy and not `undefined`. `===` does not coerce; this must
  // still fail the comparison rather than being treated as "unset".
  "",
  // A real deployment target this app does not define as `"production"`.
  // This is exactly the shape of gap the security audit found in the
  // rejected `!== "production"` form: a value nobody enumerated.
  "staging",
  // Case mismatch. `===` and `startsWith` are both case-sensitive; a build
  // system that capitalizes environment names must not accidentally open
  // the door.
  "Production",
  // Vitest's own default, and the value under which THIS SUITE runs. It
  // used to sit on the open side of this file — the suite that would have
  // caught a leak into `"test"` was, until this change, exempting `"test"`
  // by construction.
  "test",
];

/* ------------------------------------------------------------------ *
 * Gated — every NODE_ENV value except "development"
 * ------------------------------------------------------------------ */

describe.each(GATED_NODE_ENVS)("NODE_ENV=%s", (nodeEnv) => {
  it("gates /review/* — the fail-open case this suite exists to catch", async () => {
    const middleware = await middlewareUnder(nodeEnv);
    for (const path of REVIEW_PATHS) {
      await expectGated(await middleware(requestFor(path)), path);
    }
  });

  it.each(ALWAYS_GATED)("still gates %s", async (path) => {
    const middleware = await middlewareUnder(nodeEnv);
    await expectGated(await middleware(requestFor(path)), path);
  });

  it.each(PREFIX_PRECISION_PATHS)("does not treat %s as the review prefix", async (path) => {
    await expectGated(await (await middlewareUnder(nodeEnv))(requestFor(path)), path);
  });
});

describe("NODE_ENV=production", () => {
  it("normalizes a traversal attempt before the prefix check ever runs", async () => {
    // `new URL(...).pathname` — which `NextRequest.nextUrl` is built on —
    // collapses `..` during URL parsing itself. By the time `isPublic` sees
    // this request, `pathname` is already "/today"; the literal string
    // "/review/" is never present to match against. Asserting the collapsed
    // path is still gated (not that a `/review/` match failed) is the actual
    // guarantee: it holds even if a future refactor changes how the prefix
    // list is built.
    const middleware = await middlewareUnder("production");
    const request = requestFor("/review/../today");
    expect(request.nextUrl.pathname).toBe("/today");
    await expectGated(await middleware(request), "/today");
  });
});

/* ------------------------------------------------------------------ *
 * Open — the one value that may open /review/*
 * ------------------------------------------------------------------ */

describe("NODE_ENV=development", () => {
  it("/review/* is public", async () => {
    const middleware = await middlewareUnder("development");
    for (const path of REVIEW_PATHS) {
      await expectPublic(await middleware(requestFor(path)));
    }
  });

  it.each(ALWAYS_GATED)("still gates %s — the door does not widen the real app", async (path) => {
    const middleware = await middlewareUnder("development");
    await expectGated(await middleware(requestFor(path)), path);
  });

  it.each(PREFIX_PRECISION_PATHS)("does not treat %s as the review prefix", async (path) => {
    await expectGated(await (await middlewareUnder("development"))(requestFor(path)), path);
  });
});

/* ------------------------------------------------------------------ *
 * Gap 3 — the rest of the allowlist, asserted rather than assumed
 *
 * Everything above proves routes that must be closed stay closed. None of
 * it would notice a merge that silently dropped a path that must stay
 * *open* — the allowlist shrinking is invisible to a suite that only ever
 * asserts gating. This section is the other half: every entry in
 * `middleware.ts`'s `PUBLIC_PATHS` and `PUBLIC_PREFIXES`, except `/review/`
 * itself, must stay reachable with no session, in every environment this
 * file exercises above — `/review/`'s own openness is the one thing that is
 * *supposed* to vary; nothing else on this list is.
 * ------------------------------------------------------------------ */

/**
 * One concrete pathname per entry in `middleware.ts`'s allowlist, read from
 * the source rather than reconstructed from memory. Exact-match entries
 * from `PUBLIC_PATHS` are used verbatim; prefix entries from
 * `PUBLIC_PREFIXES` are given one representative path under them, since the
 * prefix string itself is not a request path a browser would ever send.
 */
const ALWAYS_PUBLIC = [
  // PUBLIC_PATHS — exact matches.
  "/login",
  "/api/session",
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/robots.txt",
  "/offline",
  // PUBLIC_PREFIXES — one representative path per prefix.
  "/_next/static/chunks/main.js",
  "/icons/icon-192.png",
  "/api/img/some-signed-ref",
  "/img/cover.jpg",
];

const ALL_TESTED_NODE_ENVS = [...GATED_NODE_ENVS, "development"];

describe.each(ALL_TESTED_NODE_ENVS)("NODE_ENV=%s — the rest of the allowlist", (nodeEnv) => {
  it.each(ALWAYS_PUBLIC)("keeps %s public", async (path) => {
    const middleware = await middlewareUnder(nodeEnv);
    await expectPublic(await middleware(requestFor(path)));
  });
});
