---
date: 2026-08-03
from: design-lead (session design-lead-two-places, branch ceo-3-1785631504)
to: ceo, then frontend-engineer × 4
status: READY TO DISPATCH
renders: docs/08-agents_work/renders/2026-08-03-two-places/
depends_on: ceo-3-1785631504 (has main + feat/design-foundation + research merged)
---

# Today and The Book — composition plan and worker briefs

Everything below was rendered at 393×852 in both modes against the real
`app/globals.css` tokens before it was decided. The renders are in
`docs/08-agents_work/renders/2026-08-03-two-places/` and are numbered in the
order this document discusses them.

---

**Render numbering.** `00`–`02` are the current build. `10`–`12` are the §5 idea
that was built and rejected. **`20`–`23` are a superseded first pass at Today**
and are kept only so the revision in §1.1 is legible — do not build against them.
`24`–`28` are Today; `30`–`33` are The Book.

---

## 0. Three findings that change the brief

### 0.1 The §5 shape-asymmetry idea fails, and not for the predicted reason

The brief named "two slots differing in **shape at equal visual weight**" as the
most promising unexplored direction, and asked for it to be built before it was
judged. It was built, both ways — side by side at equal *area*
(`10-shape-asymmetry-half-day.png`) and stacked
(`12-shape-asymmetry-stacked-day.png`) — and it fails on two grounds that only
appear in a render.

**Equal area is not equal weight.** In `10-`, the photograph is 137×171 and the
empty field is 204×115 — identical area. The empty field wins the page outright.
It is wider, it is a large pale `--surface-2` block against warm canvas, and the
eye goes to it first; the photograph reads as a thumbnail beside it. So the
claim that protected the idea — *nothing is ranked because nothing is larger* —
is false in practice. And which side is empty is decided by the seven-hour gap:
through w1, the largest window in their week, the empty side is Eva's. The
biggest, palest, most attention-taking object on Eva's phone at 11pm would be her
own missing photograph. That is the *empty-side-larger* failure the predecessor's
note already killed, reached by a different route.

**On a true Tuesday the shapes assert a distinction that does not exist.**
`11-shape-asymmetry-tuesday-day.png`: neither has posted, so both slots are
empty — and they are still different shapes, because the shape is bound to the
person. Two empty wells of different proportions with two names under them reads
as a broken form. The 50/50 it was meant to replace at least reported the truth.

**The finding underneath both, and it generalises:** any layout that renders a
place for the thing that is *absent* will, on this couple's clock, render Eva's
absence more often than Adam's. That is not a shape problem and no proportion
fixes it. **The slot is the defect.**

### 0.2 So the 50/50 does not need a second axis — Today does not hold a pair

Read the vision's own sentence literally: *"One holds the last thing **the other
one** left."* Singular, and explicitly the other person's. Eva's own last
photograph is not on Today at all — she knows what she left, and showing it back
to her is the ledger P4 named.

That dissolves the problem rather than solving it. There is no pair on Today, so
there are no two slots, so there is nothing for an asymmetry axis to act on, and
nothing renders anyone's absence. The pair survives exactly where §2.2 permits it
— in The Book, where a finished day is bound as a pair because a pair is a thing
that exists.

Rendered as `20-today-lamp-day.png` / `21-today-lamp-night.png`. It is a
different product from the control.

**Flagged as a judgement call, because it contradicts the packet's framing.**
The packet asked for the two empty Today slots to be explored, and the answer is
that they should not both exist. The evidence is the render plus VISION §1, §4.2
(*"opening lands directly on the newest thing, full bleed, zero navigation"*) and
§4.4. If the founder wants a two-sided Today, `10-` and `12-` are what it looks
like and §0.1 is why it should not ship.

### 0.3 The Gap stamp does not exist in the codebase

`grep` across `lib/`, `components/` and `app/` returns nothing for the stamp.
DESIGN-DIRECTION §7 — founder-set — requires *left while Eva was asleep · 5:12
his morning · 22:12 her night* on **every item, everywhere**, and it is the
entire compensation for cutting The Gap as a surface. It is also the largest
single piece of missing work in this wave, and it is what puts `lib/shared-day/`
to work on every screen. It is Brief A, and it blocks the other two surfaces.

---

## 1. Composition plan

