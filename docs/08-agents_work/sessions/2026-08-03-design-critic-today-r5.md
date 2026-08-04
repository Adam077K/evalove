---
role: design-critic
task: today-the-pair
round: 5
date: 2026-08-03
branch: feat/today-the-pair
commit: f869443
verdict: rework
qa_verdict: FAIL
tier: full
renders: docs/08-agents_work/renders/2026-08-03-two-places/80-critic-*.png … 97-critic-*.png
---

# Today, the pair — round 5

Rendered from the running branch at `localhost:3312` (dev server serving
`.worktrees/today-pair/apps/web`, disk state = `f869443`), 393×852 at dsf 3,
viewport captures only, day and night, hydration settled. Session minted against
the worktree's own `SESSION_SECRET` — `/today` is behind `middleware.ts` and an
unauthenticated capture measures the login page, which is how the first pass of
this review went wrong before it was caught.

The committed renders `70`–`79` were **not** used as evidence. Every claim below
is a computed-style or geometry read on the live surface, or a render I took.

## Verdict: rework

Four of my five prior P1s are properly closed, and three of them are closed on
the *surface*, not in the diff — I checked by scanning every element rather than
by grep. The four properties the worker claims all hold under measurement.

Two P1s remain, both in the pair's own geometry, and **one of them is a
regression introduced by the fix to my own prior P1 #5**: making the pair
full-bleed also full-bled the two meta lines, so type now sits at x=0.0. The
other only appears on the device the app is designed for and only in the state
the brief's own Tuesday test asks for.

## What lands

1. **Full bleed is real.** Grid measures `x=0 w=393` in a 393 viewport, `gap
   2px`. Prior P1 #5 closed. `80-critic-today-day.png`.
2. **No card-shaped object anywhere in `<main>`.** Every element ≥8×8 scanned
   for opaque background, box-shadow, border-radius, ≥2 borders, outline, or
   background-image: **zero hits**, day and night. This is the check the earlier
   "no card class in the diff" answered wrongly; it is now answered on the
   surface. Prior P1 #3 closed.
3. **The bare-paper empty side holds.** `region`, `grid`, column, and photo-area
   div are all `background-color: rgba(0,0,0,0)`, `background-image: none`,
   `filter: none`, no border, no outline, no shadow — both modes. The canvas is
   `body` (`#F8F5F1` / `#1E1A17`). `94-critic-one-posted-empty-side.png`.
4. **Hairline at the photograph's base under both columns.** `x=0 w=195.5` and
   `x=197.5 w=195.5`, both at `y=260.7`, 1px, `rgba(37,29,22,0.1)` day →
   `rgba(237,231,224,0.11)` night. It gets quieter at night, not louder.
5. **The neither-posted collapse.** Grid height 31px, two children per column
   (hairline + meta line), no photograph-shaped space, no box, no indicator.
   `87-critic-state-none-day.png`, `93-critic-neither-collapse.png`.
6. **First paint, JS disabled.** Real text, both `<img>` `complete: true`, zero
   skeleton/shimmer/pulse nodes. `88-critic-firstpaint-nojs.png`.
7. **The dock goes somewhere real.** `/today` `/book` `/dates` `/echo` `/send`
   all return 200 with real content, no 404 text; `/today` carries
   `aria-current="page"` and the ink pill; every target ≥44×44. Prior P1 #1
   closed, including `LoginForm.tsx:33` and `middleware.ts:83`.
8. **Banned copy gone from the surface.** Body text carries no "waiting", no
   sealed note, no tonight tile.
9. **The rhythm is the specced one**, not the flat 20px: `0 / 32px / 40px`
   between sections, with `pt-4` and `pt-[1.125rem]` under each rule.
10. **Focus ring on the doorway:** `2px solid rgb(25,21,18)` at `2px` offset on
    a 353×239 target. `90-critic-doorway-focus.png`.
11. **Reduced motion** removes `animation` and `transition` wholesale
    (`globals.css:885`); the pair never animated in either case
    (`animationName: none`, `opacity: 1`).

## P1

### 1. On a no-photograph day the pair is hidden behind the status bar

`app/(app)/today/page.tsx:46` — `-mt-[max(1.5rem,env(safe-area-inset-top))]` is
unconditional, and it is applied to the pair *wrapper* rather than to the
photograph.

The layout's `pt-[max(1.5rem,env(safe-area-inset-top))]` and this negative margin
cancel exactly, so the pair's top edge lands at viewport `y=0` — which, with
`viewportFit: "cover"` (`app/layout.tsx:18`), is the physical top of the display.
That is correct and intended while a photograph occupies that band. When neither
has posted, the pair is 31px tall, and with a 59px top inset the hairline
(`y 0→1`) and both clock lines (`y 11→31`) are **entirely inside the status-bar
band**. The two clocks are the only thing the pair still carries on a
photograph-less day, and on the device they are invisible.

