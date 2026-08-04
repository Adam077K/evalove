/**
 * Service worker runtime-caching configuration — extracted for testability.
 *
 * This module is free of Serwist imports and SW-global declarations. It can be
 * imported by vitest directly (Node environment) and by sw.ts (SW build via
 * esbuild). All SW-specific strategy instances (CacheFirst, NetworkOnly, etc.)
 * are constructed in sw.ts from the ROUTE_DESCRIPTORS exported here.
 *
 * WHY THIS FILE EXISTS.
 * The route rules (matchers, strategy tags, method fields) are the load-bearing
 * policy of the service worker. Before this extraction they lived inline in sw.ts,
 * coupled to Serwist class imports — impossible to unit-test without a SW runtime.
 * Moving them here lets tests assert the four wiring properties that a code review
 * caught were uncovered:
 *
 *   B) vault /v/… → NetworkOnly
 *   C) display /p/…/display.jpg → CacheFirst with noStorePlugin
 *   D) handleSignOut purges caches on every sign-out (including offline)
 *   E) /api/* → NetworkOnly (not CacheFirst — an authenticated API response
 *      written to disk is a privacy failure)
 *
 * sw.ts reads ROUTE_DESCRIPTORS and builds the actual Serwist runtimeCaching
 * array. Mutations to this module that break the four invariants above will be
 * caught by the tests in sw.__tests__/runtime-caching-wiring.test.ts.
 */

import {
  isApiPath,
  isNoStoreResponse,
  isPhotoDisplayPath,
  isPhotoThumbPath,
  isSignOutRequest,
  isVaultPath,
} from "./sw-route-classifier";

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

/**
 * Rejects any response carrying Cache-Control: no-store before cache.put().
 *
 * Criterion (b) of the three-mechanism vault exclusion (ARCH §7.2): an
 * independent check on the response headers that fires regardless of the path
 * rule. Vault images carry Cache-Control: no-store; even if the path rule
 * (criterion a) somehow did not fire, this guard prevents them from reaching
 * cache.put(). Applied to every caching strategy.
 */
export const noStorePlugin = {
  cacheWillUpdate: async ({
    response,
  }: {
    response: Response;
  }): Promise<Response | null> => {
    return isNoStoreResponse(response.headers) ? null : response;
  },
};

/**
 * Rejects redirected responses before cache.put().
 *
 * Without a guard, a redirected login-page response reaching a caching strategy
 * stores the login page under the original URL. Applied to the precache options
 * and the NetworkFirst navigation handler. Primary protection is
 * precachePrerendered: false in build-sw.mjs; this is the secondary layer.
 */
export const redirectPlugin = {
  cacheWillUpdate: async ({
    response,
  }: {
    response: Response;
  }): Promise<Response | null> => {
    return response.redirected ? null : response;
  },
};

// ---------------------------------------------------------------------------
// Sign-out handler
// ---------------------------------------------------------------------------

/**
 * Purges all local personal-content stores after sign-out.
 *
 * Targets every store that may hold content belonging to the signed-out person:
 *   - Cache Storage: SW caches including display images and the nav shell
 *   - OPFS outbox/: photograph bytes of anything queued and not yet uploaded
 *   - IndexedDB eva-adam-outbox: captions, author, queue state
 *
 * localStorage (profile key) is purged in purgeCaches() in
 * ServiceWorkerRegistration.tsx — localStorage is not accessible from a SW.
 *
 * Every branch is fire-and-forget: a purge failure is logged but never
 * surfaced to the caller. The sign-out intent is clear; leaving a cache entry
 * is worse than a logged error.
 */
