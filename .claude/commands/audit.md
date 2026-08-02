# /audit — Full Codebase Audit

Map the codebase and produce a structured health report.

## Usage
```
/audit
/audit [focus: security | quality | architecture | all]
```

## What This Does

### Step 1 — Codebase Mapping
CEO dispatches code-reviewer (in mapper mode) to walk the repo and update `.claude/memory/CODEBASE-MAP.md`:
- `architecture` focus: top-level structure, module boundaries, dependency graph
- `quality` focus: conventions adherence, test coverage gaps, lint debt
- `security` focus: auth boundaries, secret usage, dependency risk
- `all` (default): all focus areas

Output written to `.claude/memory/CODEBASE-MAP.md` (refreshes the in-repo map).

### Step 2 — Code Review (Quality + Tech Debt)
Code Reviewer scans entire codebase:
- P1 issues: broken logic, security holes, data loss risk
- P2 issues: tech debt, duplication, missing error handling
- P3 notes: optimization opportunities

### Step 3 — Security Engineer (OWASP)
Security Engineer runs OWASP audit on all source files:
- Authentication/authorization gaps
- Injection vulnerabilities
- Exposed secrets or misconfigured env
- Dependency vulnerabilities (npm audit)

Both Step 2 and 3 run in parallel.

### Step 4 — QA Lead Synthesizes
QA Lead aggregates all findings into prioritized report:

```
## Codebase Audit — [Date]

### Critical (Fix Now)
- [file:line] — [issue] — [fix]

### High Priority (Fix This Sprint)
- [file:line] — [issue]

### Medium Priority (Fix Next Sprint)
- [file]  — [issue]

### Low / Notes
- [observations]

### Tech Debt Summary
- [count] P1 issues
- [count] P2 issues
- [count] security findings

### Recommended Next Steps
1. [Most important action]
2. [Second action]
```

## Notes
- CODEBASE-MAP.md updated with current state after audit
- QA Lead verdict: PASS (healthy, no critical issues) / NEEDS ATTENTION (critical issues found)
- If Critical issues found: CEO recommends routing to `/fix` immediately
