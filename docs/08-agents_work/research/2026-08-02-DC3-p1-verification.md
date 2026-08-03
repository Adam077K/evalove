---
role: design-critic (DC3)
task: verify four P1 fixes — no new review
branch: feat/design-foundation
head: 3e002ef
head_at_close: 27b0237 (moved mid-verification; verdicts unaffected — see note)
date: 2026-08-02
verdict: all four FIXED
new_p1s: none
should_merge: yes
---

# DC3 — P1 Verification

Verification only, against `docs/08-agents_work/research/2026-08-02-DC-foundation-review.md`
§7 and `docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md` §1 and §4.

**Method.** The dev server on 4321 cannot authenticate (no `.env.local` in the
worktree, so `SESSION_SECRET` never loads) and Next 16 refuses a second dev
server in the same directory. So I built the branch at `3e002ef` in a detached
worktree, ran `next start`, minted a session against `e2e/test-session.ts`, and
drove it with Playwright at **393×852, DPR 2**. Everything below marked *live*
is measured on that render, not read off a screenshot. Frames and captures are
in the scratchpad paths cited. The detached worktree and both servers were
removed afterwards; nothing in `design-foundation` was touched.

**The branch moved while I worked.** It is now `27b0237`, one commit ahead of the
head I was given. That commit adds an `input[aria-invalid="true"]` border rule to
`globals.css`, a `Field.tsx` change, and two docs. It touches none of
`home/page.tsx`, `SealedCard.tsx`, `DualClocks.tsx` or any type utility, so every
verdict below holds unchanged at `27b0237`.

---

## P1-1 — References stripped of colour but never mined for structure

**FIXED** — within the three moves the CEO bounded it to. Two delivered
literally, one substituted and argued, and a fourth arrived that was not on the
list.

**One full-bleed element — delivered, and genuinely full-bleed.**
`apps/web/app/(app)/home/page.tsx:212-233`. Live: the book cover measures
`left 0 → right 393` on a 393px viewport, breaking a 353px column, 246px tall,
photograph at full strength. The column it breaks out of is measured on the same
render at `left 20 → right 373`.

**One unequal pair — delivered.** `home/page.tsx:64-67` with
`components/home/EchoTile.tsx:38`. Live: a 393×246 photograph over a 353×78 ink
strip. Different width, 3.2× different height, and not a grid. The comment at
`home/page.tsx:59-63` names why this was the pair that could be made unequal —
it is the one that does not rank a person.

**`type-masthead` used in-app — not delivered, and the reversal is argued.**
`type-masthead` still has exactly one consumer, `app/login/page.tsx:33`. It was
attempted at `66cad39` (clock rail at masthead scale) and reversed at `ffa98fa`.
The purpose of that move — something in-app actually taking the large end — is
served instead by `type-hero` at 47px, on every authenticated surface. See P1-4.

**A fourth move, not on the list.** `components/home/DualClocks.tsx:60-110`: the
clock pair stopped being two 50/50 cards and became a rail — two full-width rows
on hairline rules with the hours set directly on the paper, no card around them.
That removed two cards and one of Home's three 50/50 pairs, and it is two more
items off the design-lead's own list ("let type sit directly on paper", "vary
the vertical rhythm").

**It survives Tuesday.** `docs/…/screens/foundation/tuesday-real-home-day-scrolled.png`:
with no photograph anywhere, the full-bleed slot renders as two edge-to-edge
hairline rules with "The book" set directly on the paper between them, then the
ink strip. No slab, no gradient, no card. The vocabulary is structural, not a
property of having a photo to show.

Judged on the question asked — is the structural vocabulary now demonstrated —
yes. Composing Today remains a later job, as bounded.

---

## P1-2 — The signature moment was a cross-fade, not an opening

**FIXED** — judged live, not from a still.

`components/home/SealedCard.tsx:133-134`: `motion.section layout={!reduced}`
wrapping `AnimatePresence mode="popLayout"`.

Live frame trace, production build, 393×852 — the section holds **two children
for the first ~300ms**:

| t (ms) | seal | note | section h |
|---|---|---|---|
| 0 | `absolute`, α 0.68, scale 0.996, y −0.4 | `static`, α 0.14, scale 0.983, y +12 | 131 |
| 60 | α 0.14, scale 0.963, y −3.7 | α 0.57, scale 0.991, y +6.0 | 141 |
| 120 | α 0.05, scale 0.948, y −5.2 | α 0.81, scale 0.996, y +2.7 | 157 |
| 180 | α 0.01, scale 0.942, y −5.8 | α 0.95, scale 0.999, y +0.7 | 168 |
| 240 | α 0.00, scale 0.941, y −6.0 | α 1.00, scale 1.000, y 0 | 173 |
| 320 | unmounted | — | 175 |

The seal leaves the layout flow, recedes and lifts — it never slides away — and
the note takes its place underneath while the seal is still on screen. The two
boxes overlap for the whole window. That is a shared space, which `mode="wait"`
made structurally impossible.

The decisive evidence is a picture, not a number:
`…/scratchpad/seal-f1.png` shows both states in the same card at the same
moment — the receding "Eva has a note waiting" and its black Open pill still
legible underneath the arrived note, same card, same authorship edge, same
position on the page. An envelope becoming a letter in place.

Height: the section animates 130 → 176px across ~320ms rather than jumping.

**One honest qualification, not a P1.** `layout` absorbs the growth inside the
section by transform; the plain-flow siblings below it are not wrapped, so
`TonightCard` and the book/Echo pair still move — but they move **once, +46px,
in the first frame, before the note arrives**. The original finding was that the
gesture *ends* by shoving the page down. It now begins by making the room. That
is a change in kind, and I am not raising it.