### 1.1 Today

> **Revised after CEO's verified finding, 2026-08-03.** iOS Safari web push
> cannot carry an image and Declarative Web Push has no image field. The lever
> VISION §4.5 listed as possibly shrinking the product's biggest loss does not
> exist, so **the app-open is the only way anything ever arrives**, and §4.2 —
> *"opening lands directly on the newest thing, full bleed, zero navigation"* —
> stops being one mitigation among two and becomes the whole of it.
>
> The first plan put a date line and a two-line 47px Fraunces sentence above the
> photograph: 41% of the first viewport, measured off `20-today-lamp-day.png`,
> before the thing she opened for. Worse, `HomeHeader` and `DualClocks` compute
> from `new Date()` in `useEffect`, so first paint is a reserved invisible
> placeholder and a shimmer skeleton — literally *a skeleton she waits through,
> above the thing she came for*. Both are now below it. The structure did not
> change; the order did.

Route becomes `/today`. The current `/today` — a review harness whose three
section headers are *"The half pair — the day is still open"*, *"The completed
pair"*, *"The single plate — a day that closed half-finished"* — is the live
instance of the taxonomy PRODUCT-VISION §2.2 cuts, and it is deleted in the same
move.

```
  [ photograph, FULL BLEED, from the top of the safe area, own aspect ]
  │ The cat that owns our stairwell        (type-quote + 2px author edge)
    left while Eva was asleep              (the stamp, on paper, two lines)
    Adam 6:20 am · Eva 11:20 pm
  ──────────────────────────────────────── hairline
  MONDAY 3 AUGUST                          (type-micro)
  Eva’s in bed, Adam’s awake               (type-title — the live sentence,
  ──────────────────────────────────────── hairline   below, not above)
  A YEAR AGO TODAY                         (type-micro)
  [ 44% photo ] │ Roosevelt Island tram…   (the doorway — unequal pair)
  The book                          ↗
```

`24-today-open-is-the-ceremony-night.png`, `25-…-day-foot.png`,
`26-today-tuesday-revised-day.png`.

Five moves, all present: the photograph goes **full-bleed** past `max-w-md px-5`
and starts at y=0; the three sections run at three different measures — full
bleed, full column, 44/56 — so no **pair** is equal; the large end is taken once
and it is the photograph's **area**, which is a bigger claim than any type size
and is unambiguously the thing that changed; caption, stamp and sentence sit
**directly on paper** with no card anywhere on the surface; and the **vertical
rhythm** runs 0.875 / 2 / 2.5rem — nothing is evenly spaced.

**Today has no masthead and no header.** The equivalent of SORDJATI's wordmark
is the app icon she just tapped. Nothing above the item, at any size.

**No live two-clock rail on Today.** It would be the third telling of the same
fact — the window sentence is the live presence statement in the couple's own
language, and the stamp carries both hours at the moment of leaving. A rail as
well is the room PRODUCT-VISION §3.1 deleted, rebuilt below the fold. It also
sat permanently under the dock in the render. That is finding #2 of the
predecessor's note applied rather than rediscovered.

**The doorway, and why the surface does not end at the stamp.** With the open as
the only arrival, the day nothing arrived costs Eva the same decision and returns
the same screen as yesterday. P2's requirement — *"If I open it and there's
nothing fresh, I should land somewhere with weight already in it — the
accumulated archive, not a blank tray"* — is load-bearing now rather than nice.
So Today closes on **one bounded doorway into The Book, showing what came back**:
exactly one item, at an unequal 44/56 measure, with the label of why it returned.

One item, not a feed — the vision is emphatic that there are two places, and a
Today that continues into an infinite archive is one place with a scroll. And it
buys the property that answers *why does she open it on Wednesday*: **on a day
nothing arrived, the thing that changed on Today is what came back.**

**This does not license a louder Today.** The compensation for the weak arrival
is immediacy, not volume: the photograph is first, it is bigger than before
because nothing precedes it, and everything else moved down.

**States.**

