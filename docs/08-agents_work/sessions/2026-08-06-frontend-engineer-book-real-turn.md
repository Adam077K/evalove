---
agent: frontend-engineer
task: book-real-turn
qa_verdict: PENDING
tier: full
---

- Built a genuine spine-hinged turn (turn.ts, useBookTurn.ts, BookTurnStage.tsx) replacing the ±24° scroll-snap tilt at both call sites (`/book`, `/book/days`). Hinge fixed at the gutter, arcs to 172° (matching `.cover-flap`), real front/back faces past edge-on, reusing paper-bone-v2 exactly as the cover's endpaper does.
- **Reopened the "scroll-driven, no JS" ruling, not silently.** Tried CSS-only first: an invisible scroll-snap scrubber driving `animation-timeline` on absolutely-stacked leaves via `timeline-scope`. Abandoned it — a real hinge needs leaves stacked with a fixed on-screen pivot, which is structurally incompatible with the horizontal-translate model scroll-snap requires, and the mechanism would need per-leaf named CSS timelines (`timeline-scope: all`) with no bounded-count precedent in this codebase, on a feature narrower-supported than the already-`@supports`-gated one it replaces, and untestable beyond grepping raw CSS text. Went pointer-driven JS instead, exactly as the brief allowed as a fallback.
- Found and fixed a real layout bug while building: `h-full` didn't reach BookSheet through the new stacked structure without explicit `height: 100%` on two intermediate wrappers — without it, a leaf shorter than the tallest would leave the leaf behind it visible in the gap. Regression-tested.
- WCAG 2.5.7: real Prev/Next buttons (BookTurnControls), disabled at bounds, keyboard-operable, on both pages.
- Reduced motion: `next()`/`prev()`/drag-release short-circuit to an instant `currentIndex` update before any transition starts — never waiting on a transitionend that won't fire.
- Found a pre-existing flaky test unrelated to this branch: `lib/session/__tests__/session.test.ts` "reads nothing back from a token that has been tampered with" fails intermittently (~1-in-6) on a clean `origin/main` checkout with no changes of mine present — confirmed via `git stash` + repeated runs. Not touched; flagging for whoever owns that file.
- Verified: `tsc --noEmit` clean; vitest 36 files / 518 tests / 515 passed / 1 failed (documented baseline) / 2 skipped, stable across 3+ consecutive runs; targeted eslint clean on every file I touched (`pnpm lint` itself fails on `main` already, 7 pre-existing errors in files I never touched — confirmed via `git stash`).
- Could not open the app — visual verification is genuinely PENDING, not claimed.
