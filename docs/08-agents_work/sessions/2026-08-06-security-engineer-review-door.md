---
date: 2026-08-06
role: security-engineer
task: review-door
branch: audit-only (no branch, no worktree, no writes to source)
tier: irreversible
qa_verdict: APPROVE_WITH_CONDITIONS
---

# Review door — security audit

Audited `git show origin/main:apps/web/middleware.ts`, **not** the founder's working tree (which carries an uncommitted full no-op dev door — confirmed present, `git status` shows ` M apps/web/middleware.ts`; it is not on `origin/main` and was excluded).

No P1. The diff cannot open `/review/` in a default production build: `next build` sets `NODE_ENV` to `"production"` only when it is unset (`node_modules/next/dist/bin/next:66`) and the spread then evaluates to `[]`. Two P2s: the guard **fails open** — `NODE_ENV` unset, `"test"`, `"staging"` or `"Production"` all satisfy `!== "production"` and `next build` warns for none of them except non-standard values; and `middleware.ts` → `lib/session/token` → `lib/env` throws at module evaluation, so in the 30 of 44 worktrees with no `.env.local` (including `review-door` itself) the door opens nothing. Fix both: `=== "development"` instead of `!== "production"`, plus a `review/layout.tsx` `notFound()` guard matching `app/dev/materials/page.tsx:32`.

Verified against `NextRequest` directly, not inherited: `..` and `%2e%2e` collapse before `nextUrl.pathname`; `/review`, `/reviewX`, `/REVIEW/` all fail closed. `%2f`-encoded traversal does **not** collapse — pre-existing for `/img/`, `/api/img/`, `/_next/` in production today, out of scope here. Suite reproduced at 23/25 as claimed; four gaps listed in the return JSON. Not staged, not committed.
