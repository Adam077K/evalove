---
date: 2026-08-06
agent: frontend-engineer
task: lay-probe — take/lift/lay falsification build for the making metaphor
branch: feat/lay-probe
worktree: .worktrees/lay-probe
qa_verdict: PENDING
verified_at_393x852: "NOT DONE — trunk-level (DECISIONS 313fdc0); the real verification is the founder's thumb"
tier: lite
---

- Built strictly §1–§3 of `docs/04-features/specs/making-metaphor.md`: TAKE (press ≥250ms, <10px slop, 2px rise at 120ms, commits to scale 1.05 / translateY −6 / fixed −3.5° / `SHADOW[3]→SHADOW[4]`, 1:1 finger tracking), THE BOOK SLIDES (+332px on first lift, `--dur-4`/`--ease-io`), LAY (page lifts 2px + deepens shadow, laid neighbours shift 3–5px + ≤1.5° on proximity, release settles via spring 300/30 keeping the hand's −3.5° plus Mounted's own seeded drift). Nothing else from §2 (TURN/FASTEN/WRITE, free cloth-drag, keyboard path) or persistence.
- New dev-only route `/review/lay-probe` (`page.tsx` + `LayProbe.tsx`), never linked from product surfaces — same convention as `/review/book-states`.
- Reused rather than re-derived: exported `SHADOW`, `SPRING`, `mulberry32`, `seedFromId`, `toRotation` from `Mounted.tsx` (additive, zero behaviour change to any existing caller) so the probe's lift shadow, release spring, and settle drift are the literal same values/PRNG sequence `Mounted` uses everywhere else — not a second, drifting copy.
- Scope decisions argued back rather than silently taken, all recorded in `LayProbe.tsx`'s own doc comment: TAKE only lifts a pile photograph (never re-opens a laid one — the brief's own wording), so every committed take ends in exactly one lay; the pile itself never animates — it sits static at its final y672–783 slot, and the page's own +332px slide is what closes the gap onto it (one transform, not two); no leaf-turn rail is built (there is nothing to turn to), so `touch-action: none` on the held element is what actually defends the gesture on iOS, not a rail lock.
- One real geometry caveat, flagged not hidden: the working band's extreme top-left pixel (full page width, y380) sits a few mm past the 495px/pivot(355,790) REACH circle — a pre-existing approximation in the spec's own measured numbers, not something this build introduced; the region a hand actually reaches to lay something stays inside it.
- Correctness note for whoever picks this up: reading a ref's `.current` inside JSX render now trips `react-hooks/refs` (new in this eslint config) — the held layer's first-paint position had to move from `dragRef` into render-safe state (`HeldState`), with `dragRef` reserved for the high-frequency pointermove tracking that still bypasses React entirely.
- Deliberately not built: an eased "lift" tween at the 250ms commit (spec reads as `scale 1→1.05`). A delayed rAF/effect tween racing against the SAME element's 1:1 pointermove tracking risked a visible jump if the founder starts dragging before the tween finishes; the commit is an immediate transform swap instead, which is simple and jank-free. If it reads as abrupt on device, this is the first thing to revisit.
- `pnpm typecheck`: clean. `pnpm lint`: zero errors/warnings on the changed files (all remaining repo lint errors — `react-hooks/set-state-in-effect` in five unrelated components, one `prefer-const` in `uploader.ts` — are pre-existing on `integration/wave4`, confirmed by `git status` showing them untouched). `pnpm test`: 489 passed / 1 pre-existing unrelated failure (`tools/export/__tests__/cli-smoke.test.ts` — `tools/` is a separate, never-installed workspace; not touched).
- Cleaned up a stray root `pnpm-lock.yaml` an accidental root-level `pnpm install` regenerated (the file was deleted from the repo in an earlier commit; the correct install target is `apps/web`). Not committed.
- Browser verification genuinely NOT DONE from this worktree, per standing policy — no auth bypass, token mint, or credential search attempted. Team-lead serves the branch to the founder directly.
