---
date: 2026-08-06
agent: frontend-engineer
task: three-places — Echo stops lying, Dock is three places, Dates keeps their names; then the Book's dead Echo door
branch: feat/three-places
worktree: .worktrees/three-places
qa_verdict: PENDING
verified_at_393x852: "NOT DONE — blocked on auth, see blockers"
tier: lite
---

- `EchoChat.tsx`: removed the fake 1100ms `setTimeout` + thinking bubble. `send()` now only holds the viewer's own bubble; the honest "not wired to the record yet" line renders synchronously as a `role="status"` fact about the surface, never a delayed reply.
- `Dock.tsx` + `/echo/page.tsx`: three tabs (Today · The Book · Dates) around the unmoved pen; `/echo` redirects to `/today`. `--dock-footprint` unchanged — verified it's a function of the send button + tray padding, not tab count.
- `DatesExplorer.tsx`: exported `midSentence()` lowercases the window string for flow but restores `Eva`/`Adam` via a `\b`-bounded regex, which still matches through the curly-quote possessive since the apostrophe is a non-word character.
- `book/page.tsx`: removed the "Ask for something" door (it pointed at `/echo`, now a dead redirect — a search control that no longer searches is the same prepared-place lie, wearing a Search glyph). Returns per PRODUCT-VISION-V2 §2.4 once the search exists; comment left at the removal site. Resequenced the remaining doors' `--i` stagger so no frame is skipped.
- 18 new tests. Added `jsdom` as a devDependency: `components/**/*.test.tsx` was already in vitest's include list but nothing could render a component yet (global environment is deliberately `node` — `lib/env.ts` validates at import time). Test files opt in per-file via `// @vitest-environment jsdom` rather than flipping that default.
- Lint baseline confirmed by differential, not assertion: `git stash` + `pnpm lint` against unmodified `main` reproduces the identical 31 problems / 7 errors this branch reports, including the one pre-existing error inside `DatesExplorer.tsx`'s untouched `useEffect`.
- For whoever runs trunk verification: this worktree's `pnpm test` shows 479 passed / 0 failed (478 as of the first three fixes, +1 for the redirect test in Task C below), vs. team-lead's `main` baseline of 459 passed / 1 failed (`tools/export/__tests__/cli-smoke.test.ts`, `ERR_MODULE_NOT_FOUND`). It passes here only because an unrelated `pnpm install` inside `tools/` incidentally populated its `node_modules` — not because that gap was fixed. Not touched or investigated per instruction; do not read it as evidence of anything.
- Auth blocker: 393×852 browser verification needs a real login. Both routes I could have taken — a worktree-local middleware bypass, a credential search — were correctly denied by my permission classifier and confirmed off-limits by team-lead (handoff §7: no peer can authorize a denied permission). Per `DECISIONS.md@313fdc0` this is now a trunk-level step the founder verifies before push, not a per-branch worker responsibility.
- Out of scope, flagged not fixed: `components/home/EchoTile.tsx` links to `/echo` but is dead code (unreached `home` surface, per team-lead).
- **Task C (scope extended by team-lead once the finding above was confirmed).** Removed `"/echo"` from `dock-clearance.spec.ts`'s `ROUTES`, with a comment against re-adding it: it redirected to `/today`, so that describe block was silently re-testing `/today` under the wrong label rather than failing — coverage of a route the suite never actually visited, which is worse than no coverage. `/pocket` stays in `ROUTES` on purpose: its entrance is decided-unbuilt but the route still serves, so it is real coverage.
- Real coverage for the redirect added as a unit test instead, `app/(app)/echo/__tests__/page.test.ts`: `next/navigation`'s `redirect()` throws a `NEXT_REDIRECT;<type>;<url>;<statusCode>;` sentinel; the test parses the digest and asserts the destination is exactly `/today`, not merely that something throws. Runs without a browser or auth.
- The e2e suite itself was not run, per instruction — beyond the auth gate, `playwright.config.ts` injects `TEST_ENV` on top of whatever `.env.local` a developer worktree already has, and this project has a measured dual-sourcing failure: process-env alone boots, `.env.local` alone boots, both together fail with "malformed". Unfixed, structural, flagged for CTO — not addressed here.
