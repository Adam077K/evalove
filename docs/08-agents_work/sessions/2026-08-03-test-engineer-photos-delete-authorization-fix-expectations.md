---
date: 2026-08-03
role: test-engineer
session: test-photos-delete-authorization-fix-expectations
color: yellow
branch: feat/unilateral-remove
head_sha: f3f171a1c84d72c79f2ccb77ac5d50cd41cdeb2e
tier: full
mutations: NOT YET RUN — Phase 2 (separate future worker)
---

## Summary

Fixed two failing test expectations in `apps/web/lib/data/__tests__/photos.test.ts` that were caused by a timestamp format mismatch. The implementation was correct; the test assertions were incomplete.

### The Fix

**Before:** Tests expected `"2026-08-03T15:00:00Z"`
**After:** Tests expect `"2026-08-03T15:00:00.000Z"`

The two lines changed:
1. Line 302: `expect(patch.deleted_at).toBe("2026-08-03T15:00:00.000Z");`
2. Line 318: `{ deleted_at: "2026-08-03T15:00:00.000Z" }`

**Why:** `Date.prototype.toISOString()` always emits milliseconds. The fixed-time `Date` object created in `createTestDeps()` produces `"2026-08-03T15:00:00.000Z"` when converted to ISO format. The test fixture was omitting the `.000Z` suffix.

### Test Results

**Baseline (before fix):** 10/12 passing, 2 failing (both happy-path millisecond mismatches)
**Current (after fix):** 12/12 passing

All tests verified passing with vitest:
```
Test Files  1 passed (1)
     Tests  12 passed (12)
  Start at  22:34:57
  Duration  354ms
```

### Authorization & Purged_At Coverage

All 10 critical authorization and purged_at guard tests remain green:

- **Photo not found (1 test):** Throws `not_found` when photo does not exist ✓
- **Purged_at guard (2 tests):** Rejects purged photos; allows deletion of non-purged photos ✓
- **Authorization check (3 tests):** Enforces `author_member_id !== requestedBy` before idempotency, even for already-deleted photos ✓
- **Idempotency (1 test):** Returns early on already-deleted photos (no database update) ✓
- **Guard ordering (1 test):** Authorization is checked BEFORE the idempotent early return ✓
- **Edge cases (2 tests):** Distinguishes null from timestamps for both purged_at and deleted_at ✓

### Phase 2 — Mutation Verification (Deferred)

This session verified the baseline is clean (12/12) on commit `f3f171a`. Phase 2 (separate future worker) will apply mutations one-per-commit and confirm each fails as expected:

- **Mutation F:** Delete the `author_member_id` check → Authorization tests should fail
- **Mutation G:** Invert to `===` instead of `!==` → Authorization tests should fail  
- **Mutation H:** Delete the `purged_at` guard → Purged_at tests should fail

The baseline is now ready for Phase 2 mutation testing.

### Recovery Note

The test file was authored by a worker on `test/photos-delete-auth` that died before running tests. The CEO then committed the file from the CEO layer with `NOT YET VERIFIED` notation (commit `a401be5`). This session validated the file, identified the fixture bug (toISOString milliseconds), and fixed the expectations. The implementation (`apps/web/lib/data/photos.ts`) was never modified — only test expectations.

No credentials, secrets, or destructive operations in this session. File is clean for merge.
