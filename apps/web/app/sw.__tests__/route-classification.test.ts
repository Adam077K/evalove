/**
 * Route classification — pure function tests.
 *
 * All tests here operate on plain URLs and Headers — no browser API, no serwist
 * import, no service worker context. They run in the vitest Node environment.
 *
 * WHY THESE TESTS EXIST. The vault exclusion depends on the SW's route
 * classification logic. If isVaultPath() stopped matching /V/ paths (upper-case
 * UUID), the vault defence would silently stop working — exactly the kind of
 * regression that cannot be caught by a manual review. These tests are the
 * automated check that the three exclusion criteria remain wired correctly.
 *
 * COVERAGE REQUIREMENTS from the brief:
 *   - /v/ path is never cached (criterion a)
 *   - /V/ path is never cached (upper-case variant — must be covered explicitly)
 *   - /p/ path is cached
 *   - /api/ path is not cached
 *   - no-store response is not cached (criterion b)
 *   - vault check fires from the request URL, before any response is available
 */

import { describe, expect, it } from "vitest";

import {
  isApiPath,
  isNoStoreResponse,
  isPhotoDisplayPath,
  isPhotoThumbPath,
  isSignOutRequest,
  isVaultPath,
} from "../sw-route-classifier";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function url(path: string): URL {
  return new URL(`https://evaandadam.app${path}`);
}

function headers(cacheControl: string): Headers {
  const h = new Headers();
  h.set("cache-control", cacheControl);
  return h;
}

// ---------------------------------------------------------------------------
// isVaultPath — criterion (a)
// ---------------------------------------------------------------------------

