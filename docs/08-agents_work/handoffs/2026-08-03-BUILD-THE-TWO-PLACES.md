---
date: 2026-08-03
from: ceo (session ceo-4-1785631505)
to: the team building Today and The Book
status: OPEN BRIEF — founder-directed
depends_on: feat/design-foundation (merge first)
---

# Build the two places

## 0. What you are walking into

There is a working app at **https://eva-and-adam.vercel.app** and a rebuilt
design foundation on `feat/design-foundation`. The founder has rejected two
previous design directions. The second one he called *"vibe coding AI slop."*

The diagnosis in the original brief is the most useful thing you can absorb, and
it is not about taste:

> Every previous agent started from our own documents. A PRD, an architecture
> doc, a design direction — each written by another agent, each internally
> coherent, none grounded in a real product anyone would want to open. Coherent
> documents produced a coherent app that nobody wants. **It is not ugly, it is
> unfelt.**

That has since been fixed at the root. There is now a real evidence base — ~105
sourced findings and a five-persona board — and a product vision built on it.
**Your job is to build against that evidence, not against this document.** If
this brief and the research disagree, the research wins and you should say so.

Read, in this order:

| File | Why |
|---|---|
| `docs/04-features/PRODUCT-VISION-V2.md` | What this app is. §1 is one paragraph; read §3 for why there are two places and not three. |
| `docs/04-features/USER-JOURNEY-V2.md` | First open through day two hundred, on real clocks. |
| `docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md` | The visual law. Founder-approved and not yours to relitigate. |
| `docs/08-agents_work/handoffs/2026-08-02-DESIGN-LEAD-NOTE-TO-TODAY.md` | **Written for you specifically.** The five moves, the dock reasoning, the 50/50 constraint and the attempt to escape it. |
| `docs/08-agents_work/research/personas/2026-08-02-P4-the-deleter.md` | The adversary. Read it before you fall in love with anything. |

Research lives in `docs/08-agents_work/research/`. Nine files. Use them.

---

## 1. The product, in one paragraph

Eva is in New York, Adam is in Israel. Six or seven hours apart, on different
calendar dates for seven hours of every day, with Saturday their only shared day
off. Two users, forever — no signup, no growth, no monetisation.

> **Eva & Adam is two places. One holds the last thing the other one left. The
> other holds everything either of them has ever left. That is the entire
> product.**

It is not a place to be together — FaceTime already does that, free, on both
phones, and the highest-scored quote in the whole research corpus is somebody
describing exactly that. **This is the place where the hours they are apart stop
vanishing.**

The core mechanic, arrived at independently by the advocate persona and by the
adversary whose whole job was to kill the product:

> Leave one true, unperformed thing — a photograph of what is actually in front
> of you, twenty seconds of voice, a line — and have it be *already there*,
> without ceremony and owing no reply, when the other one wakes. It never asks
> for anything. It never counts anything. **Not a message. A lamp left on.**

---

## 2. What you are building

**Today** and **The Book**. Two places, not three.

| Surface | What it is |
|---|---|
| **Today** | Not a tab — **it is what the app is when you open it.** The last thing the other one left. |
| **The Book** | Everything either of them has ever left. An object that gets better with age and **comes back on the day it matches**. Pocket is a locked drawer inside it, not a third place. |

**Do not build The Gap as a surface.** It survives as a *stamp* on every item —
*left while Eva was asleep · 5:12 his morning · 22:12 her night* — which puts
`lib/shared-day/` to work on every screen instead of one nobody revisits. And for
the ~26 days a year the offset is six hours rather than seven, the clock line
reads differently and says so plainly. No banner, no countdown. DST asymmetry is
a real, named, recurring dread in the research; this is the cheapest correct
thing in the product.

**Do not build Saturday as a surface.** The day is protected; the screen is cut.
The activity library stays **on-demand rescue, never a weekly default** — used
weekly the ~20–24 both-alert items exhaust in ~4.5 months, almost exactly the
category's observed churn point.

**Do not touch `apps/web/lib/shared-day/`.** 109 tests, four DST transitions, the
app's one genuine differentiator.

---

## 3. The actual job: break the column

The foundation's materials are right. Its composition is not, and design-lead
said so against its own work:

> Home is five full-width elements at one width, one radius, one elevation, one
> rhythm, and **the eye finds that rhythm on the second element and stops
> reading.** Bringing the corners down removed a signal and did not add a
> structure, and no radius value will.

A vertical stack of equal-width rounded cards is the three-equal-cards cliché
rotated ninety degrees. Every anti-slop skill we hold bans the horizontal
version and says nothing about the vertical one.

**All five of the founder's references refuse that column.** SORDJATI — the one
the visual law is modelled on — is a masthead running edge to edge, then a photo
pair at deliberately *unequal* weights, then a headline at a different measure.
Nothing is the same width as the thing above it. There is no rhythm to settle
into, which is the entire trick, and it costs only the willingness to let
elements differ.

Five moves, all available with existing tokens:

1. Let one element go **full-bleed** past `max-w-md px-5`.
2. Make pairs **unequal**. Home currently has two 50/50 splits.
3. Use `type-masthead` **once per surface** — the extreme scale contrast the law
   asks for only exists if something takes the large end.
4. Let type sit **directly on paper**. If everything is a card, nothing is.
5. **Vary the vertical rhythm.** Equal gaps between unequal things is what makes
   a page read as generated.

**The clock rail is the proof this works** — full-width rows on hairline rules,
hours on paper, no cards. It removed two cards and a 50/50 from the column and
reads more like a page than a dashboard. Nothing else on any surface uses that
vocabulary yet.

