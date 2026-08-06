---
date: 2026-08-06
agent: frontend-engineer
task: lay-probe responsiveness — fix the founder's "laggy" verdict on phone AND web
branch: feat/lay-probe-responsiveness
worktree: .worktrees/probe-lag
qa_verdict: PENDING
verified_at_393x852: "NOT DONE — /review/* is behind the login wall pending the founder; no auth bypass attempted (project law). visual_verification/measurements both PENDING."
tier: lite
---

- Two confirmed causes fixed in `LayProbe.tsx`, both static code fixes only: (1) `RISE_START_MS` (a 120ms gate before ANY pile-tile feedback) removed — `handleDown` now starts the same rise at pointerdown (0ms), still eased over its existing 130ms CSS transition; `PRESS_MS` (250ms) unchanged, so the scroll-vs-pickup distinction stays intact. (2) The held layer's instant scale/rotate/lift pop at commit replaced with `easedHeldPose`, an exported pure function of elapsed-time-since-commit, computed inline inside `handleMove`'s own transform string (never a CSS transition or motion/react `animate` — both would fight the per-frame position write, per the file's own docblock hazard).
- Residual GPU/compositing candidates inspected by reading only (no measurement possible): `box-shadow` on the held layer is static, not animated, so under `willChange: transform` the eased scale/rotate/lift should stay compositor-only (no repaint) — reasoned from standard compositing behaviour, not measured. Up to 3 nested `isolation: isolate` contexts wrap the laid photos (`Paper.tsx` ×2 + the route's own `.isolate` div); isolation affects stacking/blend order, not layer promotion, so unlikely to be a jank source but unmeasured. `-webkit-touch-callout` confirmed present in all 6 prior locations via grep, unchanged.
- `pnpm typecheck` clean, `pnpm lint` zero errors on changed files, `pnpm test` 501 passed + 12 new + 2 pre-existing skipped, 1 pre-existing unrelated failure (`tools/export/__tests__/cli-smoke.test.ts`, missing dep in the separate `tools/` workspace — untouched, `toolchain-repair` agent's territory).
- Docblock at `LayProbe.tsx` top and inline at each change site updated; lines 56-59 (touch-action/WCAG scope) needed no change — behaviour there is untouched.