| State | What renders |
|---|---|
| The other one left something | The item, full bleed, with its stamp. |
| They left nothing today | **The same item, unchanged.** Nothing greys, expires or moves. VISION §4.4 — there is no empty state because nothing is ever consumed. The doorway below it is the only thing that differs from yesterday, which is the point. |
| The newest thing is a line, not a photograph | `26-today-tuesday-revised-day.png`. The line takes `type-quote` at 28px with the author's 2px edge, directly on paper, as the first thing on the surface. **This is the Tuesday answer for Today** and it passes: with zero photographs anywhere — including in the doorway — the surface is still somewhere worth being. |
| Nothing has ever been left | Redirect into The Book. USER-JOURNEY, day zero: *"it opens into The Book, because nothing has been left yet."* Never an onboarding screen. |

**DST.** For the ~26 days the offset is six hours, one extra line under the
window sentence, in plain words, once. No banner, no countdown, no push.
Derived read of `sharedDayLengthMs(today)`: 30h means the zones disagree, 31h
means they do not.

### 1.2 The Book

Default view is **what came back**, not reverse chronology. This is P4's
withdrawal condition met literally: *"make the archive's default view something
other than a date grid — something that resurfaces by association rather than by
calendar, so that absences are not addressable positions."*

```
  THE BOOK                                 (type-masthead, edge to edge, 59px)
  BEGUN 2 AUGUST 2026                      (type-micro)

  A YEAR AGO TODAY                         (type-micro — why it came back)
  [ photograph, FULL BLEED ]
  │ Roosevelt Island tram, the loud sunset  (type-quote + 2px author edge)
    left while Adam was asleep
    Eva 6:10 pm · Adam 1:10 am
  ──────────────────────────────────────── hairline
  Ask for something              ( ↗ )     (type-title, on paper)
  ──────────────────────────────────────── hairline
  The days in order              ↗
  ──────────────────────────────────────── hairline
                                    [lock]  (unlabelled)
```

`30-book-what-came-back-day.png`, `31-…-night-foot.png`.

**Why the resurfacing never runs out, without tracking anything.** Two
associations, in order of preference, both computed and neither requiring an
open to be recorded (VISION §4.5 forbids recording opens):

1. **Date match** — this day, a year ago. The strongest evidence in the corpus;
   P3: *"I always stop. Every time."*
2. **Hour match** — something left at roughly this hour, in either city, from any
   date. Available every day at every hour, keyed to a fact the app already
   computes, and it is `lib/shared-day/` doing visible work.

Chronology stays **reachable and not default** behind *The days in order*. The
existing guarantee that makes that view safe is already in the code and must be
kept: `SHARED_DAYS` is a list of days that happened, never a date range iterated
into a grid (`lib/fixtures/book.ts` head comment). A missed day has no row.

**`type-masthead` gets exactly one more consumer.** `globals.css` §5 currently
reserves it for the login door's wordmark. The Book's title takes it because a
book's title page is the one place in this product where a name is legitimately
the largest type — SORDJATI's structure exactly. The rule that the large end
belongs to *what changed* is still kept, because the thing that changed takes the
largest **area**: the full-bleed photograph. Today does not get a masthead.

**The count goes, and it is replaced by the object's age, not by a better count.**
`app/(app)/book/page.tsx:54` computes `kept` from `completeDays()` — both-posted
only — and renders `"Two days, kept"` at `:63`, while the rail below shows every
day *either* posted. Three leaves, a count of two. Confirmed live in
`02-current-book-day.png`.

The fix is **not** to recount. A day-count in a product that bans streaks is the
ledger with the counter filed off, and `completeDays()` classifies a day by how
many people contributed to it, which VISION §2.2 forbids in as many words. The
line becomes the colophon — `Begun 2 August 2026`, from the existing `BEGUN`
fixture and `longDate()`. It expresses age without counting anything and the
mismatch cannot recur because there is no number.

**Tuesday test.** `32-book-tuesday-no-photo-night.png` /
`33-…-day.png`: the same page with the resurfaced item being a line rather than
a photograph. It passes.

**The pocket** is a lock glyph at the foot of The Book, unlabelled, no
explanatory copy. VISION §2.1: a labelled navigation entry is a signpost pointing
at the private thing. Two users forever — they know what the lock is.

### 1.3 Night

Designed alongside, not after; every candidate above was rendered in both modes
in the same pass. Three things night specifically buys:

- The full-bleed photograph is the only light source on the page, at full
  strength — `globals.css` §2's stated goal (*"the brightest thing on Eva's
  screen is Adam's face"*) reached by composition rather than by a token.
  Confirmed by looking at `21-today-lamp-night.png`, not by a contrast number.
