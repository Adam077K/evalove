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
};

export default nextConfig;
