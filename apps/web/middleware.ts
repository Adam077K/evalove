/**
 * Eva & Adam — the door, checked on every request.
 *
 * EDGE RUNTIME. This file may only use things that exist there: `jose` runs on
 * WebCrypto, which the Edge runtime provides. `scrypt` does not exist here,
 * which is the reason the password itself is checked in a Node route handler
 * and the reason this layer verifies a signature instead. Do not import
 * `lib/auth/*` from this file — it will build and then fail at the edge.
 *
 * WHAT THIS IS AND IS NOT. It is a cheap, universal "is there a valid session"
 * check that runs before a page is rendered, so a signed-out request never
 * reaches a component that would query the database. It is NOT the only check:
 * a matcher is a list, lists acquire holes, and the `require*` functions in
 * `lib/session/` are what still hold if a route is added outside this one.
 * Middleware is the fast path, not the guarantee.
 *
 * THE ALLOWLIST IS THE SECURITY BOUNDARY. Everything not on it requires a
 * session. It is written as an explicit list of paths that must work for a
 * signed-out person — the door itself, the endpoint that opens it, and the
 * files a browser fetches before it has been told anything. Adding an entry
 * publishes that path to the internet. Do it one line at a time, deliberately.
 */

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session/token";

/** Where a signed-out person is sent. */
const LOGIN_PATH = "/login";

/**
 * Paths reachable without a session.
 *
 * Exact matches. A prefix rule here would be a mistake waiting to happen:
 * `/login` as a prefix also opens `/login-history`, and nobody notices until
 * such a route exists.
 */
const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  // The door.
  LOGIN_PATH,
  // The endpoint that opens it. Chicken and egg: requiring a session to
  // create one is a locked door with the key inside.
  "/api/session",
  // Installability. A browser fetches these before the person has been told
  // anything, and a manifest behind auth means the app cannot be installed.
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/robots.txt",
  // Offline shell. Must be reachable without a session so the service worker
  // can precache it during install. The SW fetches /offline at install time;
  // if it hits this middleware unauthenticated and /offline is not on the
  // allowlist, the 307 redirect is followed and the login page is cached
  // under /offline — the one route whose job is to work offline becomes a
  // login wall. The page contains no personal content: no photograph, no
  // name, no caption.
  "/offline",
]);

/**
 * Prefixes reachable without a session. Each one is a directory of files, not
 * a route, which is why these cannot be exact matches.
 */
const PUBLIC_PREFIXES: readonly string[] = [
  // Build output: hashed JS and CSS. Withholding it does not withhold
  // anything private — every byte is already in the bundle the login page
  // itself serves — and withholding it does break the login page.
  "/_next/",
  // Icons and other static installability assets.
  "/icons/",
  // The public image proxy. Its own path prefix is its own boundary: it
  // serves only what it is given a signed reference to, and nothing under it
  // enumerates. It is public because a share link opened by someone with no
  // session must still render an image.
  "/api/img/",
  "/img/",
  // The review harnesses (`app/(app)/review/**`) — fixture-driven, dev-only
  // screens with no fetch of their own; every image they render comes from a
  // hardcoded external registry, never a gated route. They exist because a
  // worker builds in an isolated worktree where every other page in this app
  // requires a session, and a screen nobody can open cannot be reviewed
  // against what it actually renders — that gap produced seven passing
  // reviews on an app the founder then called unusable.
  //
  // `=== "development"`, deliberately NOT `!== "production"`. Next only
  // DEFAULTS NODE_ENV (`process.env.NODE_ENV = process.env.NODE_ENV ||
  // defaultEnv`, next/dist/bin/next) — a preset value survives. The negated
  // form is satisfied by undefined, "", "test", "staging" and "Production",
  // so `NODE_ENV=test next build` would inline "test" and ship this prefix in
  // the production bundle with no warning. This form fails closed. Both real
  // consumers still pass: `next dev` defaults to development, and
  // playwright.config.ts pins NODE_ENV: "development" explicitly.
  //
  // Paired with `app/(app)/review/layout.tsx`, which calls notFound() outside
  // development, and with `export const dynamic = "force-dynamic"` on each
  // harness page so nothing is baked into a static artifact. Removing any one
  // of the three reopens the gap. Do not widen this to a runtime-readable
  // variable — NODE_ENV is the only lever this file can audit at build time.
  ...(process.env.NODE_ENV === "development" ? ["/review/"] : []),
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    // One special case: someone who is already signed in and lands on the door
    // is sent inside. Otherwise the back button after signing in shows a login
    // form to a signed-in person, which reads as "it didn't work".
    if (pathname === LOGIN_PATH) {
      const session = await verifySessionToken(
        request.cookies.get(SESSION_COOKIE)?.value,
      );
      if (session) return NextResponse.redirect(new URL("/today", request.url));
    }
    return NextResponse.next();
  }

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (session) return NextResponse.next();

  // An API request gets a status, not a login page. A `fetch` that receives
  // 200-and-HTML where it expected JSON fails somewhere far away from the
  // actual cause.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, message: "No session." },
      { status: 401 },
    );
  }

  const url = new URL(LOGIN_PATH, request.url);
  // Where they were trying to go, so the door can put them back after. Path
  // and query only — taking a full URL from the request and redirecting to it
  // later is an open redirect.
  const intended = pathname + request.nextUrl.search;
  if (intended !== "/" && intended !== LOGIN_PATH) {
    url.searchParams.set("next", intended);
  }
  return NextResponse.redirect(url);
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Everything except the file-shaped requests.
 *
 * The allowlist above is the real boundary; this matcher exists so the check
 * does not run for every image and font. The negative lookahead skips Next's
 * own build output and anything with a file extension — those cannot be a
 * protected route, because a protected route is a page or an API path and
 * neither ends in `.png`.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};
