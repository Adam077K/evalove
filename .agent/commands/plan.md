# /plan — Sprint / Feature Planning

Plan a feature or sprint with the full agent team.

## Usage
```
/plan [feature or sprint description]
```

## What This Does

### Step 1 — CEO Intake
CEO reads LONG-TERM.md + DECISIONS.md, asks clarifying questions:
- What are we trying to accomplish?
- What's the deadline or priority?
- Are there existing specs or prior decisions to honor?
- What complexity level: Quick / Medium / Complex?

### Step 2 — Product Lead (if feature is vague)
If the request is an idea without a spec, CEO dispatches Product Lead to write a PRD first:
- Problem validation
- RICE scoring
- PRD with acceptance criteria written to `.claude/memory/specs/[name].md`

### Step 3 — Technical Breakdown
Build Lead explores codebase and produces:
- Task list with assigned workers
- Wave ordering (parallel where possible, sequential where dependencies exist)
- Worktree names for each task
- Estimated complexity (S/M/L per task)

### Step 4 — Plan Output

```
## Plan: [Feature Name]

### Complexity: Medium

### Tasks
Wave 1 (parallel):
- Backend Developer: [task] → worktree: feat/[name]-api
- Database Engineer: [task] → worktree: feat/[name]-db

Wave 2 (after wave 1):
- Frontend Developer: [task] → worktree: feat/[name]-ui

### QA: Security Engineer + Test Engineer (after wave 2)
### Merge: Human confirmation required

### Estimated total: [S/M/L]
```

### Step 5 — Start?
CEO asks: "Ready to start? I'll kick off `/build [feature]` or you can review the plan first."

## Notes
- Plan is not automatically executed — user decides when to start
- Build Lead does the codebase exploration, not CEO
- If PRD was written: it's saved to `.claude/memory/specs/` for reference