async function purgePersonalContent(): Promise<void> {
  // 1. Cache Storage — SW caches.
  try {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
  } catch (err) {
    console.error("[sw] Cache Storage purge failed", err);
  }

  // 2. OPFS outbox/ — photograph bytes.
  //    NotFoundError is benign: no photos were queued. Everything else is logged.
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("outbox", { recursive: true });
  } catch (err) {
    if ((err as DOMException)?.name !== "NotFoundError") {
      console.error("[sw] OPFS outbox purge failed", err);
    }
  }

  // 3. IndexedDB eva-adam-outbox — captions, author, queue state.
  //    deleteDatabase() is callback-based; we wrap it. Blocking is treated as
  //    success: the name is removed from the registry even while blocked.
  try {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("eva-adam-outbox");
      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.error("[sw] IndexedDB purge error", req.error);
        resolve();
      };
      req.onblocked = () => resolve();
    });
  } catch (err) {
    console.error("[sw] IndexedDB purge failed", err);
  }
}

/**
 * Intercepts DELETE /api/session, forwards to the network, then purges all
 * personal content regardless of whether the network call succeeded.
 *
 * WHY "REGARDLESS":
 * The borrowed-device case is exactly when connectivity is least reliable and
 * the purge matters most. If the network is unavailable, the server session may
 * linger — but the local copies of photographs, captions, and the profile key
 * are gone. The user's intent to sign out is expressed by the request. The
 * server's 204 reply is confirmation, not permission.
 *
 * The route itself is idempotent: DELETE /api/session always answers 204 even
 * with no session (apps/web/app/api/session/route.ts:183).
 */
export async function handleSignOut({
  request,
}: {
  request: Request;
}): Promise<Response> {
  // P2-1: network call is best-effort. Purge happens regardless.
  let response: Response | undefined;
  try {
    response = await fetch(request);
  } catch {
    // Network unavailable — fall through to purge.
    console.error("[sw] sign-out fetch failed (offline?); purging locally");
  }

  // P1-1: purge Cache Storage + OPFS + IndexedDB.
  await purgePersonalContent();

  return response ?? new Response(null, { status: 204 });
}

// ---------------------------------------------------------------------------
// Route descriptors — the pure, testable routing policy
// ---------------------------------------------------------------------------

/**
 * Names the plugins applied to a strategy, for test assertions.
 * These names correspond to the plugin objects exported from this module.
 */
export type PluginName = "noStorePlugin" | "redirectPlugin";

/**
 * Names the Serwist strategy that handles a matched request.
 * sw.ts maps each tag to a real Serwist instance; tests assert the tag.
 */
export type StrategyTag =
  | "handleSignOut"
  | "NetworkOnly"
  | "CacheFirst"
  | "NetworkFirst";

/**
 * The HTTP methods Serwist's RuntimeCaching["method"] accepts. Spelled out
 * locally (rather than imported from "serwist") so this module stays free of
 * Serwist imports per the file-level doc comment above; sw.ts's
 * buildRuntimeCachingEntry() assigns desc.method straight into a Serwist
 * RuntimeCaching entry, so this union must stay structurally identical to
 * Serwist's HTTPMethod type.
 */
export type RouteDescriptorMethod =
  | "DELETE"
  | "GET"
  | "HEAD"
  | "PATCH"
  | "POST"
  | "PUT"
  | "OPTIONS";

/** One routing rule — matcher + strategy description, free of Serwist imports. */
export interface RouteDescriptor {
  /** Unique label used in test assertions. */
  readonly id: string;
  /**
   * HTTP method this rule handles.
   * Undefined means the rule registers on GET (Serwist default).
   * `method: "DELETE"` is the load-bearing field for the sign-out rule —
   * without it the rule registers on GET and never fires for sign-out.
   */
  readonly method?: RouteDescriptorMethod;
  /** Strategy the matched request is handled by. */
  readonly strategyTag: StrategyTag;
  /**
   * Plugin names applied to the strategy, in order.
   * sw.ts maps each name to the corresponding exported plugin object.
   */
  readonly pluginNames?: ReadonlyArray<PluginName>;
  /** Cache name (CacheFirst/NetworkFirst only). */
  readonly cacheName?: string;
  /** LRU cap (CacheFirst only). */
  readonly maxEntries?: number;
  /** Network timeout in seconds (NetworkFirst only). */
  readonly networkTimeoutSeconds?: number;
  /** URL/request matcher — pure function, no Serwist dependency. */
  readonly matcher: (params: {
    url: URL;
    request: { method: string; mode?: string };
  }) => boolean;
}

