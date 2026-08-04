---
date: 2026-08-03
role: design-critic
session: design-critic-book-final
color: gray
branch: feat/book-what-came-back
commit: 30c1b68
task: final re-review of The Book after the b503700 refactor, from renders
renders: docs/08-agents_work/renders/2026-08-03-design-critic-book-final/
verdict: rework
qa_verdict: FAIL
tier: full
---

# The Book — final re-review

Rendered the real route at `30c1b68` on a live dev server. Eight viewport
widths, day and night, plus a hit-test and a 24-hour probe of `whatCameBack()`
against a scratchpad copy of `lib/`. The reviewed worktree was not modified.

## Verdict — rework

Three P1s. Two are new to this surface; one is the old defect returning in a
different shape, which is what I was asked to look for.

### P1 — the pocket is rendered, visible, and dead at the primary viewport

At 393×852 the lock renders at x 355–373, y 791.1–809.1 — fully on screen. The
dock is `<nav class="fixed inset-x-0 bottom-0 z-30 …">` at y 770–852, full
width, transparent background, `pointer-events: auto`. `elementFromPoint` at
the lock's centre returns the NAV. A real click at (364, 800.1) leaves the URL
at `/book?mode=day`. The third way in does nothing until you scroll.

It also *looks* broken: the dock pill slices the lock, leaving a half-glyph
against the pill's right edge — `book-day-dockband.png`. Because §2.1 forbids
labelling this door, there is no text to recover the meaning.

At 768×1024 the same swallow takes *"The days in order"* (row 911.2–978.4,
dock top 942, `daysTappableAtRest: false`) — two of three doors dead.

Root cause is in `components/chrome/Dock.tsx:69`, not in The Book, and it will
affect every surface. Fix: `pointer-events-none` on the `<nav>`,
`pointer-events-auto` on the inner `div.card`.

`book-day.png` · `book-day-dockband.png` · `book-day-after-lock-tap.png` ·
`book-day-w768.png` · `hit-test.mjs.txt`

### P1 — the colophon contradicts the archive it sits on top of

`BEGUN = "2026-08-02"` (`lib/fixtures/book.ts:85`). Eight of eleven photos have
`sharedDay` earlier than that — 2026-07-29, -07-30, -07-31, -08-01. On **18 of
24 hours** the page prints "BEGUN 2 AUGUST 2026" and, three lines below,
resurfaces an item left *before* that date. The shoot caught it: colophon
"BEGUN 2 AUGUST 2026", why-label "Left at this hour, in July", stamp
"Eva 6:52 pm · Adam 1:52 am" = `d0731-eva`, 31 July 2026.

This is the old defect in a new form. The count is genuinely gone — no digit on
the page except the colophon date and the stamp clocks, verified in rendered
text. But what replaced it is a date in the authoritative position that
disagrees with the content immediately beneath it, and nothing in
`book/page.tsx` derives or constrains `BEGUN` against the archive. Fix: derive
the colophon from the archive's earliest `sharedDay`, or correct the fixture
*and* add the guard — the fixture alone leaves the surface one backfilled
import away from printing the same contradiction.

`book-day.png` · `probe.spec.ts.txt`

### P1 — the edge-to-edge masthead holds at exactly one viewport width

`fontSize: clamp(3.5rem, 19.3vw, 6.5rem)` fits by **0.3px** at 393 (glyph
352.7 of measure 353). Below 393 it wraps to two lines — 320, 360, 375 and
**390** all render "THE / BOOK", 137px of masthead instead of 68px. 390 is
iPhone 12/13/14. Above, it fails the other way: at 768 and 1280 the clamp
ceilings at 104px and the glyph is 483.7 of a 608 measure — 124.3px short of
the edge that the override exists to reach.

The comment at `book/page.tsx:108-114` scopes the override to "the primary
viewport", so the narrowness is known — but the consequence at 390 is not a
slightly short masthead, it is a different page. Fix: size the masthead so it
fits the measure at the narrowest supported width, or let it wrap by design at
a chosen breakpoint rather than by accident 3px below the target.

