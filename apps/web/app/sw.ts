/**
 * Eva & Adam — service worker (Serwist v9)
 *
 * SCOPE (deliberately narrow — B7 only):
 *   - App shell (precached via Next.js build manifest)
 *   - Navigation fallback: NetworkFirst 3 s → /offline shell
 *   - CacheFirst on /p/{id}/display.jpg (up to 300 entries, LRU)
 *   - CacheFirst on /p/{id}/thumb.jpg   (up to 600 entries, LRU)
 *
 *   OUT OF SCOPE: book warm-up ladder, 300/600-entry LRU sweeps beyond
 *   ExpirationPlugin, activity index, offline progress indicator — those are
 *   §7.2's full scope and belong to the Book track.
 *
 * -------------------------------------------------------------------------
 * VAULT EXCLUSION — three independent mechanisms (ARCH §7.2), all required
 * -------------------------------------------------------------------------
 *
 *   (a) PATH RULE. Any request whose pathname starts with /v/ is routed
 *       NetworkOnly before any response is fetched. VAULT_PATH_PREFIX is
 *       imported from lib/schema.ts and never re-spelled here. lib/ai/vault-
 *       firewall.ts shipped with the wrong prefix because two files each
 *       spelled it out independently and nothing compared them. That cannot
 *       happen again.
 *
 *   (b) NO-STORE GUARD. Any response carrying Cache-Control: no-store is
 *       rejected by noStorePlugin's cacheWillUpdate callback before it reaches
 *       cache.put(). This fires on vault image responses independently of (a).
 *
 *   (c) MANIFEST EXCLUSION. Vault items are never emitted as static routes by
 *       Next.js and therefore never appear in the auto-generated precache
 *       manifest injected at build time. The precache cannot accidentally
 *       contain a vault path.
 *
 *   A partial service worker that caches display images without all three of
 *   these is a privacy failure, not an incomplete feature.
 *
 * -------------------------------------------------------------------------
 * THREE LEVERS — distinct, complementary, not interchangeable
 * -------------------------------------------------------------------------
 *
 *   SESSION_VERSION (env var) — the session panic lever. Bumping it makes
 *     every session token invalid globally. It does NOT purge cached bytes on
 *     any device. Correct tool: sessions are compromised. Wrong tool: cached
 *     content needs to be erased from a device.
 *
 *   Cache purge on sign-out — when DELETE /api/session returns 204, this SW
 *     sweeps every Cache Storage entry, every OPFS outbox/ byte, and the
 *     IndexedDB eva-adam-outbox from the device that made the call. It is
 *     per-device, not global. Correct tool: cleaning up a shared or borrowed
 *     device after sign-out.
 *
 *   Kill switch (KILL_SWITCH constant below) — when flipped to true and
 *     deployed, the SW unregisters itself and clears all caches on the next
 *     install event. A bad service worker is the one browser artifact that
 *     survives reverting the deploy that created it; this is the reliable remote
 *     recovery. SESSION_VERSION and sign-out purge cannot reach a device that is
 *     offline with the bad SW still active.
 */

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";

import {
  handleSignOut,
  noStorePlugin,
  redirectPlugin,
  ROUTE_DESCRIPTORS,
  type PluginName,
  type RouteDescriptor,
  type RouteDescriptorMethod,
} from "./sw-runtime-caching";

// ---- TypeScript — augment the SW global scope ------------------------------
//
// The project tsconfig uses "lib": ["dom"] which does not include webworker
// types. Mixing the two libs causes global conflicts (duplicate EventTarget,
// self, caches, etc.), so we declare only what this file needs inline.
// Serwist's SerwistGlobalConfig brings in the precache-manifest injection point.

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    /**
     * The precache manifest injected at build time by @serwist/next.
     * It is `undefined` before the build tool processes this file.
     */
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;

    // Methods used by the kill-switch path and the message listener below.
    // `EventListenerOrEventListenerObject` and `AddEventListenerOptions` are
    // defined in lib.dom.d.ts so they are safe to reference here.
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;

    // Used in the kill-switch path to unregister the SW.
    readonly registration: ServiceWorkerRegistration;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ---- Kill switch -----------------------------------------------------------
//
// RECOVERY PROCEDURE:
//   1. Set KILL_SWITCH = true here.
//   2. Deploy.
//   3. Both devices will unregister the SW and clear all its caches on the
//      next SW install event (typically on next page load after the deploy).
//   4. Set KILL_SWITCH = false and deploy again to restore offline support.
//
// Why this exists: a service worker survives the revert of the deploy that
// shipped it. "Both users are reachable in person" is not a recovery plan.

const KILL_SWITCH = false;

// ---- Build runtimeCaching from ROUTE_DESCRIPTORS ---------------------------
//
// ROUTE_DESCRIPTORS (in sw-runtime-caching.ts) is the authoritative routing
// policy — pure data, no Serwist dependency, unit-testable. This function maps
// each descriptor to a real Serwist handler instance.
//
// Plugins referenced by name in desc.pluginNames are resolved here. Keeping the
// resolution in one place means the descriptor's pluginNames are the source of
// truth for which plugins are actually wired into each strategy.

