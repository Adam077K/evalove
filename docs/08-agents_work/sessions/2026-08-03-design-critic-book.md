---
date: 2026-08-03
role: design-critic
session: design-critic-book
color: gray
branch: feat/book-what-came-back
task: judge The Book as built, from renders of the built code
renders: docs/08-agents_work/renders/2026-08-03-book-critic/
verdict: fix-then-ship
qa_verdict: N/A — design review, not a QA gate
---

# The Book — design review

Rendered the built code at 393×852, viewport captures, day and night.
Twelve renders in `renders/2026-08-03-book-critic/`. The study renders
`30`–`33` were **not** built from this implementation and diverge from it
materially; the Tuesday section below is that divergence.

## Verdict — fix-then-ship

The photograph state passes all three tests. Both no-photograph states
fail Tuesday.

- **Tuesday: FAIL.** `whatCameBack()` returns `null` at 3 of 24 hours on
  today's 11-photo archive. `page.tsx:48` guards with `&&` and renders
  nothing in that case — a masthead, a date, three menu rows, 432px of
  empty canvas. `44-`/`45-`. The text branch the code does carry
  (`page.tsx:174`) is unreachable: every `Photo` in the archive has real
  dimensions, so `hasImage` is never false. Forced open, it is weak —
  `type-quote` is 17px, below the 22px nav row. `46-`/`47-`.
- **Logo: PASS with the photograph, FAIL without it.** The stamp — two
  cities, two clocks, lowercase, directly on paper — plus the 2px author
  edge is unmistakably this app. Strip the photograph and nothing carries
  it.
- **11pm: PASS.** Eva is `America/New_York` and Adam `Asia/Jerusalem`
  (`lib/shared-day/members.ts:25`), so w1's night side — NYC 22:00–02:00
  — is 02:00Z–06:00Z, and something comes back at every one of those
  hours on the fixture day. Night renders as §1.3 intended: the
  photograph is the only lit thing on the page (`41-`, `43-`). The three
  null hours are 07:00Z and 08:00Z (Eva 03:00/04:00, asleep) and 20:00Z
  (Adam 23:00 Jerusalem). So the null misses the primary window today —
  but nothing in the design keeps it out of that window, and if it lands
  there the surface is `45-`.

## Claims that hold, verified in pixels

Resurfacing is the default and chronology is one tap (`48-`). The count is
gone; no number anywhere. The photograph is full-bleed at its own ratio —
`renderedRatio 0.75 == naturalRatio 0.75`, `filter: none`, `opacity: 1`,
and `elementFromPoint` returns the `IMG` at all three probes, so nothing
scrims it. `type-masthead` once. No emoji. Three ways in on hairlines,
unequal by design (rows 76 / 67.2 / 58px). The item does not animate;
`stagger-child` appears only on the three rows below it. Focus rings on
all three links in both modes. Contrast 16.7 / 5.49 day, 14.08 / 5.96
night. Author edge desaturated: `rgb(135,94,80)` = 41% saturation.

## Findings

P1 — no design for `whatCameBack() === null` (`page.tsx:48`).
P2 — `max-h-[70dvh]` is claimed in the comment at `page.tsx:150` and
absent from the element; computed `max-height: none`. Stamp bottom 769.6
vs dock top 770.0 = **0.4px** clearance, held by the fixtures' 1200×1600
default, not by design. A 9:16 crop puts the caption 175px off-screen.
P2 — masthead falls 78.8px short of the measure (274.2 of 353). "Edge to
edge" is the whole justification for extending `type-masthead` here.
P2 — `RefreshCw` on the /echo row reads "regenerate".
P2 — colophon and why-label are the same token, 32px apart, no rank.
P3 — `type-quote` is 17px, not the study's 28px, so on the text branch
the resurfaced line is outranked by the nav row.
P3 — `lib/resurface.ts` (Brief A) labels 18 of 21 non-null hours "Left at
this hour, in July"; `/book/days` re-enters the equal-card stack the wave
exists to escape, by instruction.

`npm test` 277 passed, `typecheck` clean. `lint` fails to load its ESLint
config — identical failure on `ceo-3-1785631504`, so pre-existing.

Full report returned to design-lead.
