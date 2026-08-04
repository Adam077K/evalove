---
date: 2026-08-03
agent: backend-engineer
session: backend-engineer-unilateral-remove
task: B4 — unilateral-remove
branch: feat/unilateral-remove
base_branch: ceo-3-1785631504
risk_tier: full
qa_verdict: pending
---

# Session: unilateral-remove

## What shipped

`DELETE /api/photos/[id]` — the first API endpoint that lets either person
remove something they made, without asking the other.

### Files changed

- `apps/web/lib/data/errors.ts` — added `"forbidden"` to `DataErrorKind`
  (maps to HTTP 403 via `statusOf`).
- `apps/web/lib/data/photos.ts` — `softDeletePhoto` gains a required
  `requestedBy: Uuid` third parameter. Checks `row.author_member_id`; throws
  `DataError("forbidden")` on mismatch. Author check lives in the data layer
  so it holds for every future caller, not just this route.
- `apps/web/app/api/photos/[id]/route.ts` — new. DELETE only. Zod on params.
  401 / 400 / 403 / 404 / 204.
- `apps/web/app/api/photos/[id]/__tests__/route.test.ts` — 13 tests, all pass.
  No database, no network.

## Success criteria status

1. `DELETE /api/photos/[id]` calls `softDeletePhoto` — DONE
2. Authorised against `getIdentity()`, upgrades free with B3 — DONE
3. Header comment states honest limitation — DONE
4. `purgePhoto` not exposed — DONE (never imported)
5. 401 / 404 / 403 correctly thrown — DONE
6. Idempotent: already-removed → 204 — DONE
7. Tests cover all 7 criteria — DONE (13 tests)

## Decisions made

### `"forbidden"` added to `DataErrorKind` in errors.ts

`errors.ts` is not in `files_in_scope` but it is also not in `do_not_touch`.
Adding `"forbidden"` (→ 403) is the minimal, contained change: it lets
`jsonFail` in `http.ts` map a data-layer refusal to the right HTTP status
without any bespoke error handling in the route. Alternatives considered:
a bespoke `ForbiddenError` class (more code, no benefit) or handling 403 at
the route level before calling `softDeletePhoto` (would need to expose
`findPhotoById` from the data index, which is a larger interface change).

### `requestedBy` is required, not optional

The brief says the route must always check authorship. Making it required
forces every future caller to supply a memberId rather than accidentally
omitting it and inheriting an un-gated delete. A caller that genuinely
needs un-gated access (e.g., an admin sweep) will know to notice and decide.

## Limitations (not defects)

- Identity is self-declared in Phase 1: this authorises "someone claiming to
  be Eva", not proven Eva. Stated in route header comment. Upgrades free
  when B3 lands — both read the same `getIdentity()` accessor.
- Vault-item removal is out of scope (requires vault re-auth, ARCH §5.6).
- Lint (`pnpm lint`) crashes with a circular-structure error in the ESLint
  React plugin — pre-existing on `ceo-3-1785631504`, not introduced here.
