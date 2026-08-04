---
date: 2026-08-03
role: devops-engineer
session: devops-archive-pnpm-visibility
color: red
tier: irreversible
branch: feat/archive-export-mirror
head_sha: a53de0c5740f95da26cea099e9f2f0650a601e98
qa_verdict: N/A — corrective devops-only commits, no new feature; QA-Lead PASS required before merge
---

# devops-archive-pnpm-visibility — Session Close-out

## Task

Two QA-Lead-flagged must-fix items on `.github/workflows/nightly-archive.yml`
in the `feat/archive-export-mirror` branch (base: 50294ab). Tier: IRREVERSIBLE
(workflow file). Four commits required: P0 pnpm fix, P1 visibility fix,
DECISIONS.md, session file.

## P0 — pnpm/action-setup@v4 (commit 5c178a7)

**Problem:** Step 3 of the workflow ran `pnpm install --frozen-lockfile` inside
`tools/` but no `pnpm` binary was installed on the runner. Every scheduled
run (02:00 UTC nightly) would have failed at step 3, before the keep-alive
or the upload could execute.

**Fix:** Inserted `pnpm/action-setup@v4` (version: 9, matching `tools/pnpm-lock.yaml`
lockfileVersion 9.0) as a new step before `actions/setup-node@v4`. Updated
the Node.js setup step to add `cache: "pnpm"` and `cache-dependency-path:
tools/pnpm-lock.yaml`.

**Scope boundary enforced:** `apps/web/` here uses npm (`package-lock.json`).
Only `tools/` uses pnpm. Therefore `cache-dependency-path` lists only
`tools/pnpm-lock.yaml`. The `apps/web` migration to pnpm is `feat/ci-floor`'s
scope — when ci-floor rebases onto this tip, its patch flips `apps/web`'s
install to `pnpm install` and extends the cache list. Not this branch's
responsibility.

## P1 — Honest visibility on keep-alive (commit 29c873b)

**Problem:** The inline comment above the keep-alive step (step 6) claimed:
"exit 1 renders amber (failed-but-tolerated) in the Actions UI: the archive
still runs, the founder sees a signal that the secret is missing." This claim
is FALSE. Under `continue-on-error: true`, GitHub sets `steps.<id>.outcome=failure`
but `conclusion=success` — the job run appears green in the run list. There is
no amber in the UI. The founder sees no signal from the run list alone.

**Three surgical edits made:**

1. **Comment corrected** (false amber claim replaced): The block now accurately
   states that `continue-on-error: true` yields `conclusion=success` and a
   green run. The founder-visible signal is via `::warning::` annotations
   (see below), which surface in the run summary — where RUNBOOK §3 actually
   directs the founder.

2. **Missing-secret path:** Replaced the plain `echo "WARNING: ..."` with:
   `echo "::warning::SUPABASE_ANON_KEY not set — keep-alive did not fire; the 7-day pause timer was not reset"`
   This surfaces as a yellow annotation in the Actions run summary.

3. **5xx/timeout path:** Replaced the plain `echo "WARNING: ..."` with:
   `echo "::warning::keep-alive: HTTP $HTTP_CODE — 5xx or timeout. Activity status UNKNOWN per Supabase docs. Founder review warranted."`
   Same mechanism — yellow annotation in the run summary.

4. **Success path:** Replaced the bare echo with:
   `echo "keep-alive: PostgREST responded HTTP $HTTP_CODE at $(date -u +%FT%TZ) — activity registered" | tee -a "$GITHUB_STEP_SUMMARY"`
   The `tee -a "$GITHUB_STEP_SUMMARY"` writes the positive artifact to the
   step summary Markdown. This satisfies the DECISIONS.md fail-open rule:
   "a check whose absence means all clear is fail-open; require a positive
   artifact." A healthy run now produces a visible, timestamped confirmation
   in the job summary — not just the absence of a warning.

## Canonical Workflow Ruling (commit a53de0c)

CTO ruling (2026-08-03, recorded in DECISIONS.md):
- `feat/archive-export-mirror` OWNS `.github/workflows/nightly-archive.yml`.
- Merge order: archive-export-mirror merges first; `feat/ci-floor` rebases onto
  this tip.
- ci-floor's workflow patch is the only place the apps/web npm-to-pnpm migration
  belongs.

## Founder-Visible Signal Path (before and after)

Before: keep-alive failure was silent in the run list (green run even on exit 1
under continue-on-error). Founder could only detect it by clicking into the step
log. RUNBOOK §3 points to the run summary, not the step log.

After: abnormal paths emit `::warning::` annotations that appear in the run
summary as yellow banners. Normal path writes a timestamped positive artifact
to `$GITHUB_STEP_SUMMARY`. RUNBOOK §3 now works as documented.

## Verification

- YAML syntax validated via `python3 -c "import yaml; yaml.safe_load(...)"` after
  each write — passed.
- No secret literals in workflow or any tracked file.
- No `purgePhoto` reference in any changed file.
- Working tree clean after all four commits.
- Branch ref advanced: `feat/archive-export-mirror` now at `a53de0c`.
