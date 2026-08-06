---
date: 2026-08-06
role: qa-lead (second opinion)
task: wave4-integration-gate-second-opinion
branch: integration/wave4
tier: full
qa_verdict: PASS — concurring
first_verdict: docs/08-agents_work/sessions/2026-08-06-qa-lead-wave4.md (PASS, Full)
---

# QA Gate — Wave 4, second opinion

`CLAUDE.md`'s Full tier requires a second opinion. This is it. Two independent gate
agents, both **PASS**, reached separately.

**Provenance, stated because it matters:** the CEO spawned this agent believing the
first QA-Lead had stalled. It had not — it was mid-synthesis and returned PASS shortly
after. On discovering that, the CEO told this agent immediately and committed **in
advance of knowing its answer** that a BLOCK from it would stand over the existing PASS.
Two gate agents means the stricter verdict governs, or the gate is theatre. It concurred
independently.

## Verdict

**PASS · Full tier.** 21 files, +1106/−199 — auto-Full on LOC. Navigation changed and a
devDependency landed; the Full reviewer roster had already run.

## Findings — three P3, no P1, no P2

1. `components/book/__tests__/board-geometry.test.ts:7` — stale comment ("there is no
   jsdom in this project"); this diff adds it. The load-bearing clause — jsdom does not
   compute real layout — still holds, so the `react-dom/server` approach is unaffected.
2. `app/(app)/echo/__tests__/page.test.ts` — parses `error.digest`, a Next.js internal.
   Stable since Next 13, self-documenting. `vi.mock` would be more portable.
3. `apps/web/package-lock.json` — drifting beside the actively-maintained
   `pnpm-lock.yaml`. Last touched 2026-08-02; the pnpm lockfile is current through
   2026-08-06. **Untouched by this diff** — real tech debt, out of scope for this gate.

**No Linear MCP was available**, so these are recorded here rather than ticketed. CTO to
file next Linear-capable session.

## Behavioural law — all five HOLD

Most directly verified: **no prepared place.** The `/book` Echo door was **deleted
outright, not repointed** at the now-redirecting `/echo` — repointing would have produced
a search control that does not search, which the law forbids. The diff's own comment
names the law.

## Independently reproduced, not inherited

Full vitest suite — **34 files / 492 tests / 489 passed / 1 pre-existing fail / 2
skipped, an exact match** to the CEO's trunk numbers. `tsc --noEmit` clean. ESLint scoped
to the 15 changed files: **zero new violations**, with the `DatesExplorer` and
`DualClocks`/`HomeHeader`/`TonightCard` react-hooks errors confirmed **byte-identical to
`main` via `git show`**. `/echo` absent from both `PUBLIC_PATHS` and `PUBLIC_PREFIXES`
(both lists read in full). The redirect is a hardcoded literal. The fake-reply and
thinking-delay removal traced line by line. `BOARD_HEIGHT_PX = 364.4` verified by hand
against the measured 0.7692 — the 0.1% gap is rounding, not a defect. **Viewed four
committed captures directly** (`gate-today-day`, `gate-book-day`, `tuesday-pair-tuesday`,
`tuesday-pair-empty`) and confirmed the CEO's claims against them.

## NOT ASSESSED — declared, not folded in

- **semgrep did not run — the binary is not installed in this environment.** This is a
  genuine gap against the project's own Lite-and-above pipeline, not a judgement call.
  Substitute coverage came from security-engineer + code-reviewer + adversary-engineer
  manual review of the same pattern categories, zero findings — but **that is
  compensation, not equivalence, and the gap should be closed before the next Full gate.**
- The **11pm subjective walkthrough** — objective claims in the screenshots were
  spot-checked; the subjective judgement itself is out of this gate's scope.
- The **e2e Playwright `TEST_ENV` dual-sourcing failure** — structural, pre-existing,
  needs the auth-gated dev server. Flagged to CTO.
- **Pixel-precise re-measurement** of night dimming, the `?as=eva` washi reachability,
  the four-board harness render, and book focus-trap/tab-order — inherited from CEO
  measurements, corroborated by code trace and four static screenshot spot-checks, not
  re-shot pixel-by-pixel.

## Pre-existing, non-blocking

`tools/export` `ERR_MODULE_NOT_FOUND` (reproduces identically on `main`) · the
`lib/session` flake (~11%; `lib/session/` absent from this diff; did not recur in this
agent's single full-suite run) · the react-hooks eslint errors, all byte-identical to
`main` · the `package-lock.json` drift.

## Incident, self-disclosed and independently verified

Mid-audit this agent **accidentally ran `git checkout main -- .` inside the
`integration-wave4` worktree** while diffing two files. It caught it immediately via
`git status`, reverted with `git checkout HEAD -- .`, and confirmed the worktree clean
before continuing.

**The CEO verified this rather than accepting it.** `integration-wave4` HEAD is
`a6fbde6`, zero uncommitted, `git diff HEAD` empty, and the **working tree hash is
identical to the merge commit's tree**. All three fixes confirmed present in the working
tree: `BOARD_WIDTH_PX = 280`, `ml-12 -mr-12` at both sites, three dock tabs, the `/echo`
redirect, and no `/echo` href in the Dock. **Trunk intact.**

Disclosing a self-inflicted near-miss unprompted is the behaviour this project needs
more of, and it is recorded as such rather than as a fault.