`book-day-w320/360/375/390/393/430/768/1280.png` · `width-sweep.mjs.txt`

## P2

- **`/review/book-states` is not the surface.** States 2–4 render
  `ResurfacedItem` alone — `hasMasthead: false`, `hasColophon: false`,
  `navRows: 0`, no links. One `<hr>` on the whole review page against four on
  `/book`. The hierarchy question this surface exists to answer — does the
  resurfaced item outrank the nav rows — cannot be asked of it. State 1 is a
  hand-copied duplicate of `book/page.tsx:55-96`, not an import: `h3` not `h1`,
  wrapped in a `1px rgba(37,29,22,0.1)` border with `4px` radius the real page
  does not have, and those two border pixels are enough to wrap the masthead to
  two lines (glyph 205.5, `lines: 2`) where production renders one. Its imprint
  lands at y 847.5, below the fold, so the one thing the title page composition
  does — anchor the imprint at the foot — is not shown. A harness that diverges
  from the live route in the direction of *looking worse* will burn a reviewer's
  attention on a defect that does not ship, and hide the ones that do.
  `review-states-day.png` · `review-states-day-state1.png`
- **The real title page has still never been rendered.** `whatCameBack` returns
  null only on an empty archive (0/24 null hours; `whatCameBack(now, [])` →
  null — my earlier P1 is genuinely fixed), so the state is unreachable from the
  branch, and the only proxy for it is the diverging harness copy above.
- **`findDateMatch` never fires in production.** The archive spans 2026-07-29 →
  2026-08-02; one-year-ago targets are in 2025; no fixture photo is. All 24
  probe hours returned `reason: "hour"`. "A year ago today" — the association
  carrying P3's *"I always stop. Every time."* — is dead on the shipped
  fixtures. Worse, the harness's forced `DATE_MATCH` pairs that label with
  `d0729-eva`, five days old, so the only place it renders it renders a lie.
- **The photograph is full-bleed on mobile only.** At 393 it spans 0→393,
  `fullBleed: true`. At 768 the `-mx-8` breakout reaches 48→720 inside a 768
  viewport — 48px of paper each side, `fullBleed: false`. It reads as an
  ordinary inset card. My earlier PASS on full-bleed was measured at 393 and
  does not generalise. `book-day-w768.png`
- **The text-only branch remains unreachable in production.** 0 of 11 photos
  have zero dimensions (1200×1600 and 1200×900 only), so `hasImage` is never
  false. The 28px fix did land and renders correctly in the harness — the
  branch is designed, just unverifiable where it matters.

## What is fixed, verified in pixels

Masthead reaches the measure at 393 (0.3px short, was 78.8px). `max-h-[70dvh]`
is now real on the element — computed `max-height: 596.4px`, was `none`. The
`Search` glyph replaced `RefreshCw` on the /echo row. Colophon and why-label
now carry different ranks — 11px/600/uppercase against 13px/400/sentence case.
The count is gone and nothing counts anything. No emoji. Focus rings 2px solid
at 2px offset on all three links in both modes. Tap targets 76 / 67.2 / 58px.
Photograph unscrimmed — `filter: none`, `opacity: 1`. Nothing on the surface
reads as consumed, archived, or used up (§4.4 holds); the gap is a stamp on the
item, not a room (§3.1 holds); the default view is the resurfaced item with
chronology one tap away (the date-grid prohibition holds).

`typecheck` clean. `vitest` 286 passed, 2 skipped, 16 files.

## Worktree state

`git status` on `feat/book-what-came-back`: HEAD `30c1b68`, `git diff 30c1b68`
empty — no tracked file changed. Untracked: `apps/web/node_modules`;
`docs/08-agents_work/renders/2026-08-03-book-critic-final/` (**not mine** —
written by another process at 17:19 while this review ran); and this review's
own evidence under `renders/2026-08-03-design-critic-book-final/`. All
mutation for this review happened in a scratchpad copy of `lib/`.
