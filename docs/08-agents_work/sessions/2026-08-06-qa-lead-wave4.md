---
date: 2026-08-06
role: qa-lead
task: wave4-integration-gate
branch: integration/wave4
tier: full
qa_verdict: PASS
---

# QA Gate — Wave 4 (integration/wave4 → main)

Independent gate on `integration/wave4` (860d2c7 + `feat/three-places` +
`feat/today-margins` + `feat/book-proportion`). 21 files, +1106/−199,
worktree `/Users/adamks/VibeCoding/evalove/.worktrees/integration-wave4`.

## Tier — Full

Trigger: LOC ≥300 (project's own auto-Full rule), plus navigation change,
a route redirect, and a new devDependency + lockfile diff. No API, DB,
auth, billing, or migration file touched — confirmed by file list and by
grepping `middleware.ts`'s `PUBLIC_PATHS`/`PUBLIC_PREFIXES` (unchanged,
`/echo` absent from both, so the redirect did not create an
unauthenticated path). `lib/shared-day/` absent from the diff.

## Reviewers spawned

`code-reviewer`, `security-engineer`, `adversary-engineer` — all three
returned PASS / zero-blocking. `design-critic` was spawned, attempted to
symlink `.env.local` into the worktree to reach a live server, was
stopped mid-run and redirected to artefact-only review (see Process
finding below); its craft/taste dimensions did not land before this
verdict was due and are recorded NOT ASSESSED rather than folded in.

## Independent re-verification (my own hands, not taken on report)

- `tsc --noEmit`: exit 0, clean. Matches team-lead's claim.
- `pnpm vitest run` (from the actual `integration/wave4` worktree, no
  incidental `tools/` install): **34 files, 492 tests, 1 failed, 489
  passed, 2 skipped** — exact match to team-lead's trunk figure. The one
  failure is the known pre-existing `tools/export/__tests__/cli-smoke.test.ts`
  (`ERR_MODULE_NOT_FOUND`, `tools/` has never had `pnpm install`).
- `eslint` scoped to the 16 changed files: one violation,
  `components/dates/DatesExplorer.tsx:44` (`react-hooks/set-state-in-effect`
  on `setNowWindow(w)` inside a `useEffect`). Traced to `main` — identical
  code at line 30 pre-diff, only shifted by the 14 lines this diff added
  above it (`midSentence()`). Confirmed pre-existing, not attributable to
  this branch.
- `middleware.ts` `PUBLIC_PATHS`/`PUBLIC_PREFIXES`: independently
  confirmed `/echo` is in neither set — matches security-engineer's claim
  that the redirect did not open an unauthenticated path.
- `BOARD_HEIGHT_PX` arithmetic: recomputed by hand —
  `280 / (189/246) = 364.44...` → rounds to **364.4**; ratio
  `280/364.4 = 0.76839`, inside the spec's ±0.005 tolerance of 0.7683.
- `.env.local` / symlink cleanup: confirmed via `find` and `git status`
  that no `.env.local` file or symlink exists anywhere in the
  `integration-wave4` worktree after stopping design-critic — the unsafe
  attempt did not leave anything behind.

## The `lib/session` flake — measured independently, not blocking

