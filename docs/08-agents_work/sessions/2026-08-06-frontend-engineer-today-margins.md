---
agent: frontend-engineer
task: today-margins (bleed margin fix on Today's hero photo + sealed note)
branch: feat/today-margins (from origin/main @ 0a4148a)
qa_verdict: PENDING
tier: lite
---

- Two mechanical margin swaps per design-lead's 2026-08-06-design-lead-book-proportion.md §2, no new numbers chosen here. `ml-6 -mr-10` → `ml-12 -mr-12` on the torn-mount photo wrapper in `TodayPair.tsx` — applied to both places that literal string appeared (`HeroItem`, the solo/Tuesday state, and `PairSpread`'s lead figure, the pair state), since both wrap the identical torn-mount asset with the same margin bug; the brief named one but the fix is the same object in every Today state. The right-edge bleed itself is untouched — only the opposite margin moved, per the ruling that the bleed is correct and stays.
- Sealed note wrapper in `today/page.tsx`: `ml-3` → `ml-8`, putting the washi tape's rough end back on the table instead of being sliced by the viewport's left edge.
- `.photo` still computes `filter: none` — untouched, law holds.
- Component test attempted (jsdom + `@testing-library/react`, following the pattern in `feat/three-places`'s `Dock.test.tsx`) but dropped: `jsdom` isn't a devDependency on this branch's `package.json`/lockfile — it's added on `feat/three-places`, not yet merged. Adding a new dependency for a two-class fix is scope creep beyond "zero design decisions," so no test shipped; verified by direct code read + `tsc --noEmit` instead.
- `pnpm typecheck`: pass. `pnpm lint`: fails with the same 7 pre-existing errors / 24 warnings present on `main` before this change (confirmed via `git stash`) — none in the two files touched here.
- Browser verification NOT DONE — trunk-level step per founder ruling in DECISIONS `313fdc0`; worktrees sit behind the real password gate.