Reduced motion still fully removed rather than degraded
(`SealedCard.tsx:83, 124-130, 145`).

---

## P1-3 — Photographs were being dimmed

**FIXED** — dead, not relocated. This is the strongest of the four.

**Both scrims are gone at source.**
- `home/page.tsx:167-183` — the Today slot is now a `<figure>`: a bare
  `<img className="photo">` inside an `overflow-hidden` box, with the name and
  time in a `<figcaption>` **below** it. No overlay child.
- `home/page.tsx:212-233` — the book cover is a bare full-bleed
  `<img className="photo">`; the title and day-count sit in a sibling `<span>`
  underneath, on paper. The coverless branch (`:229-232`) is a `border-y` rule,
  not the dark slab that used to composite over a `well`.

**Nothing was relocated.** Tree-wide grep for `gradient` across
`apps/web/**/*.{ts,tsx,css}` returns exactly three live `linear-gradient`s —
`DualClocks.tsx:134`, `TonightCard.tsx:32`, `DatesExplorer.tsx:109` — all three
the skeleton shimmer sweep, all three over a `well` placeholder, never over an
image. The original review named and accepted these by hand. Every other hit is
a comment recording a deletion.

**Live confirmation, which is what settles it.** On the rendered Home page:
- filtering every element in the document by
  `getComputedStyle(el).backgroundImage` matching `gradient` returns **`[]`** —
  zero gradients on the page at all;
- both `<img>` elements compute `filter: none`, `opacity: 1`,
  `mix-blend-mode: normal`, and have **zero sibling elements inside their photo
  box** (the book's caption span is a sibling of the box, below it).

**The other three image call sites are clean too.** `Spread.tsx:126-137`
(caption in a `<figcaption>` below), `QuickSend.tsx:112-126` — where the remove
button is now a solid `pill-ink` circle, so P3-2's `bg-black/45 backdrop-blur-md`
went with it. `backdrop-blur` no longer appears anywhere in `apps/web`.

`globals.css:571-573` is now `.photo { filter: none }`, and `--photo-dim`
survives only in three comments recording its death.

---

## P1-4 — Nothing took the large end of the type scale

**FIXED.** The clock is no longer the biggest type in the product, the gap is
real, and the two rows are identical.

**The large end, and it is not nominal.** `globals.css:437-459` — `type-hero` is
now `clamp(2.5rem, 12vw, 3.25rem)`, which resolves live to **47.16px** at 393px.
Measured optically on the same render so the font-metric difference cannot hide
anything:

| | font-size | ink height | cap ascent |
|---|---|---|---|
| Window sentence (Fraunces) | 47.16px | 46.5 | **34.9** |
| Clock digits (Outfit) | 38px | **27.4** | 27.0 |

The sentence reads ~27% larger in actual ink, not merely in declared points.
`type-clock` is unchanged at 38px and now sits under it as evidence.

**The ramp.** Live on Home: **47.16 / 38 / 22 / 17 / 13 / 11**. Largest step
38→22 = 1.73×, against the ramp the review condemned (38/33/22/17/15/13/11,
largest step 1.5×). There is a real gap and it is the biggest one in the scale.
Stated plainly: it sits *below* the clock, not immediately below the display
size — 47→38 is only 1.24× — so this is SORDJATI's discipline approached, not
reached. That was the CEO's bound, and it clears the finding as written.

**It is foundation-wide, not a Home fix.** `type-hero` at 47px now lands on
every authenticated surface: `today/page.tsx:26`, `book/page.tsx:60`,
`dates/page.tsx:23`, `PocketGate.tsx:50`, `QuickSend.tsx:102`,
`HomeHeader.tsx:40`, plus `LoginForm.tsx:98`. The original finding's reason for
calling this foundation-level — that six surfaces topped out at 33px — is
answered on all six.

**Both clock rows are identical.** One component renders both
(`DualClocks.tsx:65-67` maps `MEMBERS` through a single `ClockRow`), so the
markup cannot diverge. Live measurement of the two rendered rows:

```
Eva   353 × 91   38px / 500 / rgb(25,21,18)   ink 27.4   border-left 0px
Adam  353 × 91   38px / 500 / rgb(25,21,18)   ink 27.4   border-left 0px
```

Identical on every axis, and neither carries an authorship edge — the mark was
removed from the clocks entirely (`DualClocks.tsx:35-38`), so no partner is
rendered larger or marked where the other is not.

**One deviation from the finding as literally written.** `type-masthead` (59px)
is still login-only. The large end in-app was delivered by raising `type-hero`,
not by using the masthead, and the reversal is argued in
`docs/08-agents_work/handoffs/2026-08-02-DESIGN-LEAD-NOTE-TO-TODAY.md`. Flagging
it so the CEO can disagree; I do not, and it does not change the verdict.

---

## New P1s

**None.** Three things I noticed and am deliberately *not* raising, recorded so
the next reader knows they were seen and judged:

1. The +46px sibling shift at the start of the seal opening (P1-2 above).
2. `type-hero` at 47px now sets static page titles — "Dates", "The book", "The
   pocket" — which sits in tension with the design-lead's own new rule that the
   large end belongs to what changed. That is a composition call on those
   surfaces, not a foundation defect.
3. `globals.css:406-409` still documents the old ramp (`type-hero 33px`) and no
   longer matches the token below it at `:454`. A stale comment.

---

## Should this branch merge?

**Yes** — all four P1s are fixed, three of them beyond argument and the fourth
(P1-1) fixed within the bound the CEO set, and I have no objection to raise.
