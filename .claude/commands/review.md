# /review — Code Review Pipeline

Review all changes in the current branch before merging.

## Usage
```
/review
/review [specific files or PR branch]
```

## What This Does

### Step 1 — Get Diff
Identify what changed: `git diff --name-only main...HEAD` (or specified branch).

### Step 2 — Code Reviewer
Code Reviewer reviews all changed files:
- **P1 (Must fix)**: security issues, data loss risk, broken logic, missing validation
- **P2 (Should fix)**: duplication, unclear naming, missing error handling, performance
- **P3 (Nice to have)**: style, optimization, comments

### Step 3 — Security Engineer (parallel with Step 2)
Security Engineer runs OWASP check on changed files:
- Injection vulnerabilities
- Auth/authz gaps
- Hardcoded secrets
- npm audit for new dependencies

Both run in parallel.

### Step 4 — Verdict
| Outcome | Condition |
|---------|-----------|
| **PASS** | No P1 issues, no Critical/High security findings |
| **PASS with notes** | Only P2/P3 + Medium/Low security (non-blocking) |
| **BLOCK** | Any P1 issues OR Critical/High security findings |

### Step 5 — Output
```
## Code Review — [branch name]

### P1 — Must Fix (BLOCKING)
- [file:line] — [issue] — [fix]

### P2 — Should Fix
- [file:line] — [issue]

### Security Findings
- [severity] — [file:line] — [issue]

**Verdict: PASS / BLOCK**
```

## Notes
- Only reviews files in the diff — not the whole codebase
- P2/P3 and Medium/Low security don't block merge — they're informational
- Can be run standalone or as part of `/ship`
