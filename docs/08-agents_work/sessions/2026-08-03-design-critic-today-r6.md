---
role: design-critic
task: today-the-pair
round: 6
date: 2026-08-03
branch: feat/today-the-pair
commit: 614b6b7
verdict: rework
qa_verdict: FAIL
tier: full
renders: docs/08-agents_work/renders/2026-08-03-two-places/1*-r6-*.png
---

# Today, the pair — round 6

Rendered from the running branch at `localhost:3312` (dev server serving
`.worktrees/today-pair/apps/web`, disk state = `614b6b7`), 393×852 at dsf 3,
day and night, hydration settled. Session minted against the worktree's own
`SESSION_SECRET`; every capture returned `status 200` at `/today`, not the
login page.

The worker's renders `80`–`86` were **not** used as evidence. Every number
below is a computed-style or geometry read I took on the live surface.

## Verdict: rework

**Both round-5 P1s are closed, and both are closed on the surface rather than
in the diff.** The Tuesday test passes. Nothing on the pair touches the bezel.
The photographs still reach `x=0 w=393`.

One new P1 stands in the way, and it is the same class of failure the round-6
brief asked me to look for: the fix for P1-2 moved the *type* in by 20px and
left the *rule above it* at the bezel, so on a no-photograph day the pair's
hairline no longer shares an edge with the line it heads, or with any other
rule on the surface. The worker attempted exactly this correction and the
mechanism chosen — `px-5` on a `border-t` — does nothing. Padding cannot inset
a border.

## Round-5 P1s — both closed

### P1-1, the Tuesday test. CLOSED.

`hasAny` gates the negative margin, and the gate holds in the state that
matters.

| surface | `hasAny` | grid class carries `-mt-` | computed `margin-top` |
|---|---|---|---|
| `/today`, one posted | true | yes | `-24px` |
| `/review` both posted | true | yes | `-24px` |
| `/review` neither posted | false | **no** | **`0px`** |

On the no-photograph day, with a 59px inset applied, measured:
`main padding-top 59px`, `grid margin-top 0px`, `grid y=59`, hairlines `y=59`,
both clock lines `y 70 → 90`. Both are fully below the status-bar band. At
round 5 the same state measured `regionTop 0, regionH 31` — entirely inside it.

`112-r6-EMULATED-inset59-tuesday-day.png`, `113-…-night.png`,
`110-r6-tuesday-nophoto-day.png`, `111-r6-tuesday-top-night.png`.

### P1-2, the meta inset. CLOSED.

`mx-5` on the `<p>` was the right instrument — it moves the element's box, and
therefore its `border-left`, which is what the 2px authorship mark is. Measured
first-glyph and mark positions at 393:

| state | Eva mark | Eva glyph | Adam mark | Adam glyph |
|---|---|---|---|---|
| one posted (live `/today`) | — (no photo, no ink) | **20.0** | **217.5** | 227.5 |
| both posted | **20.0** | 30.0 | **217.5** | 227.5 |
| neither posted | — | **20.0** | — | 217.5 |

At round 5 the same cells read `x=0.0`, `x=0.0`, and a 2px `edge-eva` rule at
`x=0–2`. Nothing on the pair now sits at the bezel, in any state, in either
mode. Eva's mark and Adam's mark are each inset 20px from their own
photograph's left edge — symmetric, and the founder-rule side is no longer the
degraded one.

`101-r6-meta-inset-day.png`, `130-r6-bothposted-day.png`.

### The full bleed survived the fix

The thing the brief told me to guard. Measured on the both-posted state:
`img[0] x=0 w=195.5`, `img[1] x=197.5 w=195.5`, grid `x=0 w=393`, `gap 2px`.
The photographs still run bezel to bezel. `130-r6-bothposted-day.png`.

## P1

### 1. The pair's hairline is still welded to the bezel, and the fix for it is a no-op

`components/home/TodayPair.tsx:186`

```
<div className="border-t border-line px-5 md:px-8" aria-hidden="true" />
```

`px-5` does not inset a `border-top`. Horizontal padding moves the *content*
box inward; the top border paints across the whole border box, whose width is
unchanged. Measured, day and night, in all three states:

| element | padding-left | painted extent |
|---|---|---|
| pair hairline, Eva column | `20px` | **`x=0 → 195.5`** |
| pair hairline, Adam column | `20px` | **`x=197.5 → 393`** |
| window-sentence rule | — | `x=20 → 373` |
| doorway rule | — | `x=20 → 373` |

This is the worker's own reasoning applied to the wrong element. The commit
message states the case correctly for the `<p>` — "padding moves content inside
a border, margin moves the element's box *including* its border" — and then
reaches for padding on the one element where only margin could work. The code
comment at `TodayPair.tsx:184-185` asserts the hairline now "respects the page
grid"; it does not, and that assertion is the kind of thing that gets copied.

**Where it shows.** In the two states that carry a photograph the full-bleed
rule is correct: it is the base of a full-bleed photograph and should share its
width. I passed it on that ground at round 5 and I am not re-opening it.

It shows on the **no-photograph day**, where there is no photograph for the
rule to belong to. There the pair's rule is the first mark on the screen, and
it runs bezel to bezel, **broken by a 2px notch at x=195.5–197.5** — the photo
gutter, with no photographs to explain it — while the two clock lines beneath
it are inset 20px and the two rules below it are inset 20px. Three rules on one
screen, two different left edges, 63px apart. At night the rule reads brighter
against the dark canvas and the notch is plainer.

