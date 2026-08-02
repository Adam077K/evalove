# /name — Set Agent Session Name

Name or rename the current session. Use this to identify agents, distinguish parallel instances, and make session history readable.

## Usage
```
/name [session-name]
```

## Naming Convention

### Pattern
```
[agent-type]-[task-slug]
```

Where `task-slug` is a short kebab-case description of the current task.

### Examples by layer

**CEO:**
```
/name ceo-auth-redesign
/name ceo-scan-engine-fix
/name ceo-pricing-analysis
```

**Team Leads:**
```
/name build-auth-redesign
/name research-competitor-deep-dive
/name design-dashboard-overview
/name qa-auth-redesign
/name devops-staging-deploy
/name data-retention-metrics
/name product-scan-feature-spec
/name growth-onboarding-email
/name business-pricing-model
```

**Workers:**
```
/name backend-auth-api
/name frontend-dashboard-nav
/name database-schema-migration
/name security-auth-audit
/name test-scan-engine
```

## Rules

1. **Name every session.** Unnamed sessions are unidentifiable in history and parallel views.
2. **Name at the start** of identity_setup, right after /color.
3. **Keep names short** — under 40 characters. Task slug should be 2-4 words max.
4. **Rename mid-task if scope changes** — `/name` can be called at any time.
5. **Parallel CEOs** must have names that reflect their distinct tasks, not just instance numbers.

## Parallel CEO example
```
Worktree 1: /color gold  → /name ceo-feature-auth
Worktree 2: /color orange → /name ceo-fix-scan-engine
Worktree 3: /color teal  → /name ceo-research-competitors
```

## Combined with /color
Always set both together at session start:
```
/color purple
/name research-competitor-deep-dive
```

## Session file naming
The session name should match the session file you write at task end:
```
/name build-auth-redesign
→ writes: docs/08-agents_work/sessions/2026-04-06-build-auth-redesign.md
```