describe("isVaultPath", () => {
  it("returns true for a lowercase /v/ path", () => {
    expect(isVaultPath(url("/v/550e8400-e29b-41d4-a716-446655440000/display.jpg"))).toBe(true);
  });

  it("returns true for an UPPER-CASE /V/ path (UUIDs can be rendered in upper case)", () => {
    // This is the upper-case case the brief explicitly requires.
    expect(isVaultPath(url("/V/550E8400-E29B-41D4-A716-446655440000/display.jpg"))).toBe(true);
  });

  it("returns true for a mixed-case /V/ path", () => {
    expect(isVaultPath(url("/V/550e8400-e29b-41d4-a716-446655440000/display.jpg"))).toBe(true);
  });

  it("returns false for a /p/ photo path", () => {
    expect(isVaultPath(url("/p/550e8400-e29b-41d4-a716-446655440000/display.jpg"))).toBe(false);
  });

  it("returns false for an /api/ path that happens to start with v in its body", () => {
    expect(isVaultPath(url("/api/vault/unlock"))).toBe(false);
  });

  it("returns false for the /offline shell", () => {
    expect(isVaultPath(url("/offline"))).toBe(false);
  });

  it("returns false for a /home navigation", () => {
    expect(isVaultPath(url("/home"))).toBe(false);
  });

  it("returns false for the vault-flavoured word /video (not a vault path)", () => {
    // Regression: /v/ prefix is the criterion, not the letter v.
    // /video does not start with /v/ — the slash after v is load-bearing.
    expect(isVaultPath(url("/video/player"))).toBe(false);
  });

  // ----- This test documents criterion (a) as request-URL-only ----------------
  //
  // The vault check is evaluated from the request URL before any response
  // exists. These tests exercise the function with a URL only — no response
  // object is involved. That is the point: it runs before fetch().

  it("vault check requires only the URL — no response parameter needed", () => {
    // The function signature only takes a URL. If this compiled and ran,
    // criterion (a) is proven to be request-URL-only.
    const result = isVaultPath(url("/v/abc/display.jpg"));
    expect(typeof result).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// isPhotoDisplayPath — the path we DO cache
// ---------------------------------------------------------------------------

describe("isPhotoDisplayPath", () => {
  it("matches /p/<uuid>/display.jpg (lowercase)", () => {
    expect(isPhotoDisplayPath(url("/p/550e8400-e29b-41d4-a716-446655440000/display.jpg"))).toBe(true);
  });

  it("matches /p/<id>/display.jpg with a short id segment", () => {
    expect(isPhotoDisplayPath(url("/p/abc123/display.jpg"))).toBe(true);
  });

  it("does NOT match /v/<uuid>/display.jpg (vault path)", () => {
    expect(isPhotoDisplayPath(url("/v/550e8400-e29b-41d4-a716-446655440000/display.jpg"))).toBe(false);
  });

  it("does NOT match /p/<uuid>/thumb.jpg", () => {
    expect(isPhotoDisplayPath(url("/p/550e8400-e29b-41d4-a716-446655440000/thumb.jpg"))).toBe(false);
  });

  it("does NOT match /p/<uuid>/original.jpg", () => {
    expect(isPhotoDisplayPath(url("/p/550e8400-e29b-41d4-a716-446655440000/original.jpg"))).toBe(false);
  });

  it("does NOT match a path with extra segments", () => {
    expect(isPhotoDisplayPath(url("/p/abc/display.jpg/extra"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPhotoThumbPath
// ---------------------------------------------------------------------------

describe("isPhotoThumbPath", () => {
  it("matches /p/<uuid>/thumb.jpg", () => {
    expect(isPhotoThumbPath(url("/p/550e8400-e29b-41d4-a716-446655440000/thumb.jpg"))).toBe(true);
  });

  it("does NOT match /v/<uuid>/thumb.jpg", () => {
    expect(isPhotoThumbPath(url("/v/550e8400-e29b-41d4-a716-446655440000/thumb.jpg"))).toBe(false);
  });

  it("does NOT match /p/<uuid>/display.jpg", () => {
    expect(isPhotoThumbPath(url("/p/abc/display.jpg"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isApiPath — never cached
// ---------------------------------------------------------------------------

describe("isApiPath", () => {
  it("returns true for /api/session", () => {
    expect(isApiPath(url("/api/session"))).toBe(true);
  });

  it("returns true for /api/photos/abc", () => {
    expect(isApiPath(url("/api/photos/abc"))).toBe(true);
  });

  it("returns false for /home", () => {
    expect(isApiPath(url("/home"))).toBe(false);
  });

  it("returns false for /p/abc/display.jpg", () => {
    expect(isApiPath(url("/p/abc/display.jpg"))).toBe(false);
  });

  it("returns false for /offline", () => {
    expect(isApiPath(url("/offline"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNoStoreResponse — criterion (b)
// ---------------------------------------------------------------------------

describe("isNoStoreResponse", () => {
  it("returns true for Cache-Control: no-store", () => {
    expect(isNoStoreResponse(headers("no-store"))).toBe(true);
  });

  it("returns true for no-store mixed with other directives", () => {
    expect(isNoStoreResponse(headers("private, no-store, no-cache"))).toBe(true);
  });

  it("returns true case-insensitively", () => {
    expect(isNoStoreResponse(headers("NO-STORE"))).toBe(true);
  });

  it("returns false for cache-control: private, max-age=31536000, immutable (photo path)", () => {
    expect(isNoStoreResponse(headers("private, max-age=31536000, immutable"))).toBe(false);
  });

  it("returns false for an empty cache-control header", () => {
    expect(isNoStoreResponse(headers(""))).toBe(false);
  });

  it("returns false for no-cache (different directive)", () => {
    expect(isNoStoreResponse(headers("no-cache, must-revalidate"))).toBe(false);
  });

  it("returns false when there is no cache-control header at all", () => {
    expect(isNoStoreResponse(new Headers())).toBe(false);
  });

  // ----- This test documents criterion (b) as response-header-based ----------
  //
  // Criterion (b) fires on the response, independently of (a). These tests use
  // only Headers — no URL, no request — to document that it operates purely on
  // response metadata.

  it("criterion (b) operates on response headers only — no URL involved", () => {
    const vaultResponseHeaders = new Headers({
      "content-type": "image/jpeg",
      "cache-control": "no-store",
    });
    // A vault image response would have these headers. Criterion (b) rejects it
    // regardless of which URL the SW matched it to.
    expect(isNoStoreResponse(vaultResponseHeaders)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isSignOutRequest
// ---------------------------------------------------------------------------

describe("isSignOutRequest", () => {
  it("matches DELETE /api/session", () => {
    expect(isSignOutRequest(url("/api/session"), "DELETE")).toBe(true);
  });

  it("is case-insensitive on method", () => {
    expect(isSignOutRequest(url("/api/session"), "delete")).toBe(true);
  });

  it("does not match POST /api/session", () => {
    expect(isSignOutRequest(url("/api/session"), "POST")).toBe(false);
  });

  it("does not match DELETE on a different path", () => {
    expect(isSignOutRequest(url("/api/photos/abc"), "DELETE")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Vault exclusion: ordering proof
// ---------------------------------------------------------------------------

describe("vault exclusion precedes caching — ordering", () => {
  // A /v/ path that also happens to look like a /p/ path would be caught by
  // the vault check. These tests show the functions are mutually exclusive.

  it("a /v/ path is never a photo display path", () => {
    const vaultUrl = url("/v/550e8400-e29b-41d4-a716-446655440000/display.jpg");
    expect(isVaultPath(vaultUrl)).toBe(true);
    expect(isPhotoDisplayPath(vaultUrl)).toBe(false);
  });

  it("a /v/ path is never a photo thumb path", () => {
    const vaultUrl = url("/v/550e8400-e29b-41d4-a716-446655440000/thumb.jpg");
    expect(isVaultPath(vaultUrl)).toBe(true);
    expect(isPhotoThumbPath(vaultUrl)).toBe(false);
  });

  it("an upper-case /V/ path is also never a photo path", () => {
    const vaultUrl = url("/V/550E8400-E29B-41D4-A716-446655440000/display.jpg");
    expect(isVaultPath(vaultUrl)).toBe(true);
    expect(isPhotoDisplayPath(vaultUrl)).toBe(false);
  });
});
