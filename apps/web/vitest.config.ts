import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
// Tools tests live outside the Next.js app root; resolve to absolute paths
// so vitest can find them regardless of the working directory.
// tools/ingest reuses apps/web/lib/photo/{exif,guard}.ts and lib/data/photos.ts
// directly via the "@" alias below — the same alias this config already
// defines for the app's own tests, which is what lets those imports resolve
// here without tools/ingest needing a second, separate vitest config.
const toolsTestsGlobs = [
  resolve(webRoot, "../../tools/export/__tests__/**/*.test.ts"),
  resolve(webRoot, "../../tools/ingest/__tests__/**/*.test.ts"),
  resolve(webRoot, "../../tools/book-placement/__tests__/**/*.test.ts"),
];

export default defineConfig({
  test: {
    environment: "node",
    // `lib/env.ts` validates the environment at module evaluation, so anything
    // that transitively imports it needs a complete one before the import runs
    // — which is earlier than any `beforeAll`. See the file for what it sets
    // and what it deliberately leaves alone.
    //
    // The tools tests do not import lib/env.ts (they are pure fixtures), so the
    // setup file is harmless for them — it just sets some env vars that go unused.
    setupFiles: ["./lib/__tests__/setup-env.ts"],
    include: [
      // Root-level tests for files that live at the app root itself
      // (middleware.ts and friends) rather than under lib/, app/, or
      // components/ — a sibling __tests__ dir, same convention as the rest.
      "__tests__/**/*.test.{ts,tsx}",
      "lib/**/*.test.ts",
      "app/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      ...toolsTestsGlobs,
    ],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