- With no card anywhere on Today, night has no white plates to glow. The
  surviving `--surface` consumers on these two surfaces are the dock and nothing
  else.
- On the no-photograph night (`22-`, `32-`) the largest lit area is Fraunces
  italic at 28px, which at `--ink` on `--canvas` is 14:1 over a small area rather
  than a bright block. That is the right shape for 11pm.

---

## 2. Worker briefs

Four briefs, two waves. Wave 1: **A** and **D** in parallel. Wave 2: **B** and
**C** in parallel, both branching from A's branch once it is merged.

Every worker branches from `ceo-3-1785631504`, never from `main` — `main` has no
app code.

```bash
MAIN_REPO=/Users/adamks/VibeCoding/evalove
git -C "$MAIN_REPO" worktree add "$MAIN_REPO/.worktrees/<slug>" -b feat/<slug> ceo-3-1785631504
```

---

### Brief A — the stamp and the resurfacing (wave 1, blocks B and C)

**worker:** frontend-engineer · **branch:** `feat/gap-stamp` ·
**worktree:** `.worktrees/gap-stamp`

**Goal.** Build the two pure reads both surfaces need: the stamp
DESIGN-DIRECTION §7 requires on every item plus the DST line, and the
resurfacing selector. Both are pure functions over fixtures and
`lib/shared-day`'s public exports. Neither renders a surface, which is why they
are one wave-1 brief rather than a dependency between B and C.

The stamp is the whole compensation for cutting The Gap as a surface and it
currently does not exist anywhere in the codebase. The resurfacing is consumed
twice — as The Book's default view (Brief C) and as Today's closing doorway
(Brief B) — and the two must agree, which is the second reason it lives here.

**Files to create**
- `apps/web/lib/stamp.ts`
- `apps/web/components/item/Stamp.tsx`
- `apps/web/lib/resurface.ts`
- `apps/web/lib/__tests__/stamp.test.ts`
- `apps/web/lib/__tests__/resurface.test.ts`

**Files in scope (read-only reference):** `lib/shared-day/index.ts`,
`lib/time.ts`, `lib/fixtures/members.ts`, `lib/types.ts`

**Do not touch:** `apps/web/lib/shared-day/**` — 109 tests, four DST
transitions. This module *reads* its public exports and adds nothing to it.

**The API**

```ts
export interface Stamp {
  /** "left while Eva was asleep" | "left while Adam was at work" | "left this afternoon" */
  condition: string;
  /** "Adam 6:20 am" — the author, their own city's clock. */
  author: string;
  /** "Eva 11:20 pm" — the other one, their own city's clock, same instant. */
  other: string;
}
export function stampFor(leftAt: IsoDateTime, authorSlug: MemberSlug): Stamp;

/** "Six hours this week, not seven." — null on the ~339 ordinary days. */
export function offsetNote(day: IsoDate): string | null;

/** Why something came back, and what. Date match first, hour match otherwise. */
export type Return =
  | { reason: "date"; label: string; photo: Photo }   // "A year ago today"
  | { reason: "hour"; label: string; photo: Photo };  // "Left at this hour, in June"
export function whatCameBack(now: Date): Return | null;
```

**Rules**
1. **Absolute, never relative.** `Monday, 5:12 his morning` is a caption;
   `3 days ago` is a ledger entry. Nothing here may compute an elapsed anything.
2. `condition` comes from `partnerPresence(otherSlug, new Date(leftAt))`. When
   the other one was **not** asleep the clause must not say they were — that is
   how VISION §5 degrades gracefully on the day the distance ends.
3. **Two lines, not one.** Rendered as one string it wraps mid-word at 393px
   (see `12-shape-asymmetry-stacked-day.png`, where it breaks after "morning").
   `condition` on line one, `author · other` on line two.
4. **Names, not pronouns.** The repo already set this precedent: `WINDOW_STRINGS`
   in `lib/fixtures/members.ts` renders `library.json`'s *"She's in bed, he's
   awake"* as *"Eva's in bed, Adam's awake"*. DESIGN-DIRECTION §7's example line
   uses *his/her*; this follows the code's own convention instead. Every display
   string lives in one exported record at the top of `stamp.ts` so it is one edit
   if the founder wants the §7 wording verbatim.
