/**
 * Route classification — pure functions, importable by tests and by sw.ts.
 *
 * Every function here takes plain request/response metadata (URL, Headers) and
 * returns a boolean. No browser API, no serwist import, no SW globals — these
 * run identically in Node vitest and in the service worker.
 *
 * WHY A SEPARATE FILE. sw.ts declares `ServiceWorkerGlobalScope` globals and
 * imports from serwist, neither of which exist in the Node test environment.
 * Importing sw.ts in a vitest test would either throw or silently pollute the
 * module graph. These functions are the testable core of the routing logic;
 * everything else in sw.ts is wiring.
 *
 * VAULT PREFIX IMPORT. `VAULT_PATH_PREFIX` is imported from lib/schema.ts and
 * never re-spelled here. See the comment at the top of lib/schema.ts for the
 * history of why that matters — the short version is that lib/ai/vault-firewall.ts
 * shipped with the wrong prefix because two files each spelled it out independently.
 *
 * RELATIVE IMPORT (not @/ alias). scripts/build-sw.mjs compiles this file with
 * esbuild, which does not read TypeScript path aliases from tsconfig by default.
 * A relative import resolves correctly under esbuild (for the SW build) and
 * vitest (which has its own alias resolver). The shared file is the protection;
 * the import path is not.
 */

import { VAULT_PATH_PREFIX } from "../lib/schema";

// ---------------------------------------------------------------------------
// Vault — criterion (a)
// ---------------------------------------------------------------------------

/**
 * Returns true if the URL points to vault content.
 *
 * This is criterion (a) of the three-mechanism vault exclusion (ARCH §7.2):
 * a path-level check evaluated from the request URL before any response exists.
 * The v/ prefix is the only property of a private storage object knowable at
 * that instant — response headers are not available, body is not available,
 * nothing about the server's decision about the content is available. The path
 * is the mechanism, which is why migration 11 enforces it with a DB trigger.
 *
 * Case-insensitive: a UUID rendered in upper case is the same UUID, and a
 * defence that fails on /V/{uuid}/display.jpg is not a defence.
 */
export function isVaultPath(url: URL): boolean {
  // VAULT_PATH_PREFIX is "v/" — we check for the leading slash that a URL
  // pathname always has, then the prefix. Lower-casing covers /V/ paths.
  return url.pathname.toLowerCase().startsWith(`/${VAULT_PATH_PREFIX}`);
}

// ---------------------------------------------------------------------------
// Photo display and thumb — the cached paths
// ---------------------------------------------------------------------------

/**
 * Returns true for /p/<id>/display.jpg — the display variant.
 *
 * Pattern matches case-insensitively. The [^/]+ segment accepts any non-slash
 * string, which in practice is a UUID but we do not validate the UUID here —
 * the server's signed URL does that.
 */
export function isPhotoDisplayPath(url: URL): boolean {
  return /^\/p\/[^/]+\/display\.jpg$/i.test(url.pathname);
}

/**
 * Returns true for /p/<id>/thumb.jpg — the thumbnail variant.
 */
export function isPhotoThumbPath(url: URL): boolean {
  return /^\/p\/[^/]+\/thumb\.jpg$/i.test(url.pathname);
}

// ---------------------------------------------------------------------------
// API — always NetworkOnly
// ---------------------------------------------------------------------------

/**
 * Returns true for any /api/ path.
 *
 * All API routes are NetworkOnly. No exceptions, no allowlist, no "just the
 * read endpoints" — a cached API response is a stale API response, and stale
 * auth state is worse than no offline API at all.
 */
export function isApiPath(url: URL): boolean {
  return url.pathname.startsWith("/api/");
}

// ---------------------------------------------------------------------------
// No-store — criterion (b)
// ---------------------------------------------------------------------------

/**
 * Returns true if the response would be rejected by the no-store guard.
 *
 * This is criterion (b) of the vault exclusion: an independent check on the
 * response headers that fires regardless of the path. Vault images carry
 * Cache-Control: no-store; even if the path rule (criterion a) somehow did not
 * fire, this guard prevents them from reaching cache.put().
 *
 * Takes `Headers` rather than `Response` so it can be tested without
 * constructing a full Response object.
 */
export function isNoStoreResponse(headers: Headers): boolean {
  const cc = headers.get("cache-control") ?? "";
  return /\bno-store\b/i.test(cc);
}

// ---------------------------------------------------------------------------
// Sign-out — the purge-triggering endpoint
// ---------------------------------------------------------------------------

/**
 * Returns true for DELETE /api/session — the sign-out call.
 *
 * When this returns true, the SW fetch handler passes the request through to
 * the network (NetworkOnly semantics) and on a 204 response sweeps all Cache
 * Storage entries from the device.
 */
export function isSignOutRequest(url: URL, method: string): boolean {
  return method.toUpperCase() === "DELETE" && url.pathname === "/api/session";
}
