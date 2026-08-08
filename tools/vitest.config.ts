/**
 * vitest.config.ts for tools/export and tools/ingest tests
 *
 * Run from apps/web/:
 *   npm run test:tools
 *
 * Which expands to:
 *   vitest run --config ../../tools/vitest.config.ts
 *
 * vitest is installed in apps/web/node_modules and runs from there.
 * The root is set to tools/ so that include patterns resolve correctly.
 * No setupFiles needed — these tests are pure fixtures; they do not import
 * lib/env.ts or anything that validates the environment at load time.
 *
 * The `@` alias mirrors apps/web/tsconfig.json's `paths` mapping. tools/ingest
 * reuses apps/web/lib/photo/{exif,guard}.ts (the EXIF/GPS-strip verification)
 * by importing them as "@/lib/photo/guard" — this is what lets that import
 * resolve when this config runs standalone rather than via apps/web's own
 * vitest.config.ts (which already carries the same alias and picks up these
 * tests too — see the toolsTestsGlobs array there).
 */

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const toolsRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: toolsRoot,
  test: {
    environment: "node",
    include: [
      "export/__tests__/**/*.test.ts",
      "ingest/__tests__/**/*.test.ts",
      "book-placement/__tests__/**/*.test.ts",
      "authorship-fix/__tests__/**/*.test.ts",
    ],
    // No setupFiles: these tests are pure — no database, no env vars, no app.
  },
  resolve: {
    alias: {
      "@": resolve(toolsRoot, "../apps/web"),
    },
  },
});