const pluginByName: Record<PluginName, object> = {
  noStorePlugin,
  redirectPlugin,
};

// The concrete handler types buildRuntimeCachingEntry can produce — one per
// StrategyTag branch below. Serwist's RuntimeCaching["handler"] accepts a
// RouteHandlerCallback (handleSignOut's shape) or a RouteHandlerObject
// (Strategy subclasses implement `handle()`, satisfying that shape), so this
// union is what actually flows into the Serwist config, unlike `unknown`
// which erases the switch's exhaustiveness and is never assignable to
// RuntimeCaching["handler"].
type RuntimeCachingHandler =
  | typeof handleSignOut
  | NetworkOnly
  | CacheFirst
  | NetworkFirst;

function buildRuntimeCachingEntry(desc: RouteDescriptor): {
  matcher: RouteDescriptor["matcher"];
  handler: RuntimeCachingHandler;
  method?: RouteDescriptorMethod;
} {
  const plugins = (desc.pluginNames ?? []).map((name) => pluginByName[name]);

  let handler: RuntimeCachingHandler;
  switch (desc.strategyTag) {
    case "handleSignOut":
      handler = handleSignOut;
      break;
    case "NetworkOnly":
      handler = new NetworkOnly();
      break;
    case "CacheFirst":
      handler = new CacheFirst({
        cacheName: desc.cacheName!,
        plugins: [...plugins, new ExpirationPlugin({ maxEntries: desc.maxEntries! })],
      });
      break;
    case "NetworkFirst":
      handler = new NetworkFirst({
        networkTimeoutSeconds: desc.networkTimeoutSeconds!,
        cacheName: desc.cacheName!,
        plugins,
      });
      break;
  }

  return {
    matcher: desc.matcher,
    handler,
    ...(desc.method ? { method: desc.method } : {}),
  };
}

// ---- Entry point -----------------------------------------------------------

if (KILL_SWITCH) {
  // Emergency recovery path. Nothing else runs.
  //
  // On the next install event, every cache is deleted and the registration is
  // revoked. The browser will have no service worker until one is re-registered
  // after the next deploy with KILL_SWITCH = false.
  self.addEventListener("install", (event) => {
    // `waitUntil` is always present on install events; cast is safe here.
    (event as Event & { waitUntil(f: Promise<unknown>): void }).waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .then(() => self.registration.unregister()),
    );
  });
} else {
  const sw = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: false,

    // precacheOptions.plugins: apply noStorePlugin and redirectPlugin to every
    // precache fetch. noStorePlugin is vault criterion (b). redirectPlugin
    // prevents a redirected login-page response from being stored under any
    // precache URL (primary protection is precachePrerendered: false in
    // build-sw.mjs, which removes authenticated HTML from the manifest entirely;
    // this is the secondary layer).
    precacheOptions: {
      plugins: [noStorePlugin, redirectPlugin],
    },

    runtimeCaching: ROUTE_DESCRIPTORS.map(buildRuntimeCachingEntry),

    // /offline is in the precache manifest because build-sw.mjs explicitly adds
    // .next/server/app/offline.html to globPatterns (with precachePrerendered:
    // false all other HTML routes are excluded). PrecacheFallbackPlugin (wired
    // here) looks up /offline in the precache and returns it when NetworkFirst
    // exhausts its 3 s timeout. The matcher must match the entry's url field.
    fallbacks: {
      entries: [
        {
          url: "/offline",
          matcher: ({ request }: { request: Request }) =>
            request.mode === "navigate",
        },
      ],
    },
  });

  // ---- PURGE_CACHES message handler ----------------------------------------
  //
  // Allows client pages to trigger a full Cache Storage sweep via postMessage.
  // The sign-out route (rule 1 above) handles the common case automatically
  // from inside the SW fetch handler. This message handler is the out-of-band
  // path — for example, if the SW was not yet installed when the page was first
  // loaded and the sign-out fetch bypassed the SW entirely.
  //
  // Usage (from any page with a registered SW):
  //   const reg = await navigator.serviceWorker.ready;
  //   reg.active?.postMessage({ type: "PURGE_CACHES" });

  self.addEventListener("message", (event) => {
    // `waitUntil` and `data` are always present on message events from the SW
    // context; the cast avoids a webworker-lib dependency.
    const swEvent = event as Event & {
      data: unknown;
      waitUntil(f: Promise<unknown>): void;
    };

    if (
      swEvent.data !== null &&
      typeof swEvent.data === "object" &&
      (swEvent.data as Record<string, unknown>)["type"] === "PURGE_CACHES"
    ) {
      swEvent.waitUntil(
        caches
          .keys()
          .then((names) => Promise.all(names.map((n) => caches.delete(n)))),
      );
    }
  });

  sw.addEventListeners();
}