5. `offsetNote` derives from `sharedDayLengthMs(day)`: 30h means the two zones
   disagree about DST, 31h means they do not. **No numeric offset constant
   anywhere** — `lib/shared-day/__tests__/no-numeric-shift.test.ts` greps for
   exactly that and it will fail the build.
6. Eva's name first wherever both appear and neither is the author.
7. `Stamp.tsx` is a **server component** and must stay one. It takes an explicit
   instant and never reads `new Date()` in an effect. This is not a preference:
   the open is now the product's only arrival path (§1.1), and a stamp that
   hydrates is a skeleton sitting next to the thing she opened for.
   `type-micro` with `normal-case` — uppercasing their names is the wrong
   register, see the `type-micro` note in `globals.css` §5 — and `text-mute`.
   No icon, no chip, no card, no background.
8. `whatCameBack` may never read, record or infer an open. VISION §4.5:
   *"opens are never recorded, never surfaced, never used to time anything."*
   The two associations are chosen because neither needs one: **date match**
   (this day, a year ago — P3: *"I always stop. Every time"*) and **hour match**
   (something left at roughly this hour in either city, from any date), which is
   available every day at every hour and is `lib/shared-day` doing visible work.
9. `whatCameBack` is deterministic for a given instant. Two surfaces render its
   result in the same session and they must not disagree.

**Success criteria**
- `npm test` passes, including the 109 shared-day tests untouched.
- Stamp tests cover: both asleep-directions, the both-awake case, an author in
  each zone, and a date inside each of the two 2026 DST-mismatch windows
  (US spring-forward 8 March → IL 27 March; IL fall-back 25 Oct → US 1 Nov).
- Resurface tests cover: a date match exists; no date match so the hour match
  answers; determinism across repeated calls at one instant; and `null` only
  when the archive is genuinely empty.
- `npm run typecheck` and `npm run lint` clean.

---

### Brief B — Today (wave 2, from `feat/gap-stamp`)

**worker:** frontend-engineer · **branch:** `feat/today-the-last-thing-left` ·
**worktree:** `.worktrees/today-last-thing`

**Goal.** Rebuild the opening surface as Today, per §1.1 above and
`24-today-open-is-the-ceremony-night.png`, `25-today-open-is-the-ceremony-day-foot.png`,
`26-today-tuesday-revised-day.png`. Renders `20`–`23` are the **superseded**
first pass, kept only so the revision is legible; build against `24`–`26`.

**Files to create/change**
- `apps/web/app/(app)/today/page.tsx` — replaced wholesale. The three taxonomy
  headers go with it.
- `apps/web/components/today/LastThingLeft.tsx` — new.
- `apps/web/components/today/CameBack.tsx` — new. The closing doorway.
- `apps/web/app/page.tsx` — redirect `/home` → `/today`.
- `apps/web/middleware.ts:83` — post-login redirect target.
- `apps/web/app/(app)/home/page.tsx` — deleted. PRODUCT-VISION §2.1 cuts Home
  outright: it is a dashboard summarising surfaces that no longer exist.
- `apps/web/e2e/dock-clearance.spec.ts:32` — route list.

**Reference package**
- Composition: §1.1 of this document, and the three renders named above.
- Tokens: `app/globals.css`. Everything needed exists; add none.
- The window sentence is already built and correct —
  `components/home/HomeHeader.tsx` computes it live from `currentWindow()`. Lift
  the computation, drop the `type-hero` treatment: it becomes `type-title`,
  **below** the item, after a hairline. Keep the pocket lock, but it moves to the
  foot of The Book (Brief C) — it may not sit above the item here.
- Motion: `stagger-child` at ≤50ms on the sections **below** the item only. The
  item itself does not animate in — an entrance animation on the one thing she
  opened for is a delay charged to the only arrival the product has. Do not add
  a new animation to this surface; the signature moment is `SealedCard.tsx` and
  it belongs to the arrival, not the page.

**Hard rules**
- **Nothing above the item. At any size.** No masthead, no date line, no
  greeting, no chip, no skeleton, no reserved placeholder. The photograph starts
  at the top of the safe area: this surface opts out of the column's
  `pt-[max(1.5rem,env(safe-area-inset-top))]` and uses
  `padding-top: env(safe-area-inset-top)` and nothing more, so on an installed
  PWA the photograph begins directly below the status bar and is never cropped
  under it.