---

## 4. Four rules earned the hard way

These cost real mistakes. Inherit them rather than rediscovering them.

**1 · The authorship mark attaches to a thing that exists and that someone made.**
Never to a turn, a state, an intention, or a slot. It answers *who left this*,
not *who is this about*. The two desaturated inks appear only as a ≤2px left edge
and a dot in dense lists — never a fill, text colour, background or button. They
are locked out of Tailwind, so painting a button with someone's colour requires
writing new CSS. Leave it that way.

**2 · The large end belongs to what *changed*, not to what identifies.** Ask: of
the things on this screen, which one is different from yesterday? That gets the
large end. Supporting facts stay small however identifying they are — the two
clocks are the most identifying thing in this product and they do not get to be
the biggest.

**3 · An asymmetry must not track a state the gap predicts.** Before making a
layout asymmetry follow state, ask whether that state is independent of *which
person*. Adam's day starts seven hours before Eva's, so "whoever posted first" is
Adam, every morning, by geography. **If the seven-hour gap predicts it, it is a
person-ranking wearing a state's clothes.**

**4 · Measure to find problems; *look* to confirm fixes.** This cost three
separate failures in one branch. A scrim measured 6.24:1 contrast and shipped —
the measurement proved the text was legible, not that the law was kept. A border
fix verified the class was present, not that the pixels were red, and shipped
broken inside its own patch. A privacy veil's detail metric read 31% and would
have been called a failure until someone looked at the frame. **A metric only
answers the question you thought to encode.**

---

## 5. Known, deliberate, and not defects

**The last 50/50 is the two empty Today slots, and it stays.** The only axis
available for making them unequal is *person*, and ranking people is forbidden.
A state-tracking alternative was proposed and killed by rule 3 above. **One
residual is untested and is the most promising unexplored direction:** the
asymmetry does not have to be *size*. Two slots can differ in **shape at equal
visual weight** — the filled one keeping a portrait crop, the empty one a wider,
shorter field. Nothing is ranked, geography never enters, and what gets expressed
is the true thing: these are different kinds of object. Nobody has built it.

**The coverless book tile fails the Tuesday test and it is yours.** With no cover
photograph it falls back to a plain well and reads as an empty container waiting
to be filled.

---

## 6. How this gets judged

**The Tuesday test.** Render every surface with **no photograph on it at all** —
that is an ordinary afternoon in a product whose entire photo supply is two
people and one of them is always asleep, not an edge case. Is it still somewhere
worth being? If it reads as an empty container, it fails. Use
`tuesday-real-home-*.png` as the standard; those are honest renders with genuinely
emptied fixtures.

**The logo test.** Screenshot it with the wordmark removed. Would anyone know it
was this app and not a well-made journalling template? **The failure mode is not
ugliness — it is being well-made and anonymous.**

**The 11pm test, and it needs enforcing because the person who cannot run it is
the one building it.** Adam will live his 5am hundreds of times and never once
live Eva's 11pm. Nothing ships until it has been walked as the **exhausted** one
at the end of a long day, not the alert one at the start of a fresh one. Never
count or display who left more. Verify quiet-hours against both zones.

**Night is a primary surface.** `library.json` calls w1 — *"She's in bed, he's
awake"* — the biggest window in their week. Design night alongside day, never
after. Add `?mode=night` to any URL.

Immovable, unchanged: two users forever · privacy is a security property, and
anything private never appears in an ordinary view, thumbnail, preview, cache or
notification · **nothing that makes a missed day feel like failure** · Eva's name
first · English only · no Eden imagery · works installed on an iPhone.

On that third one, the honest version is narrower than it looks: missed days
genuinely *do* matter to real long-distance couples. The intolerable thing is
**the product keeping score.** System acknowledging is scorekeeping; a person
acknowledging is just talking. After a three-day silence, whatever was left
arrives exactly as fresh as if it had been opened three hours later.

---

## 7. How to work

**Run it locally.** `.env.example` documents two traps that cost an hour each.
Generate your own scrypt hash; escape every `$` as `\$` because Next expands
`$VAR` in `.env` files; and `NEXT_PUBLIC_SUPABASE_URL` must be **https** and must
answer, because the login rate limiter fails closed and a placeholder makes every
login 503. A throwaway HTTPS server returning `[]` to GET and 201 to POST is
enough. Never commit `.env.local`. Never put a password literal in a script.

**Verify at 393×852, in both modes.** Full-page captures **lie about any
`position: fixed` element** — they paint it at its viewport offset inside the
full document height, which drops the dock into the middle of the page and makes
several things look broken that are not. That already cost two false alarms. The
dark circular badge at the dock's left edge is `<NEXTJS-PORTAL>`, Next's dev
overlay, impossible in production.

**Commit constantly.** Several agents on this project lost hours by finishing
everything and committing nothing. Return `PARTIAL` with committed work rather
than stopping silently.

**Flag judgement calls rather than absorbing them.** Every agent that argued back
on this project improved the outcome — including the ones that argued the CEO was
wrong, and were right.

**Known issues you will meet, none of them yours to fix:** an auth test fails
about 1 run in 10 (`session.test.ts` — a test defect, tampered tokens do not
verify, the assertion mutates a base64url character whose low bits are discarded);
two client-bundle secret-scanning tests skip silently when no build exists; there
is no CI at all.

---

## 8. The bar

The founder will look at this and say either *"yes, that's it"* or *"that's AI
slop."* Two directions have already failed. The materials are now right — the
composition is what is left, and it is the part that decides it.

**Make something that could only exist for these two people.**
