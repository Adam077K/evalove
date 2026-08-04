/**
 * Next.js configuration.
 *
 * WHY THERE IS NO withSerwist WRAPPER HERE.
 *
 * @serwist/next's withSerwist injects a webpack plugin to compile app/sw.ts
 * and inject the precache manifest. Next.js 16 uses Turbopack by default for
 * both `next dev` and `next build`; it errors when it finds a `webpack` config
 * without a matching `turbopack` config.
 *
 * The fix is @serwist/next's "configurator mode": the SW is compiled and the
 * precache manifest is injected AFTER the Next.js build by scripts/build-sw.mjs
 * (run automatically as a `postbuild` npm script). Turbopack runs the Next.js
 * build cleanly; the SW is then compiled separately using @serwist/build.
 *
 * End state: `next build` succeeds with Turbopack, and `public/sw.js` is
 * emitted by the postbuild step so /sw.js is present in the deployment.
 *
 * See: https://serwist.pages.dev/docs/next/config
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // `next dev` treats http://localhost:PORT and http://127.0.0.1:PORT as
  // different origins for its dev-only cross-origin protection, even though
  // they are the same loopback address. Left unset, a page loaded via
  // 127.0.0.1 gets its HMR WebSocket handshake to /_next/webpack-hmr
  // rejected ("Blocked cross-origin request... Error during WebSocket
  // handshake: net::ERR_INVALID_HTTP_RESPONSE"), and the dev client's
  // bootstrap never completes: SSR HTML and JS chunks all still load with
  // 200s, but hydrateRoot() never commits — no
  // window.__REACT_DEVTOOLS_GLOBAL_HOOK__ fiber roots ever register,
  // useEffect never fires on mount, and every event handler that calls
  // setState (e.g. LoginForm's password input) updates the DOM natively
  // but never re-renders. This reproduced identically on both Turbopack
  // and webpack (`next dev --webpack`) and on every route tested — it is
  // not a route-specific bug, it is this origin mismatch. `127.0.0.1` is
  // the baseURL e2e/playwright.config.ts uses for the whole Playwright
  // suite, so left unset this silently broke every dev-server interaction
  // check run through that suite (or through any tool defaulting to
  // 127.0.0.1) while `next start` and a human visiting `localhost`
  // remained unaffected. See:
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
