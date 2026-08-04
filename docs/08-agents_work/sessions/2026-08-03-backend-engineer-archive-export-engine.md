---
date: 2026-08-03
agent: backend-engineer
session: backend-engineer-archive-export-engine
task: B1 — archive-export-engine
branch: feat/archive-export-engine
base_branch: ceo-3-1785631504
worktree: .worktrees/archive-export-engine
risk_tier: full
qa_verdict: pending
status: COMPLETE
---

# B1 — archive-export-engine

## What shipped

A dependency-light Node CLI and supporting library that reads the full archive
out of Supabase and writes a self-contained folder of original files in dated
folders with plain-text and CSV indexes — openable on a laptop in ten years
with this app and company gone.

## Files created or modified

```
tools/export/index.ts         CLI entry point; arg parsing, orchestration
tools/export/read.ts          own Supabase client (deliberate ARCH §6.3 violation)
tools/export/layout.ts        path grammar, filename composition (pure)
tools/export/index-html.ts    self-contained HTML index generator (pure)
tools/export/manifest.ts      CSV emitters (pure)
tools/export/verify.ts        SHA-256 checksum re-reader (pure)
tools/export/README.md        user-facing documentation
tools/export/__tests__/layout.test.ts
tools/export/__tests__/manifest.test.ts
tools/export/__tests__/index-html.test.ts
tools/export/__tests__/verify.test.ts
tools/tsconfig.json           type checking for tools/ directory
tools/vitest.config.ts        standalone vitest config (not used; kept for reference)
apps/web/package.json         added 'export' and 'test:tools' scripts
apps/web/vitest.config.ts     added tools test path to include
```

## Tests

56 tests across 4 test files, all passing. Zero failures.

```
tests:   56 passed (56)
typecheck: zero errors (both apps/web and tools)
lint: ESLint circular-reference error is pre-existing (affects the whole
      project, not introduced here; tsc covers type correctness)
```

## Success criteria checked

1. Output layout: `eva-and-adam-archive/README.txt index.html index.csv photos/ book/ data/` — implemented
2. Filenames carry the meaning: `YYYY-MM-DD--eva--HHMM--shortid.jpg` — implemented and tested
3. `index.html` self-contained: no external refs — tested with 5 assertions, including explicit http/https check
4. CSV alongside HTML: `index.csv` is the primary index — implemented
5. Originals when they exist, display variant with honest labelling otherwise — `file_variant` column in CSV and HTML
6. `--verify`: re-reads and compares SHA-256, exits 1 on mismatch — implemented and tested
7. Resumable: skips files with matching checksum — implemented in index.ts
8. Vault: `--include-vault` OFF by default, requires `VAULT_PASSPHRASE`, writes to `private/` — implemented
9. `README.txt`: plain text addressed to a person, not a developer — written (B6 will replace prose)
10. Tests: layout, CSV escaping (comma+quote+newline), no-network, checksum verifier — all covered
11. `node --experimental-strip-types` compatible: `.ts` extensions in all imports — done

## Constraints satisfied

1. `@supabase/supabase-js` imported directly in `read.ts` with a header comment documenting the §6.3 violation reason
2. Read-only: no insert/update/delete anywhere in tools/
3. No new runtime deps: only Node built-ins + @supabase/supabase-js
4. TypeScript strict: zero type errors
5. No credential literals in any file

## Decisions made

- `--experimental-strip-types` compatibility requires `.ts` file extensions in all import specifiers within tools/
- `NODE_PATH=$(pwd)/node_modules` in the npm script makes @supabase/supabase-js discoverable from tools/ without a separate node_modules install
- The tools tests are run via `apps/web/vitest.config.ts` (added absolute path to include); this avoids a second vitest installation and shares the same runner
- `Intl.DateTimeFormat` (Node.js built-in via V8) is used for timezone-local time formatting; no date library needed
- `checksum_sha256` comparison is case-insensitive (DB may store uppercase; sha256 computes lowercase)
- The deliberate ESLint error is pre-existing in the project (FlatCompat circular reference); not introduced by this work

## How to run

From `apps/web/`:
```sh
SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... npm run export -- --verify
```

Tests:
```sh
cd apps/web && npm run test:tools
```

Type check:
```sh
cd apps/web && npm run typecheck
# tools-specific:
./node_modules/.bin/tsc --project ../../tools/tsconfig.json
```
