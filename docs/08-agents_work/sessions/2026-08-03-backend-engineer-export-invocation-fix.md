---
date: 2026-08-03
agent: backend-engineer
task: export-invocation-fix
branch: feat/export-invocation-fix
base_branch: feat/archive-export-mirror
worktree: .worktrees/export-invocation-fix
qa_verdict: pending
tier: lite
---

# Session: export-invocation-fix

## What was broken

`tools/export/read.ts` imports `@supabase/supabase-js` but the package was only
declared in `apps/web/package.json`. Node's ESM resolver walks up from the importing
file and never reaches `apps/web/node_modules` — `NODE_PATH` is a CommonJS-only
mechanism that ESM ignores entirely. Every invocation set `NODE_PATH=` as though
it were configured, which masked the root cause. The nightly export job and the
manual procedure both silently never worked.

## What was changed

### tools/package.json
- Added `@supabase/supabase-js: ^2.111.0` (matching apps/web/package.json version)

### tools/pnpm-lock.yaml (new) / tools/package-lock.json (deleted)
- Switched tools/ from npm to pnpm to prevent re-introduction of the
  workspace-root resolution bug being removed on a sibling branch
- Generated via `pnpm install` in `tools/`

### .github/workflows/nightly-archive.yml
- Removed `NODE_PATH=$(pwd)/node_modules` from the export step
- Removed `NODE_PATH=tools/node_modules` from the upload step
- Changed tools install from `npm ci` to `pnpm install --frozen-lockfile`
- Corrected vault comment: the founder has decided vault IS included in
  automatic copy, encrypted with age to three recipients (not "undecided")

### apps/web/package.json
- Removed `NODE_PATH=$(pwd)/node_modules` from the `export` script

### docs/03-system-design/RUNBOOK-nightly-archive.md
- §2: corrected vault status — decision made, encrypted with age to three recipients
- §4: removed `NODE_PATH=` from both Step 1 (export) and Step 2 (upload)
- §8: deleted entirely — it was a four-step recipe to produce an unencrypted
  plaintext vault copy, directly reversing what the encryption work prevented

### tools/export/__tests__/cli-smoke.test.ts (new)
- Smoke test: spawns the CLI as a subprocess with an empty environment
- Asserts `ERR_MODULE_NOT_FOUND` does not appear in stderr
- Asserts a configuration error (missing SUPABASE_URL) does appear in stderr
- Requires no database, no credentials, no network

## Proof of failure

The smoke test was verified to fail before the fix by temporarily removing
`tools/node_modules/@supabase`. Failure output:

```
ERR_MODULE_NOT_FOUND: Cannot find package '@supabase/supabase-js' imported
from .../tools/export/read.ts

AssertionError: ERR_MODULE_NOT_FOUND must not appear — add missing dep to
tools/package.json
Expected: not.toContain("ERR_MODULE_NOT_FOUND")
Received: "...Cannot find package '@supabase/supabase-js'..."
```

This is the exact error that was silently preventing every nightly export.

## CLI verified to start

Running `node --experimental-strip-types ../../tools/export/index.ts` from
`apps/web/` with no env vars set now produces:

```
Output directory: .../eva-and-adam-archive

EXPORT FAILED: Neither NEXT_PUBLIC_SUPABASE_URL nor SUPABASE_URL is set.
Export cannot read from the database.
```

All imports resolved. The program started. The only missing piece is credentials.

## Test results

57 tests passed (5 test files). The new smoke test is the 57th.