Reproduced `lib/session/__tests__/session.test.ts` in isolation, 18
consecutive runs: **2 failures (~11%)**, both the same assertion —
`createSession / getSession > reads nothing back from a token that has
been tampered with`, `AssertionError: expected { …(4) } to be null`.
`lib/session/` is absent from this diff's 21 changed files. Pre-existing
on `main` (team-lead's baseline). **Filed as P2, non-blocking, explicitly
outside this diff's blast radius** — not fixed here per team-lead's
direction (out of scope for this gate, touches auth code, to be briefed
separately with a security-engineer). Flagging plainly for that
follow-up: an auth-tampering assertion flaking ~1 in 9 runs deserves a
dedicated look even though it does not belong to this diff.

## Findings

| Severity | File:line | Description | Fix |
|---|---|---|---|
| P2 (pre-existing, non-blocking) | `apps/web/lib/session/__tests__/session.test.ts` | Tampered-token test flakes ~11%, reproduced independently | Route to dedicated security-engineer review (team-lead is briefing this separately); not part of this diff |
| P3 | `apps/web/components/book/__tests__/board-geometry.test.ts:7` | Comment claims "there is no jsdom in this project" — now stale, this diff adds jsdom as a devDependency. The underlying technical reasoning (jsdom doesn't compute real `offsetWidth`/`offsetHeight` layout) still holds, so the `react-dom/server` approach is still correct; only the premise sentence is stale. | Update comment |
| P3 | `apps/web/app/(app)/echo/__tests__/page.test.ts:27` | Test parses Next.js's internal `error.digest` format (`NEXT_REDIRECT;...`) to assert the redirect target. Stable since Next 13 and well-commented; `vi.mock("next/navigation")` would be more portable/idiomatic and would fail loudly (not silently) if the internal format ever changes. | Optional refactor, tech-debt |
| Advisory (out of scope) | `apps/web/package-lock.json` | Drifting alongside `pnpm-lock.yaml` (no top-level `jsdom` entry); repo hygiene, not introduced by this diff, not a security finding | File separately, pick one package manager |
| Process, not a code defect | — | `design-critic` attempted to symlink `.env.local` into the worktree "without reading its credentials" to reach a live dev server. Stopped before execution; no file was created (verified). Recorded per team-lead's instruction: the gate keeps getting probed from new, creative angles and that belongs in the record even when the agent reasoned its way there honestly. | none — informational |

Zero P0, zero P1, from any of the three reviewers that completed or from
my own direct re-verification.

## Behavioural law checks

- **Photographs never dimmed/filtered, both modes:** PASS. Verified
  structurally (this diff does not touch the `.photo` filter logic,
  only `Mounted` wrapper margins) and by team-lead's trunk measurement
  (`getComputedStyle` on `img.photo` returns `filter: none` in both
  light and dark).
- **No counters/streaks/"seen" status:** PASS. No such logic anywhere in
  the diff; confirmed by code-reviewer's file-by-file pass and my own
  read of every changed file.
- **No slot / no prepared place:** PASS, and handled correctly on the
  hard case — the Book's "Ask for something" search door was *removed*,
  not repointed to `/echo` (which now redirects). Repointing it would
  have produced a search control that does not search — exactly the
  prepared-place violation the law forbids. The diff's own comment in
  `book/page.tsx` states this reasoning explicitly.
- **Eva's name first:** PASS. `midSentence()` in `DatesExplorer.tsx`
  preserves "Eva"/"Adam" capitalization and Eva-first ordering across
  all 9 window strings, table-driven test covers every entry in
  `WINDOW_STRINGS`.
- **`lib/shared-day/` untouched:** PASS. Confirmed absent from the 21
  changed files via `git diff --stat`.

## Re-verified against team-lead's trunk numbers

Independently reproduced myself: `tsc` clean, full `vitest` count
(exact match), `eslint` pre-existing-only, `middleware.ts` gating,
`BOARD_HEIGHT_PX` arithmetic, `.env.local` cleanup.

Relied on team-lead's trunk-level browser measurement (per this
project's own standing rule that browser verification is a trunk-level
step, not a per-worktree one, and given the explicit denial on adding
any auth bypass, minting a session token, or searching for a password
from this worktree) for: board 280×364 ratio-invariance across all four
`/review/book-states` leaf counts (the actual regression this branch
fixes), Today mount left/right pixel positions, blind-stamp
stroke-interior medians/sds, washi tape left-edge (14.7px, both modes),
book open/close/Escape/focus behaviour, Dock hrefs, and the Tuesday
test (`pair-tuesday` + `pair-empty` captures). I did not fabricate
independent confirmation of these — they are attributed to team-lead's
measurement, not claimed as mine.

## Not assessed

- **The 11pm test** — explicitly not assessed by team-lead or by any
  reviewer; night captures exist (`gate-book-night.png`,
  `audit-today-dark-verified.png`) but no one has judged "is the
  photograph the brightest thing on screen" against them.
- **The logo test and the slop test** — no reviewer produced a judgment.
- **The e2e suite** — not run. Structural `TEST_ENV` dual-sourcing
  failure (process-env alone boots, `.env.local` alone boots, both
  together fail "malformed"), pre-existing, flagged for CTO.
- **design-critic's craft/taste read** on the Book's new proportions and
  the Dock's 3-tab layout as an aesthetic — its run was interrupted
  before landing a verdict.

## Verdict rationale

Zero P0/P1 findings from three independent reviewers plus my own direct
re-verification of the highest-leverage claims (typecheck, full test
suite reproduced exactly, security-critical middleware gating,
arithmetic, and the `.env.local` cleanup after the design-critic
incident). The one P2 (`lib/session` flake) is confirmed pre-existing,
confirmed absent from this diff, and explicitly routed to a separate
follow-up rather than this gate. The load-bearing geometry and
behavioural-law gates this branch exists to fix (board ratio invariance,
no-photo-filter, no-prepared-place, Eva-first) are independently
confirmed either by my own hands or by specific, reproducible
trunk-level numbers from team-lead — not by inheriting a vague "it
works" claim. Remaining gaps (11pm, logo, slop tests; e2e suite;
design-critic's aesthetic read) are honestly declared NOT ASSESSED
rather than folded into the PASS, consistent with this project's own
precedent (Wave 1's design-critic died mid-run and was not counted as
clean) and are appropriate follow-up for the broader design-audit effort
already tracked separately, not blockers for this narrowly-scoped
geometry/bug-fix integration.

**PASS.**
