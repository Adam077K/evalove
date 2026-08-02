# /build — Full Build Pipeline

Build a feature end-to-end with the full agent pipeline.

## Usage
```
/build [feature description]
```

## What This Does

### Step 1 — CEO Intake
CEO reads memory (LONG-TERM.md + DECISIONS.md), asks clarifying questions until success criteria are unambiguous, assigns complexity tier (Quick/Medium/Complex).

### Step 2 — Product Lead (if vague)
If the request is a feature idea without a spec, CEO dispatches Product Lead to write a PRD with acceptance criteria. Spec must pass completeness gate before build starts.

### Step 3 — Build Lead Plans
Build Lead explores codebase (Glob/Grep existing patterns), maps independent vs sequential tasks, assigns workers to isolated git worktrees.

Workers run in parallel where possible (max 3 at once):
- Backend Developer → API routes in `feat/[task]-api`
- Frontend Developer → UI components in `feat/[task]-ui`
- Database Engineer → Schema/migrations in `feat/[task]-db`

### Step 4 — QA Gate (Required)
QA Lead runs in parallel:
- Security Engineer: OWASP check on all changed files
- Test Engineer: coverage check on all changed code

**PASS** = proceed. **BLOCK** = workers fix issues, QA re-checks. No merge until PASS.

### Step 5 — Human Confirmation
Build Lead presents merge table showing all branches, files changed, QA status. User confirms before any merge.

### Step 6 — Merge + Memory
After confirmation: branches merged, worktrees cleaned, session summary written to `.claude/memory/sessions/`.

### Step 7 — Deploy (optional)
If `--deploy` flag: CEO dispatches DevOps Lead to deploy to staging. User confirms production.

## Abort Conditions
- QA Lead returns BLOCK with Critical/High findings → workers fix, re-check
- Worker returns BLOCKED → Build Lead re-briefs with more context or escalates to CEO
- Architectural change needed → CEO asks user for decision, resumes after

## Notes
- Quick tasks (1 file, 1 change) skip Lead layer: CEO → worker directly
- Always uses git worktrees — never touches main branch during work
- Merge table shown before any merge — no silent merges
