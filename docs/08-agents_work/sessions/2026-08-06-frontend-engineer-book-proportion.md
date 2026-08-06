---
date: 2026-08-06
role: frontend-engineer
task: book-proportion-and-blind-stamp
status: COMPLETE
qa_verdict: N/A — pending QA-Lead review
tier: lite
branch: feat/book-proportion
worktree: .worktrees/book-proportion
verified_at_393x852: "NOT DONE — trunk-level per DECISIONS 313fdc0"
---

# Book proportion, fore-edge, blind stamp — implementation

Implemented the measured spec at
`docs/08-agents_work/sessions/2026-08-06-design-lead-book-proportion.md`
§1, §3, §4. Zero design decisions made — every number came from the spec.

## What changed

**Board geometry (spec §1).** `BookCover.tsx` now exports
`BOARD_WIDTH_PX = 280`, `BOARD_RATIO = 189/246 ≈ 0.7683`,
`BOARD_HEIGHT_PX = 364.4` as literal constants, applied as explicit
inline `width`/`height` style on `CoverBoard` in both the closed cover
(`BookCover`) and the open flap (`BookObject`). Previously the board's
width was `flex-1` against a fixed `h-[min(540px,58dvh)]` row, so the
fore-edge's growth subtracted directly from the board (measured:
board = 406 − foreEdge, drifting from 378×494 at 6 leaves toward
274×494 at the old 132px ceiling). Fixed at the source now — the
board's own size is never again a function of a sibling or the
viewport.

**Bleed removed (spec §1, §4).** Found and moved all 5 coupled sites:
`BookCover`'s `-ml-9` (→ `BOOK_LEFT_MARGIN_PX = 34` on the outer
wrapper), `CoverBoard`'s compensating `pl-9` on both text blocks (→
symmetric `px-4`, no compensation needed), `BookObject`'s open-pose
back-board `-ml-9` (→ `marginLeft: BOOK_LEFT_MARGIN_PX`) and its
pages-wrapper `pl-9` (→ removed, no bleed to escape), and the flap's
`left: -36` / `width: calc(100% + ...)` (→ `left: BOOK_LEFT_MARGIN_PX`,
`width: BOARD_WIDTH_PX`). The 2 height sites
(`h-[min(540px,58dvh)]` on the closed board, `height: "min(540px,
58dvh)"` on the flap) both became `BOARD_HEIGHT_PX`. `ForeEdge` needed
no explicit height change — it stretches to the board's now-definite
height via the existing `items-stretch` flex row.

**Fore-edge curve (spec §1).** `foreEdgePx` rewritten from the old
linear-then-compressed formula (12 → 132px ceiling) to
`round(min(12 + 7·ln(1 + leaves), 60))`. Verified against the spec's
own numbers: 0 → 12, 6 → 26, 1095 → 60 (ceiling).

**Ribbon (spec §4).** Closed-cover ribbon: `w-[83px]` → `w-[62px]`,
`bottom: -150` → `bottom: -111`, rescaling it to the 364px board (was
tuned to the old 494px board; unscaled it would put the exit at 24%
instead of the measured 52%). The open-pose "held page" ribbon
(`w-[68px]`, `bottom: -26`, `right: "2%"`) was untouched — it's sized
relative to the page block, not the board, and the spec doesn't
regulate it.

**Harness (spec §4).** `/review/book-states` State 1c: `leafCount`
`200` → `1095`. Under the new curve 200 leaves yields only 49px of
fore-edge (below the old 132px behavior it was written to exercise);
1095 clears the new 60px ceiling. Test-integrity fix.

**Blind stamp (spec §3).** `EMBOSS` alpha 0.30 → 0.62, `EMBOSS_SMALL`
alpha 0.44 → 0.68 (the load-bearing fill change — occludes the weave
inside the glyph instead of letting it show through at near-full
strength). Colophon: 13px → 16px, `font-medium` → `font-semibold`
(600), tracking 0.05em → 0.08em, face kept as Fraunces italic
(unchanged, per LAW §2). Also attempted the second-priority light-
direction fix: inverted the emboss highlight/shade offsets from
`0 1px 0` / `0 -1px 0` (light-from-above) to `1px -1px 0` / `-1px 1px
0` (light-from-lower-left, matching `LAMPLIGHT`/`LampShade`'s actual
position), reusing the existing 1px/2px magnitude convention rather
than inventing new numbers — the spec gave direction, not a value, and
ranked this second; the fill (priority one) shipped regardless.

## Tests added

`apps/web/components/book/__tests__/board-geometry.test.ts` — 11
tests, all passing:
- Board ratio invariance at `leafCount` 0, 6, 1095, via
  `react-dom/server`'s `renderToStaticMarkup` (vitest here runs
  `environment: "node"`, no jsdom is installed, and jsdom doesn't
  compute real layout regardless — `offsetWidth`/`offsetHeight` are
  only measurable in a real browser). This renders the actual
  component and reads its emitted inline style, which exercises the
  precise regression class the bug was.
- `foreEdgePx` as a pure function: 12px floor, 26px at 6 leaves, 60px
  ceiling at 1095 and arbitrarily beyond, monotonicity.

## Verification

- `pnpm typecheck`: pass.
- `pnpm lint`: the repo-wide run fails on 7 pre-existing errors in
  files this task never touched (`components/home/DualClocks.tsx`,
  `HomeHeader.tsx`, `TonightCard.tsx`, `lib/viewer.ts`,
  `lib/outbox/uploader.ts`) — confirmed via `git diff --stat main`
  that none of them are part of this branch's diff. `npx eslint` run
  scoped to the 4 files this task changed/added is clean.
- `pnpm vitest run`: 469 passed, 2 pre-existing failures unrelated to
  this task (`tools/export/__tests__/cli-smoke.test.ts` — missing
  `@supabase/supabase-js` in `tools/export`'s own deps;
  `lib/session/__tests__/session.test.ts` — a tampered-token test).
  The new `board-geometry.test.ts` file: 11/11 passing in isolation.
- **`verified_at_393x852: "NOT DONE — trunk-level per DECISIONS
  313fdc0"`** — browser verification of the acceptance gates in spec
  §5 (closed-cover bounding box, ratio invariance via real
  `offsetWidth`/`offsetHeight`, fore-edge on-screen at 1095 leaves,
  stamp pixel statistics, open/close/turn/Escape/focus) was not
  performed from this worktree, per the founder's ruling that browser
  verification is a trunk-level step, not per-branch. No bypass was
  added, sought, or offered — none was needed for this task.

## Files changed

- `apps/web/components/book/BookCover.tsx`
- `apps/web/components/book/BookObject.tsx`
- `apps/web/app/(app)/review/book-states/page.tsx`
- `apps/web/components/book/__tests__/board-geometry.test.ts` (new)

## Not done, deliberately

Today's bleed/margin fix and washi-tape fix (spec §2) were out of this
task's explicit scope (the brief cited only §1, §3, §4) and were not
touched.