Evidence: `95-critic-tuesday-no-photo-day/night.png` (real surface, fixture date
moved to a day absent from `SHARED_DAYS` — **in a scratchpad copy of the app; the
reviewed worktree was not touched**), and `97-critic-safearea-tuesday.png`, which
emulates `env(safe-area-inset-top: 59px)` by browser-side style injection and
draws the covered band. Measured with the inset applied: `regionTop 0`,
`regionH 31`, meta line `top 11 → bottom 31`.

This is the brief's own Tuesday test (`BUILD-THE-TWO-PLACES.md` §6) failing in a
state `/review/today-pair` cannot show, because there the pair is not the first
element and carries no negative margin.

**Fix.** Make the opt-out conditional on a photograph existing. `TodayPairContent`
already computes `hasAny`; the page does not know it. Cheapest correct move: let
the pair own its own bleed-up — put `-mt-[max(1.5rem,env(safe-area-inset-top))]`
on the grid inside `TodayPairContent`, gated on `showPhotoArea`, and delete the
wrapper `<div>` at `page.tsx:46`.

### 2. The meta line's type is welded to the screen edge

`components/home/TodayPair.tsx:104` — `-mx-5 md:-mx-8` breaks the whole column
out of the layout padding, not just the photograph. Measured at 393:

| state | Eva's meta line, left edge of first glyph | Adam's |
|---|---|---|
| one posted (the live `/today`) | **x = 0.0** | x = 207.5 |
| neither posted | **x = 0.0** | x = 197.5 |
| both posted | x = 10.0, with the 2px `edge-eva` rule at **x = 0–2** | x = 207.5 |

Every other text run on the surface sits at x ≥ 20 — the caption at 34, the
window sentence and the doorway label at 20. So one line of type on the app's
primary surface touches the bezel while everything around it is inset 20px, and
in the both-posted state Eva's 2px authorship mark is flush to the display edge
and reads as a screen artifact, while Adam's identical mark has paper on both
sides. The founder rule puts Eva's side first; this is the one that gets
degraded.

Renders: `91-critic-meta-left-edge-day.png` and `-night.png` (crop, the "E" of
"Eva" starts at pixel 0), `92-critic-both-posted-edge-at-screen-edge.png`,
`93-critic-neither-collapse.png`.

The brief asked for **one element** to go full-bleed (§4 move 1) — the
photograph. The meta row was not in scope.

**Fix.** Bleed the photograph only. Keep `-mx-5 md:-mx-8` on the grid and add
`px-5 md:px-8` back onto the hairline and the meta `<p>` inside each column; or
move the negative margin off the grid and onto the `aspect-[3/4]` div. Either
restores the 20px inset for type while the photographs still reach the edges.

## Confirmed, not counted — the window sentence (B12)

Still wrong on this branch, unchanged. At capture the surface printed **"Eva's
lunch break"** in `type-title` directly below its own clock reading **"Eva ·
8:23 am"** — Eva is `America/New_York`, and `WINDOW_STRINGS.w4` is a lunch-break
string. The two statements contradict each other 350px apart.
`80-critic-today-day.png`.

Tracked as B12 under a separate brief. **Not reported as a new finding and not
driving the verdict**, per the round-5 brief.

## P2

- **`SealedCard.tsx` and `TonightCard.tsx` are now dead.** Nothing imports them —
  the only remaining mention is the comment at `today/page.tsx:23`. They still
  carry the `.card` class and the banned "waiting" copy (`SealedCard.tsx:156`).
  Delete them, or one re-import re-lands two of the P1s I raised in round 1.
- **The photograph loses its top 59px to the status bar on device** — 23% of each
  portrait, permanently, with nothing above it to push the subject clear. This
  follows from a decided direction ("open lands directly on the newest thing,
  full bleed"), so it is Design-Lead's call, not a defect.
  `96-critic-safearea-one-posted.png`.
- **The doorway's link is styled as a label.** "THE BOOK ↗" and the
  non-interactive why-label "LEFT AT THIS HOUR, IN JULY" are both
  `type-micro text-mute` on one baseline; the only affordance is a 12px arrow.
- **The doorway's 44/56 row leaves a large void.** A one-line caption sits beside
  a 155×207 thumbnail, leaving roughly 200×160 of empty paper. On the Tuesday day
  it is the whole bottom half of the screen. Weakest composition on the surface.
- **Stale comment:** `Dock.tsx:29` still says "The pocket is behind its lock at
  the foot of Today". This branch removed the pocket lock.

## Method notes

- **Nothing was edited in the reviewed worktree.** `git status` on
  `.worktrees/today-pair` at close: source tree clean at `f869443`; untracked are
  `apps/web/node_modules` (pre-existing) and the 22 `*-critic-*.png` renders this
  review produced. The Tuesday fixture change and the safe-area emulation both
  live in the scratchpad.
- Two renders are labelled as emulations rather than device captures:
  `96`/`97` inject `env(safe-area-inset-top: 59px)` as CSS because headless
  Chromium reports 0. The arithmetic is deterministic from
  `max(1.5rem, env(safe-area-inset-top))` and is stated, not hidden — the lesson
  from round 1's `COMPOSITED` renders.
- Renders `70`–`79` from the build session were treated as claims and were not
  used to support any finding.
