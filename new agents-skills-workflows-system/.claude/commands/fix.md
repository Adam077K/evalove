# /fix — Bug Fix Pipeline

Fix a bug with diagnosis first, then isolated fix, then verification.

## Usage
```
/fix [bug description]
```

## What This Does

### Step 1 — CEO Intake
CEO reads memory, asks: What's the symptom? When did it start? Is it reproducible? What's the expected behavior? Assigns complexity (Quick fix vs. needs diagnosis).

### Step 2 — Diagnosis (if complex)
For non-obvious bugs, CEO dispatches CTO to spawn the right engineer with diagnosis-first brief:
- backend-engineer (API / server logic / Inngest)
- frontend-engineer (React / Tailwind / Shadcn / hydration)
- database-engineer (Supabase / migration / RLS / query)
- ai-engineer (LLM call / prompt / eval / agent execution)
- The engineer follows the systematic-debugging skill: reproduce → falsifiable hypothesis → binary search → evidence → root cause
- Returns root cause analysis in `decisions_made` + writes notes to a debug log under `.claude/memory/sessions/`

For obvious bugs (typo, wrong variable): skip to Step 3.

### Step 3 — CTO dispatches the fix
CTO (or the diagnosing engineer above, in continuation) ships the fix:
- Files to change
- Worktree: `feat/fix-[bug-name]`
- Success criteria: "Bug no longer reproducible"

### Step 4 — QA Gate
QA Lead checks:
- Does the fix break anything else? (test coverage)
- Did the fix introduce any security issues?

PASS = proceed. BLOCK = fix the new issues first.

### Step 5 — Human Confirmation + Merge
Build Lead presents: what was fixed, what changed, QA PASS. User confirms merge.

## Abort Conditions
- Root cause still unknown after diagnosing engineer → CEO asks user for more context
- Fix requires architectural change → CEO asks user for decision
- QA BLOCK after fix → fix the new issues before merging

## Notes
- Diagnosing engineer keeps a structured note in `.claude/memory/sessions/` so context can be re-loaded across sessions
- Always creates a worktree — never hacks directly on main
- Reproduce first (write a failing test or capture exact repro steps), then fix
- See the `systematic-debugging` skill for the hypothesis-driven method