Renders: `130-r6-neither-day.png` (the notch and the 20px overhang, unmistakable
at this crop), `111-r6-tuesday-top-night.png` (all three rules in one frame —
top one bezel-to-bezel and notched, the two below inset), `110-r6-tuesday-nophoto-day.png`.

Note the round-5 sequence: at round 5 rule and type both sat at `x=0`, so they
at least agreed with each other. The round-6 fix moved the type and left the
rule, which is the same shape of regression the full-bleed fix caused at round
5 — a criterion satisfied, the thing beside it degraded.

**Fix.** Drop `px-5 md:px-8` (it does nothing) and inset with margin, gated the
same way the negative top margin now is — the rule belongs to the photograph
when there is one, and to the meta line when there is not:

```tsx
<div
  className={[
    "border-t border-line",
    showPhotoArea ? "" : "mx-5 md:mx-8",
  ].filter(Boolean).join(" ")}
  aria-hidden="true"
/>
```

That yields, on a no-photograph day, two rules at `x=20→175.5` and
`x=217.5→373`, each sharing its column's left edge with its own clock line.

**Stronger option, Design-Lead's call, not mine.** In the neither-posted state
the pair is two clock lines and nothing else, and two short rules with a 42px
break in the middle is still an odd object. One continuous rule at `x=20→373`
above both clock lines would read as "the pair collapsed to two clocks" rather
than as two damaged columns. That means hoisting the rule out of `PairColumn`
onto the grid for the `!hasAny` branch — a structural change, so I am flagging
it rather than prescribing it.

## P2

1. **The rule lands flush against the status bar on a no-photograph day.** With
   a 59px inset the pair's hairline sits at exactly `y=59` — the first pixel row
   below the band, zero clearance. Even once it is inset horizontally it will
   read as the status bar's own bottom border rather than as a mark on paper.
   Worth asking whether the rule should exist at all when `hasAny` is false: its
   stated job (`TodayPair.tsx:181-183`) is to stop a bare column reading as a
   failed image load, and in that state there is no image area to fail.
   `112-r6-EMULATED-inset59-tuesday-day.png`.
2. **Stale comment introduced by this round.** `today/page.tsx:30-31` still
   reads "The pair wrapper cancels it so the photographs reach y=0." The wrapper
   was deleted in `3af2912`; the cancelling now happens inside
   `TodayPairContent` and only when `hasAny`.
3. Carried from round 5, unchanged and not counted this round: dead
   `SealedCard.tsx` / `TonightCard.tsx`; the doorway's link styled as a
   non-interactive label; the doorway's 44/56 row void (on the Tuesday day it is
   the whole bottom half of the screen — `110-r6-tuesday-nophoto-day.png`);
   stale `Dock.tsx:29`.

## Not re-opened, but re-checked because P1-2 touched them

- **No card-shaped object in `<main>`.** Every element ≥8×8 rescanned for opaque
  background, ≥2 borders, radius, shadow, background-image or outline: **zero
  hits**, day and night.
- **No horizontal scroll** at 320, 360 or 393 (`scrollWidth == innerWidth` at
  all three).
- **The meta line did not become fragile.** `mx-5` costs the line 40px, and at
  320 the content box is 119px. Substituting the longest realistic clock
  strings ("Adam · 11:22 pm", "Adam · 12:48 pm") keeps it on one line
  (`height 20px`, single line) at 320, 360 and 393. No wrap, no clip.
  `120-r6-width320-oneposted-day.png`, `121-r6-width320-tuesday-day.png`.

## Confirmed, not counted — the window sentence (B12)

Unchanged and still wrong: the surface prints "Eva's lunch break" in
`type-title` directly under a clock reading "Eva · 9:11 am". Tracked separately;
confirmed out of scope for this round and not driving the verdict.
`100-r6-today-day.png`.

## Method notes

- **Nothing was edited in the reviewed worktree.** `git status` on
  `.worktrees/today-pair` at close: source tree clean at `614b6b7`; untracked
  are `apps/web/node_modules` (pre-existing) and the 22 `*-r6-*.png` renders
  this review produced, which this session commits.
- **Emulated, not captured — stated rather than hidden.**
  `102-r6-EMULATED-inset59-oneposted-day.png`,
  `112-r6-EMULATED-inset59-tuesday-day.png` and
  `113-r6-EMULATED-inset59-tuesday-night.png` inject the *resolved* values of
  `max(1.5rem, env(safe-area-inset-top))` — `main` padding-top 59px, and −59px
  on the grid wherever the gated class is present — because headless Chromium
  reports the inset as 0. The substitution is deterministic and the covered band
  is drawn in the frame. Every other render is a plain viewport capture.
- **The no-photograph state was produced in a scratchpad copy**, never in the
  reviewed worktree: `apps/web` was copied to the session scratchpad,
  `FIXTURE_TODAY` set to `2026-08-04` (absent from `SHARED_DAYS`), and served on
  `:3313`. `lib/fixtures/clock.ts` in the reviewed worktree reads `2026-08-02`
  at `614b6b7` and is untouched. Renders `110`–`113` and `121` come from that
  server; everything else comes from `:3312` on the branch itself.
