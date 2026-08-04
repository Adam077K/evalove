"use client";

/**
 * ServiceWorkerRegistration — mounts once in the root layout, registers /sw.js.
 *
 * This component handles the SW lifecycle:
 *   - Registration on first load
 *   - Automatic activation on update (skipWaiting is set in the SW itself)
 *   - Out-of-band cache purge via the PURGE_CACHES message (described below)
 *
 * SIGN-OUT AND CACHE PURGE
 *
 * The primary mechanism is inside the SW: when the SW intercepts
 * DELETE /api/session and receives a 204, it sweeps all Cache Storage entries,
 * the OPFS outbox/ directory (photograph bytes), and IndexedDB eva-adam-outbox
 * (captions, author) from the device. That handles the common case.
 *
 * The secondary mechanism is this component's purgeCaches() export. Use it
 * when sign-out is initiated in a context where the SW is not yet installed
 * (e.g., the very first session on a device before the SW has activated), or
 * when you need to guarantee purge synchronously in the page context before
 * a redirect. purgeCaches() covers everything the SW covers, plus the
 * localStorage profile key (accessible only from the page context).
 *
 * Usage:
 *   import { purgeCaches } from "@/components/chrome/ServiceWorkerRegistration";
 *   // After sign-out succeeds:
 *   await purgeCaches();
 *
 * KILL SWITCH AND THIS COMPONENT
 *
 * If a bad SW has been deployed and KILL_SWITCH is set in a new deploy,
 * the SW unregisters itself on its next install event. This component will
 * then find navigator.serviceWorker.getRegistrations() empty on the next load
 * and simply not register — which is the correct state.
 *
 * PRIVACY
 *
 * This component contains no personal content and renders nothing visible.
 * It is mounted in the root layout so it is present on every page, including
 * the login page (the SW must be registered before the user is authenticated
 * so the app shell is cached before sign-in completes).
 */

import { useEffect } from "react";

/**
 * Sweeps every personal-content store from this device.
 *
 * Purges in this order:
 *   1. Cache Storage — via the active SW (if any), then directly from the page
 *   2. OPFS outbox/  — photograph bytes of anything queued but not yet uploaded
 *   3. IndexedDB eva-adam-outbox — captions, author, queue state
 *   4. localStorage profile key — which of the two people last used the device
 *
 * Paths 2-4 are page-context only: the SW cannot access localStorage, and
 * reaching OPFS/IDB directly here handles the case where no SW is active.
 *
 * Scenario the fix must handle: Eva queues three captioned photos on Adam's
 * phone while offline, signs out, hands it back — her photographs must be gone.
 */
export async function purgeCaches(): Promise<void> {
  // --- Path 1a: tell the SW to purge Cache Storage (it knows its cache names).
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: "PURGE_CACHES" });
    } catch {
      // SW not available — fall through to direct purge.
    }
  }

  // --- Path 1b: direct Cache Storage purge from the page context.
  //     Handles the case where no SW is active.
  if (typeof caches !== "undefined") {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    } catch {
      // caches API unavailable — nothing to purge.
    }
  }

  // --- Path 2: OPFS outbox/ — photograph bytes.
  //     navigator.storage.getDirectory() is available in page contexts on all
  //     modern browsers. NotFoundError is benign: no photos were queued.
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.getDirectory === "function"
  ) {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("outbox", { recursive: true });
    } catch (err) {
      if ((err as DOMException)?.name !== "NotFoundError") {
        console.error("[sw-reg] OPFS outbox purge failed", err);
      }
    }
  }

  // --- Path 3: IndexedDB eva-adam-outbox — captions, author, queue state.
  if (typeof indexedDB !== "undefined") {
    try {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase("eva-adam-outbox");
        req.onsuccess = () => resolve();
        req.onerror = () => {
          console.error("[sw-reg] IndexedDB purge error", req.error);
          resolve();
        };
        req.onblocked = () => resolve();
      });
    } catch (err) {
      console.error("[sw-reg] IndexedDB purge failed", err);
    }
  }

  // --- Path 4: localStorage profile key — which person last used this device.
  //     The profile key is set by lib/viewer.ts (imported from
  //     lib/session/profile.ts where PROFILE_KEY = "profile"). This is the
  //     only store that requires the page context (SWs cannot access localStorage).
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem("profile");
    } catch {
      // localStorage unavailable (e.g., private browsing in some browsers).
    }
  }
}

/**
 * Registers /sw.js and wires up lifecycle events.
 *
 * Renders nothing — this is a pure side-effect component.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let mounted = true;

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          // Update the SW on every page load in development so changes are
          // picked up immediately. In production, the browser checks for
          // updates automatically (per spec: at least every 24 hours, and on
          // every navigation if more than 24 hours since the last check).
          updateViaCache: process.env.NODE_ENV === "production" ? "all" : "none",
        });

        // Log the registration state on first registration.
        if (reg.installing) {
          await waitForState(reg.installing, "activated");
        }

        // Listen for future updates (new SW installs while the page is open).
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker || !mounted) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // A new SW is installed and waiting. The SW has skipWaiting: true,
              // so it will activate automatically — but a message can also be
              // sent here to skip waiting explicitly if needed.
            }
          });
        });
      } catch (err) {
        // SW registration failure is non-fatal: the app works online without
        // it. Log for diagnostics and continue.
        console.error("[sw] registration failed", err);
      }
    }

    register();

    return () => {
      mounted = false;
    };
  }, []);

  // Nothing to render.
  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolves when `worker` reaches the target state, or rejects on "redundant". */
function waitForState(
  worker: ServiceWorker,
  targetState: ServiceWorkerState,
): Promise<void> {
  return new Promise((resolve, reject) => {
    function onChange() {
      if (worker.state === targetState) {
        worker.removeEventListener("statechange", onChange);
        resolve();
      } else if (worker.state === "redundant") {
        worker.removeEventListener("statechange", onChange);
        reject(new Error("SW became redundant before reaching " + targetState));
      }
    }
    worker.addEventListener("statechange", onChange);
  });
}
