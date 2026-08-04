---
date: 2026-08-04
role: qa-lead
task: wave-0-foundation QA gate
branch: feat/wave-0-foundation
head: a5e4f7f
tier: Full
verdict: PASS
qa_verdict: PASS
reviewers_spawned: [qa-lead-direct, code-reviewer, security-engineer]
---

Full-tier QA gate on Wave 0 material foundation. 63 files, 1177 insertions / 207 deletions from
main (including the two-commit re-submission). Diff surface verified from repo root: nothing
under lib/, no secrets, no external fetches.

BLOCK cycle: one BLOCK issued (HEAD 7d0408c) on Pinned.tsx lamp curve hardcoding (P1). Re-
submission (HEAD a5e4f7f, +27/-9) addressed both items. PASS issued on re-submission.

Eight mandatory checklist items — all CLEAR:
1. SealedCard.tsx: untouched (no diff).
2. lib/: untouched (no diff).
3. .env.local: not tracked.
4. Middleware: no changes; no leftover allowlist or shoot script.
5. prefers-reduced-motion: full removal in globals.css (@media query: animation/transition
   none !important) and Mounted.tsx (useReducedMotion() renders static div). Code-verified;
   no screenshot evidence — add OS-level verification to Wave 1 acceptance.
6. .photo: filter none. .is-away .photo blur is privacy-veil, not night adaptation.
7. Accessibility: ink 8.55:1, mute 4.68:1 (canvas), danger 4.66:1 (canvas) — all WCAG AA.
8. TypeScript: sw.ts and lib/data errors reproduce on main; no new errors introduced.

P1 resolved: --lamp-brightness-drop (0.27) and --lamp-sepia-saturation (0.22) now live in
:root beside --lamp-dim. @utility under-lamp reads both bare (CSS context; :root always
applies). Pinned.tsx reads both with literal fallbacks (inline style context; defensive for
pre-stylesheet render). Asymmetry is correct, not a defect.

P3 resolved: /dev/materials calls notFound() in NODE_ENV === "production". Middleware already
walls the route (deny-by-default, verified); this is hygiene. Correct call.

Open (not blocking):
- P2: Night appearance of dock/login/echo/today changed by ~140-line CSS rewrite. CEO-accepted
  (D1), documented in HAND-FORWARD. Hard gate on Wave 1 — all four surfaces must be walked at
  night before those screens merge.
- P3: Taped variant-to-asset naming (houndstooth → ochre-dots, kraft → terracotta). Fix when
  full 12-pattern tape set arrives.
- P3: prefers-reduced-motion has no screenshot evidence. Wave 1 acceptance checklist item.