/**
 * The complete routing policy for the service worker, in priority order.
 *
 * sw.ts maps each descriptor to a real Serwist runtimeCaching entry using:
 *   - desc.matcher  → entry.matcher
 *   - desc.method   → entry.method
 *   - desc.strategyTag + desc.pluginNames + desc.cacheName + desc.maxEntries
 *                   → entry.handler (a Serwist strategy or handleSignOut)
 *
 * Tests import this array directly and assert the wiring without needing a SW
 * runtime. Mutations to this array that violate the four invariants (B, C, D, E)
 * are caught by sw.__tests__/runtime-caching-wiring.test.ts.
 */
export const ROUTE_DESCRIPTORS: ReadonlyArray<RouteDescriptor> = [
  // ------------------------------------------------------------------
  // 1. Sign-out — handleSignOut + cache purge on every sign-out
  //    Registered on the DELETE method. The /api/* rule below is
  //    GET-only (Serwist default), so rules 1 and 3 are in different
  //    method tables and never compete. method: "DELETE" is
  //    load-bearing — without it this rule registers as GET and never
  //    fires for sign-out requests.
  // ------------------------------------------------------------------
  {
    id: "sign-out",
    method: "DELETE",
    strategyTag: "handleSignOut",
    matcher: ({ url, request }) => isSignOutRequest(url, request.method),
  },

  // ------------------------------------------------------------------
  // 2. Vault paths — NetworkOnly, criterion (a)
  //    isVaultPath() checks url.pathname (case-insensitive), before any
  //    response is fetched. /V/ (upper-case) is covered by toLowerCase()
  //    inside isVaultPath.
  // ------------------------------------------------------------------
  {
    id: "vault",
    strategyTag: "NetworkOnly",
    matcher: ({ url }) => isVaultPath(url),
  },

  // ------------------------------------------------------------------
  // 3. API routes — NetworkOnly
  //    No exceptions. A cached API response is a stale API response,
  //    and a cached authenticated response on a shared device is a
  //    privacy failure.
  // ------------------------------------------------------------------
  {
    id: "api",
    strategyTag: "NetworkOnly",
    matcher: ({ url }) => isApiPath(url),
  },

  // ------------------------------------------------------------------
  // 4. Photo display images — CacheFirst
  //    noStorePlugin is criterion (b): vault images carry no-store and
  //    would be rejected here even if the path check (rule 2) missed.
  // ------------------------------------------------------------------
  {
    id: "photo-display",
    strategyTag: "CacheFirst",
    pluginNames: ["noStorePlugin"],
    cacheName: "photo-display-v1",
    maxEntries: 300,
    matcher: ({ url }) => isPhotoDisplayPath(url),
  },

  // ------------------------------------------------------------------
  // 5. Photo thumbs — CacheFirst
  // ------------------------------------------------------------------
  {
    id: "photo-thumb",
    strategyTag: "CacheFirst",
    pluginNames: ["noStorePlugin"],
    cacheName: "photo-thumb-v1",
    maxEntries: 600,
    matcher: ({ url }) => isPhotoThumbPath(url),
  },

  // ------------------------------------------------------------------
  // 6. Navigations — NetworkFirst, 3 s timeout → offline shell
  //    redirectPlugin guards against caching a login-page redirect.
  //    noStorePlugin is defense-in-depth.
  // ------------------------------------------------------------------
  {
    id: "nav",
    strategyTag: "NetworkFirst",
    pluginNames: ["noStorePlugin", "redirectPlugin"],
    cacheName: "nav-v1",
    networkTimeoutSeconds: 3,
    matcher: ({ request }) => request.mode === "navigate",
  },
];