- **The item and its stamp are server-rendered.** No `useEffect` date
  computation anywhere at or above the item. `HomeHeader` and `DualClocks` both
  paint a placeholder then pop in; that pattern may not appear above the item.
  Below the hairline it is fine.
- **No slot, no prepared place, no plus-in-a-well anywhere on this surface.**
  §0.1 above is why. The way to leave something is the dock's `+`, which is
  always in the same place and is never handed to anyone (P2, and
  PRODUCT-VISION §8).
- The item is the **other one's**. The viewer's own material never appears here.
- Full bleed means `-mx-5 md:-mx-8` past the column, at the photograph's **own**
  aspect ratio — never cropped to a fixed ratio; capped at `max-h-[70dvh]` so a
  tall portrait does not take two viewports. `dvh`, never `vh`.
- The photograph is never dimmed, tinted or scrimmed. The caption goes
  underneath, on paper. There is no acceptable scrim strength.
- The 2px author edge goes on the caption block, not on the photograph — a
  full-bleed photograph has no left edge to mark.
- The doorway shows **exactly one** returned item from `whatCameBack()` (Brief
  A), at a 44/56 unequal measure, with its why-label at `type-micro` and its
  caption at `type-caption`. Not a rail, not a grid, not a "recent" list. It
  links to `/book`.
- No card on this surface. No `.card` class in the diff outside the dock.
- Nothing that reads as a count, a streak, a turn, a "waiting", or a
  "nothing new today".

**Two known composition details from the study, already looked at**
- In `25-…-day-foot.png` the destination line `The book` reads as a heading for
  a new section rather than as the doorway's own link, because it sits below the
  pair at `type-title`. Bind it to the section — either inline with the
  why-label as a head-and-arrow row, or tightened hard against the pair.
- The doorway's caption at 15px and the closing sentence at 22px are close
  enough to compete. Drop the doorway caption to `type-caption` so the live
  sentence stays the largest type below the photograph.

**Success criteria**
- Renders at 393×852 in day and night, verified with a **viewport** capture at
  every scroll offset, never a full-page one.
- **On first paint, at 393×852, the item occupies the top of the viewport with
  nothing above it and no skeleton anywhere on screen.** This is the acceptance
  test that carries the most weight in this brief — see the §1.1 note.
- All four content states from §1.1 render from fixtures, including the
  no-photograph-anywhere case.
- No content in the bottom 82px band at rest.
- `npm test`, `npm run typecheck`, `npm run lint` clean.

---

### Brief C — The Book (wave 2, from `feat/gap-stamp`)

**worker:** frontend-engineer · **branch:** `feat/book-what-came-back` ·
**worktree:** `.worktrees/book-what-came-back`

**Goal.** Rebuild The Book so resurfacing leads and chronology is reachable, per
§1.2 and `30-book-what-came-back-day.png`, `31-…-night-foot.png`,
`32-book-tuesday-no-photo-night.png`.

**Files to create/change**
- `apps/web/app/(app)/book/page.tsx` — replaced.
- `apps/web/app/(app)/book/days/page.tsx` — new. The chronological entrance; the
  existing `Spread` snap rail moves here **unchanged**.

`lib/resurface.ts` is **Brief A's**, not yours — Today's closing doorway renders
the same return and the two must agree within a session. Consume
`whatCameBack()`; do not reimplement or fork it.

**Do not touch:** `components/spread/Spread.tsx` — it is correct and it is where
the pair legitimately lives. `lib/shared-day/**`. `lib/fixtures/book.ts`
behaviour (it must keep being a list of days that happened, never a range).

**Hard rules**
- **The count goes.** Delete the `completeDays()` call at `:54` and the
  `"N days, kept"` line at `:63`. Replace with the colophon `Begun 2 August 2026`
  from `BEGUN` + `longDate()`. Do not recount, do not restate — §1.2 for why.
  This is a rendering fix; `lib/shared-day/days-together.ts` is not touched.
- The photograph is full bleed at its own aspect ratio, never dimmed.
- The pocket's lock moves here, at the foot. Brief B removes it from the opening
  surface because nothing may sit above the item there.
