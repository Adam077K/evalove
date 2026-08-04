#!/usr/bin/env node
/**
 * SW postbuild script — two-step compile + manifest injection.
 *
 * Run automatically as `postbuild` after `next build`.
 *
 * WHY TWO STEPS.
 *
 * @serwist/build's injectManifest() does NOT compile TypeScript. It reads the
 * swSrc file as plain text, finds the injectionPoint string (`self.__SW_MANIFEST`),
 * replaces it with the actual precache manifest JSON, and writes swDest. So a
 * TypeScript source file cannot be passed to it directly — the imports would
 * survive into the output untouched.
 *
 * @serwist/next/config's serwist() returns config INCLUDING an `esbuildOptions`
 * key that @serwist/build does NOT accept (it throws SerwistConfigError on
 * unrecognised keys). The `esbuildOptions` key is intended for an explicit
 * esbuild step before injectManifest runs. We extract it here and use it
 * directly with the esbuild JS API.
 *
 * Step 1: esbuild bundles app/sw.ts and all its imports (serwist, sw-route-
 *         classifier, lib/schema) into a single IIFE at public/sw-pre.js.
 *         The string `self.__SW_MANIFEST` passes through untouched because
 *         esbuild does not rename browser globals.
 *
 * Step 2: injectManifest globs the Next.js Turbopack build output (.next/),
 *         builds the precache manifest, finds `self.__SW_MANIFEST` inside
 *         sw-pre.js, replaces it with the manifest JSON, and writes public/sw.js.
 *
 * Step 3: public/sw-pre.js is removed. It must not be served.
 *
 * Output: public/sw.js — served at /sw.js by Next.js static file serving.
 *
 * Reference: https://serwist.pages.dev/docs/next/config
 *
 * -------------------------------------------------------------------------
 * PRECACHE SCOPE: WHY precachePrerendered: false
 * -------------------------------------------------------------------------
 *
 * The app has a middleware door (middleware.ts) that sends every unauthenticated
 * request to /login. The service worker installs while signed out (deliberate —
 * the app shell must be cached before sign-in completes). With the default
 * precachePrerendered: true, all prerendered HTML routes are in the manifest:
 * the SW fetches /home, /today, /book, etc. during install; each is a 307 →
 * /login; the browser follows the redirect; Serwist caches the login page under
 * /home, /today, etc. After sign-in those routes serve a login wall.
 *
 * Fix: set precachePrerendered: false to exclude all prerendered HTML from the
 * auto-generated manifest. The static JS/CSS chunks and font files still go in
 * the manifest; they are what make offline navigation fast.
 *
 * /offline is added back explicitly (see OFFLINE_HTML below). It is the one HTML
 * page that must be in the precache (it is the navigation fallback), and it is
 * the one HTML page that is safe to cache without auth (/offline is on the
 * middleware public-paths allowlist; its HTML contains no personal content).
 *
 * Navigation to /home etc. while offline: NetworkFirst times out after 3 s,
 * PrecacheFallbackPlugin returns the cached /offline shell, the user sees the
 * offline message. The app shell JS/CSS is still cached, so the offline page
 * renders correctly.
 */

import { build as esbuildBuild } from "esbuild";
import { injectManifest } from "@serwist/build";
import { serwist } from "@serwist/next/config";
import { unlink } from "node:fs/promises";

// Paths are relative to apps/web/ (cwd when run as a postbuild npm script).
const SW_SRC_TS = "app/sw.ts";
const SW_PRE_JS = "public/sw-pre.js"; // intermediate compiled output
const SW_OUT_JS = "public/sw.js";     // final output, served at /sw.js

// The offline shell HTML built by Next.js. This single file is added back to
// the globPatterns after precachePrerendered: false removes all HTML routes.
// The manifestTransform rewrites .next/server/app/offline.html → /offline so
// the precache URL is the path the browser requests, not the filesystem path.
const OFFLINE_HTML = ".next/server/app/offline.html";

// ---- Step 0: Get Serwist config from the Next.js configurator ----------------
//
// `serwist()` reads next.config.ts to find distDir and generates the correct
// globPatterns, manifestTransforms (URL path fixups), and dontCacheBustURLsMatching
// for the precache manifest.
//
// `precachePrerendered: false` — prevents authenticated HTML routes from entering
// the manifest and being fetched during install (they redirect to /login while
// the user is signed out, which would cache the login page under those routes).
//
// It also returns `esbuildOptions` (browser target from browserslist) that
// @serwist/build does NOT accept — we destructure it out and use it in step 1.
const { esbuildOptions = {}, ...injectOptions } = await serwist({
  swSrc: SW_SRC_TS,
  swDest: SW_OUT_JS,
  precachePrerendered: false,
});

// Add /offline back to the manifest. It is the one prerendered HTML page that:
//   a) must be precached so PrecacheFallbackPlugin can serve it offline, and
//   b) is safe to precache because it is on the middleware public-paths allowlist
//      and contains no personal content.
// The manifestTransform in injectOptions already handles the URL rewrite:
// .next/server/app/offline.html → /offline.
injectOptions.globPatterns = [...(injectOptions.globPatterns ?? []), OFFLINE_HTML];

// ---- Step 1: Compile TypeScript SW → bundled IIFE --------------------------
//
// `bundle: true`  — follows all imports (serwist, sw-route-classifier, schema)
//                   and produces a single self-contained file.
// `format: "iife"` — service workers are registered without {type: "module"}
//                    in ServiceWorkerRegistration.tsx; IIFE works everywhere.
// No `minify`     — keeps `self.__SW_MANIFEST` as a recognisable literal string
//                   so injectManifest can find and replace it in step 2.
await esbuildBuild({
  entryPoints: [SW_SRC_TS],
  bundle: true,
  platform: "browser",
  format: "iife",
  outfile: SW_PRE_JS,
  target: esbuildOptions.target ?? ["chrome90", "firefox88", "safari15"],
  treeShaking: true,
});

console.log("[build-sw] step 1: compiled app/sw.ts → public/sw-pre.js");

// ---- Step 2: Inject the precache manifest -----------------------------------
//
// `swSrc: SW_PRE_JS` — read the compiled IIFE (contains `self.__SW_MANIFEST`)
// `swDest: SW_OUT_JS` — write the manifest-injected output
//
// injectManifest also adds both to its own globIgnores so neither file is
// accidentally included in the precache manifest itself.
const result = await injectManifest({
  ...injectOptions,
  swSrc: SW_PRE_JS,
  swDest: SW_OUT_JS,
});

if (result.warnings.length > 0) {
  for (const w of result.warnings) console.warn("[build-sw] warning:", w);
}

console.log(
  `[build-sw] step 2: public/sw.js written — ${result.count} precache entries,`,
  `${(result.size / 1024).toFixed(1)} KB`,
);

// ---- Step 3: Remove intermediate file ---------------------------------------
//
// sw-pre.js must not be served to the browser — it has `self.__SW_MANIFEST`
// as a literal string, which breaks the SW (Serwist receives undefined instead
// of the precache array and precaches nothing).
await unlink(SW_PRE_JS);
console.log("[build-sw] step 3: removed public/sw-pre.js");
console.log("[build-sw] done — public/sw.js is ready");
