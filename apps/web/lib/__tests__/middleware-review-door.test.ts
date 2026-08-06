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
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ *
 * Harness
 * ------------------------------------------------------------------ */

/** Re-imports `middleware.ts` with `NODE_ENV` pinned for this call only. */
async function middlewareUnder(nodeEnv: "production" | "development" | "test") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  const mod = await import("../../middleware");
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

/** Real, non-review routes that must require a session in every environment. */
const ALWAYS_GATED = ["/today", "/book", "/dates", "/send", "/api/photos"];

/* ------------------------------------------------------------------ *
 * production — /review/ does not exist
 * ------------------------------------------------------------------ */

describe("NODE_ENV=production", () => {
  it("gates /review/* — no dev door in production", async () => {
    const middleware = await middlewareUnder("production");
    for (const path of ["/review/lay-probe", "/review/anything", "/review/book-states"]) {
      await expectGated(await middleware(requestFor(path)), path);
    }
  });

  it.each(ALWAYS_GATED)("still gates %s", async (path) => {
    const middleware = await middlewareUnder("production");
    await expectGated(await middleware(requestFor(path)), path);
  });

  it.each([
    // No trailing slash: shorter than the "/review/" prefix, so it can never
    // satisfy `startsWith`.
    "/review",
    // A route that merely starts with the same six letters. If this were
    // ever treated as public, so would `/reviewer`, `/reviewed`, and so on —
    // exactly the `/login` vs `/login-history` mistake the file's own
    // comment on `PUBLIC_PATHS` warns about, just on a prefix instead.
    "/reviewX",
  ])("does not treat %s as the review prefix", async (path) => {
    await expectGated(await (await middlewareUnder("production"))(requestFor(path)), path);
  });

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
 * non-production — /review/ is the one public prefix
 * ------------------------------------------------------------------ */

describe.each(["development", "test"] as const)("NODE_ENV=%s", (nodeEnv) => {
  it("/review/* is public", async () => {
    const middleware = await middlewareUnder(nodeEnv);
    for (const path of ["/review/lay-probe", "/review/anything", "/review/book-states"]) {
      const response = await middleware(requestFor(path));
      expect(isPassThrough(response)).toBe(true);
    }
  });

  it.each(ALWAYS_GATED)("still gates %s — the door does not widen the real app", async (path) => {
    const middleware = await middlewareUnder(nodeEnv);
    await expectGated(await middleware(requestFor(path)), path);
  });

  it.each(["/review", "/reviewX"])("does not treat %s as the review prefix", async (path) => {
    await expectGated(await (await middlewareUnder(nodeEnv))(requestFor(path)), path);
  });
});
