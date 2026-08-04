---
date: 2026-08-03
role: backend-engineer
task: B5 — auth-availability
branch: feat/auth-availability
worktree: .worktrees/auth-availability
base_branch: ceo-3-1785631504
risk_tier: full
qa_verdict: pending
---

# Session: auth-availability (B5)

## What was done

Narrowed the fail-closed posture of the login rate limiter so that a Supabase
outage no longer locks both users out of their own archive.

### `lib/auth/rate-limit.ts`

- Updated the file header to document the new split: `scope='session'` now
  degrades; `scope='vault'` still fails closed. The original argument is
  preserved and updated to explain which door it applies to and why.
- Added `checkDegradedRateLimit(scope, ip, now)`: module-scope in-process
  counter, 3 attempts per IP per 15-minute window per lambda instance.
  Pessimistic counting (charge on check, before outcome is known) keeps all
  state changes inside the catch block with no `isDegraded` flag.
- Added `__resetDegradedCounters()` for test isolation.
- Exported `DEGRADED_MAX_FAILURES = 3`.

### `app/api/session/route.ts` (catch block only)

- Replaced the blanket 503 return with `checkDegradedRateLimit("session", ip)`.
- If the degraded counter allows: `limit = { allowed: true }`, flow continues.
- If refused: returns 429 with `Retry-After` — byte-identical to the ordinary
  rate-limit 429. No banner, no extra header, no different message.
- `console.error` on every entry into the degraded path.
- Added `checkDegradedRateLimit` and `RateLimitDecision` to the import.

### Tests

`lib/auth/__tests__/rate-limit.test.ts` — 5 new tests for the pure decision
function:
- First attempt allowed (session scope, no prior state)
- 4th attempt refused after 3 charges
- vault scope always refused (caller must return 503)
- Counter expires after 15-minute window
- Different IPs have independent budgets

`app/api/session/__tests__/route.test.ts` — updated 1 test + 4 new tests:
- Updated "fails CLOSED" test: now expects 200 on correct password with storage
  failure (the old 503 behavior is replaced)
- Storage failure + correct password = 200
- Storage failure + wrong password = 401 with identical message
- 4th wrong password = 429 with Retry-After
- Degraded 429 body is byte-identical to ordinary 429

All 38 tests pass (2 files).

## Decisions made

- **Pessimistic counting**: each call to `checkDegradedRateLimit` charges the
  instance budget before knowing the password outcome. This eliminates the need
  for an `isDegraded` flag and a second recording point, keeping all state
  changes inside the catch block as the brief required.
- **Per-IP key in degraded counter**: different IPs get independent budgets.
  Null IP uses a shared `__null__` bucket (same as the existing limiter's
  treatment of unresolvable addresses).
- **Window reuses `ADDRESS_WINDOW_MS`** (15 min) for consistency with the
  ordinary per-address window.

## Constraints satisfied

1. `scope='vault'` never degrades — returns refused; caller must return 503.
2. Degraded response is byte-identical to ordinary 429.
3. `console.error` on every degraded entry with no credential material.
4. No new dependency, no table, no cache vendor.
5. Healthy path unchanged: 5-per-address-per-15-min and 20-per-hour-global
   constants not touched.
6. File header updated to document which door the fail-closed posture applies to.

## B3 handoff note

`feat/auth-availability` is the base branch for B3 (`feat/per-person-credential`).
B3 should rebase onto this branch before starting. The only shared file is
`app/api/session/route.ts`: my changes are entirely in the import block and the
`try/catch` around `checkRateLimit`. B3's password-check changes are downstream
of the `if (!limit.allowed)` block and there is no conflict surface.

## Known non-defect

`apps/web/lib/session/__tests__/session.test.ts` flakes ~1 run in 10. This is
a pre-diagnosed test defect (commit `9711bc9`, base64url assertion). Not touched
and not blocking this work.

## Pre-existing environment note

ESLint fails with a circular-JSON error in both this branch and the base branch.
Pre-existing; not introduced here. Tests and typecheck (0 errors) are the
verification gate for this task.
