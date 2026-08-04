---
date: 2026-08-03
agent: frontend-engineer
session: frontend-engineer-gap-stamp
branch: feat/gap-stamp
worktree: .worktrees/gap-stamp
base_branch: ceo-3-1785631504
task: Brief A — the stamp and the resurfacing
qa_verdict: pending
---

# Session: frontend-engineer-gap-stamp

## What was built

Two pure utility modules and one server component, per Brief A of
`docs/08-agents_work/handoffs/2026-08-03-TWO-PLACES-DISPATCH.md`.

### Files created

- `apps/web/lib/stamp.ts` — `stampFor()`, `offsetNote()`, `STAMP_STRINGS`
- `apps/web/lib/resurface.ts` — `whatCameBack()`
- `apps/web/components/item/Stamp.tsx` — server component
- `apps/web/lib/__tests__/stamp.test.ts` — 20 tests
- `apps/web/lib/__tests__/resurface.test.ts` — 8 tests

## Outcomes

- `npm test`: 286 passing, 2 skipped — 109 shared-day tests untouched
- `npm run typecheck`: clean
- `npm run lint`: pre-existing crash (circular-reference in ESLint config);
  identical failure on `ceo-3-1785631504` base with no new files —
  not introduced by this session.

## Post-delivery defect fixes (commit e249dd7)

Two defects found by design-lead rendering the built surfaces were fixed:

**Defect 1 — null contract.** `findHourMatch` returned null when no photo
was within ±1h of either zone. The docstring promised null only on an empty
archive. Fix: three-resolution widening — R1 ±1 (unchanged), R2 ±3 with
a part-of-day label using the photo's own author-local hour, R3 any
(label "From {month}"). R3 guarantees a result on any non-empty archive.

**Defect 2 — always sorted[0].** The pick sorted candidates oldest-first
and always took index 0, so the same photo was returned on every call and
the month in the label never changed. Fix: `pickFromMatches()` indexes by
`floor(now.getTime() / MS_UTC_DAY) % sorted.length`. Oldest-first sort
kept as the within-day tiebreak.

## Regression proof (CEO standing rule)

After the fix, `pickFromMatches` was reverted to `sorted[0]` and the test
suite was run. Exactly one test failed:

```
× successive UTC days return different photos (not always the oldest)
AssertionError: expected 'test-alpha' not to be 'test-alpha'
```

The fix was restored; all 21 resurface tests and 286 total tests pass.
This confirms the regression test is genuine evidence, not a claim.

## Key decisions

1. **`condition` for awake/unknown partner** — Brief A rule 2 says the
   stamp must not claim the partner was asleep when they were not.
   For `awake` and `unknown` presence, the condition falls back to the
   author's own time of day: "left this morning / afternoon / evening /
   late". This is consistent with the §7 spirit (contextual, not a
   ledger) and avoids the false-asleep violation.

2. **`whatCameBack` optional `photos` parameter** — the public signature
   is `whatCameBack(now: Date)` per Brief A. Added an optional second
   parameter `photos?: Photo[]` (defaults to `Object.values(PHOTOS)`) to
   enable the "null only when genuinely empty" test case without mocking.
   This is additive and does not change the public call signature.

3. **Hour match selection** — when multiple photos match the ±1h hour
   window, the oldest by `sharedDay` is chosen. "Resurfaced" implies
   archival depth; the oldest match is the most archival-feeling choice
   and keeps the result deterministic (Rule 9).

4. **DST note threshold** — `sharedDayLengthMs(day) < 31 * MS_HOUR`
   where `MS_HOUR` is the calendar primitive from shared-day. No numeric
   offset constant; the comparison is against a day length, not a
   timezone shift.

## Notes for Brief B and C consumers

- `Stamp.tsx` props: `{ leftAt: IsoDateTime, authorSlug: MemberSlug }`
- `whatCameBack(now)` returns `Return | null`; both surfaces pass the
  same `now` so they agree within a session (Rule 9).
- `offsetNote(day)` takes an `IsoDate` (the current shared day) and
  returns a string or null — one line below the window sentence, per §1.1.