- `type-masthead` once, on `THE BOOK`. Nothing else on the surface may take it.
- The ways in are type on hairline rules, not cards, and they are not three
  identical rows: *Ask for something* takes SORDJATI's pill-label-beside-a-
  circular-arrow-button; *The days in order* is a rule with a small arrow; the
  pocket is a `lucide-react` `Lock` at the foot with **no label and no copy**.
- **No emoji.** The study render used `🔒` as a placeholder and it must not
  survive into code — Lucide only.
- `Ask for something` links to `/echo`, whose existing copy — *"It will quote
  Adam word for word. It will never guess what Adam would say"* — is the
  best-written line in the app and is kept verbatim.

**Success criteria**
- Default view is not chronological; the chronological view is one tap away and
  still skips days in silence.
- Both Tuesday renders (no photograph anywhere) hold up in both modes.
- `npm test`, `npm run typecheck`, `npm run lint` clean.

---

### Brief D — two places, not four (wave 1, parallel with A)

**worker:** frontend-engineer · **branch:** `feat/dock-two-places` ·
**worktree:** `.worktrees/dock-two-places`

**Goal.** The dock currently offers Home · The book · Dates · Echo plus send.
PRODUCT-VISION §2.1/§2.3/§2.4 cut Dates and Echo as destinations; Echo lives
inside The Book and the activity library is an on-demand rescue, never a tab.
A four-tab dock is the app contradicting its own one-paragraph description on
every screen.

**Files to change:** `apps/web/components/chrome/Dock.tsx` only.

**Do**
- Two tabs: **Today** (`/today`) and **The book** (`/book`), with the send `+`
  between them.
- Keep the `layoutId` spring at 420/34, the `pill-ink` active tab, the
  `shadow-float` three-layer elevation, the opaque surface, and the
  `--dock-footprint` contract. All of it is right; only the tab list changes.
- Re-centre: two tabs and a raised centre is a different optical problem from
  four. Verify the pill is symmetric with the active label expanded on **each**
  tab, not just the default one.

**Do not**
- Delete the `/dates` or `/echo` routes. They stay reachable; only their
  advertisement goes. Deleting routes is CTO's call, not this brief's.
- Add the pocket to the dock. Ever.

**Success criteria**
- Viewport captures at 393×852, day and night, with each tab active.
- `--dock-footprint` unchanged, so nothing else in the tree needs to move.
- `npm run typecheck`, `npm run lint` clean; `e2e/dock-clearance.spec.ts` passes.

---

## 3. How to verify (all four workers)

Running locally costs two traps, both documented in `apps/web/.env.example` and
both real:

- Escape every `$` in the scrypt hashes as `\$`. Next expands `$VAR` in `.env`.
- `NEXT_PUBLIC_SUPABASE_URL` must be https and must answer, because the login
  rate limiter fails closed and a placeholder makes every login 503.

A faster route that avoids the login entirely, used to produce every render in
this document: mint a session cookie directly with `jose` and the same
`SESSION_SECRET`, and set it on the Playwright context. `middleware.ts` only
verifies the signature. The rig is preserved at
`docs/08-agents_work/renders/2026-08-03-two-places/study.mjs.txt`.

Two capture rules, each of which has already cost this project real time:

- **Full-page captures lie about `position: fixed`.** They paint the dock at its
  viewport offset inside the full document height. Viewport captures only.
- **Let React hydrate before you touch the DOM.** A candidate rendered in this
  session was silently overwritten by hydration and photographed as if it were
  the new design. The rig now asserts a marker node survives.

And the standing rule: **measure to find problems, look to confirm fixes.** The
§5 idea in §0.1 passes every metric anyone thought to encode — equal area,
nothing larger, no colour, no ranking — and fails on sight.

## 4. Open questions for the founder, via CEO

1. **Today holds one item, not a pair** (§0.2). This contradicts the packet's
   framing and it is the largest single decision in this plan.
2. **Stamp wording** (Brief A rule 4): names rather than the *his/her* of
   DESIGN-DIRECTION §7's example. Following the code's own precedent; one edit
   to reverse.
3. **`type-masthead` on The Book** (§1.2) extends a token `globals.css` reserves
   for the login door.
