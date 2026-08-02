---
date: 2026-08-02
role: backend-engineer
task: P1-T6 — shared-day model implementation
branch: worktree-agent-abbcf07b569d8dd45
color: blue
name: backend-t6-impl
tier: full
qa_verdict: pending
tests: 109/109 passing (vitest)
typecheck: clean
---

# T6 — shared-day model, implementation against the golden set

- Implemented `apps/web/lib/shared-day/` as 8 files (calendar, zones, members, bounds, windows, presence, days-together, index) against the pre-existing 831-line golden suite. No test was edited.
- Day rule: `sharedDay = (createdAt AT TIME ZONE <author IANA zone>)::date`. Day opens 00:00 Asia/Jerusalem, closes 23:59:59 America/New_York; length is read from tzdata, giving 31h on 339 days of 2026 and 30h on 26.
- Zone inversion (`startOfLocalDay`) is three tzdata probes 36h apart plus a round-trip check, with bisection as the fallback for a local midnight the clock jumps over. No numeric UTC shift exists anywhere in the module; golden 8 greps the source and passes.
- `currentWindow` (w1..w9) and `partnerPresence` are new product surface with no golden coverage — both are documented inferences, and `unknown` / `null` are real returned values, not error paths.
- Blocker for QA: `npx eslint` crashes repo-wide before reading any file (`Converting circular structure to JSON`, FlatCompat + eslint-config-next 16 on eslint 9.39.5). Pre-existing; reproduces on `lib/utils.ts` on a clean install.
