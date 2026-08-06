---
date: 2026-08-06
role: backend-engineer
task: review-door — close security audit conditions
branch: feat/review-door
worktree: .worktrees/review-door-2
tier: irreversible
qa_verdict: pending
---

# Session: review-door harden (EVALOVE-46)

`middleware.ts` untouched. Widened the review-door suite: only `"development"`
opens `/review/*` now (undefined/""/staging/"Production"/"test" all gated),
plus an allowlist check (found `/login` missing from the brief itself);
relocated to `__tests__/middleware.test.ts` + vitest glob, confirmed by running.
Added the second gate, `app/(app)/review/layout.tsx`, nesting verified. Added a
shape test (fixtures-only) for `/review/**/page.tsx`; proved it fires by
injecting then reverting a real violation. Bootstrapped a throwaway
`.env.local` and reproduced the audit's condition 4 live: no env → 500 at
middleware module-eval; with env → clean 307 to `/login`. Addendum: a real
`next build` showed both review pages prerender static by default and
`notFound()` doesn't stop Next serializing fixture content into that
artifact (`.next/server/app/review/*.html` had it verbatim, 404 status and
all) — added `export const dynamic = "force-dynamic"` to both pages,
rebuilt, confirmed the artifact directory no longer exists at all. 4
commits total, `tsc` clean, 2 red tests repo-wide (both expected/pre-existing).
