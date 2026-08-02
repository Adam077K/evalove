---
date: 2026-08-02
from: ceo (session ceo-4-1785631505)
to: design-lead, frontend-engineer, product-designer, design-critic
status: LOCKED — founder-directed. Supersedes DESIGN-DIRECTION-V6.md.
authority: founder set §1, §2 and §7 directly. Everything else is the team's to resolve.
supersedes: docs/04-features/DESIGN-DIRECTION-V6.md
companion: docs/08-agents_work/handoffs/2026-08-02-REIMAGINE-BRIEF.md
---

# Design Direction — Eva & Adam

Read the REIMAGINE-BRIEF first. It tells you what to build and why the last two
attempts failed. This document tells you what it looks like, and it exists
because the founder looked at attempt #2 and named the exact mistake.

---

## 0. What went wrong, stated precisely

The founder has a folder of five references. Four are saturated consumer apps —
pink, hot pink, purple, peach. One is a restrained white furniture site.

Attempt #1 copied the restrained one and got a lifeless book.
Attempt #2 copied the saturated four and got, in the founder's words, vibe-coding
AI slop.

Both attempts made the same error in opposite directions: **they treated the
references as palettes to adopt.** They are not. The founder's correction, in his
own words:

> *"None of the images in the reference folder and the UI in there — you should
> take the colors. Use the colors that, you know, minimalistic white, and use the
> pictures and the visuals that we use to add colors and personality. Use fonts.
> Use layouts. Use motion to create a special feeling when you're visiting the
> website."*

So: **take the layouts, the components, the typography, the motion and the
structural ideas from all five. Take the color from none of them.**

The color comes from Eva and Adam's own photographs. That is the whole idea. Two
people who barely overlap in waking hours, whose faces are the only saturated
thing in the product.

---

## 1. The colour law — revised 2026-08-02 after adversarial review

**This section was rewritten.** The first version said: *delete every photograph
and what remains must be near-black ink on white.* The adversarial reviewer
(P4) took it apart correctly, and the founder accepted the correction.

The flaw: in a product whose entire photograph supply is two people, one of whom
is always asleep, **"no photograph on screen" is not a stress test — it is
Tuesday at 3pm.** The old law took the app's emptiest state, wrote it into
statute, and called it the standard. It also misread the reference: SORDJATI is
not a restrained page, it is a *photograph-dominated page with restrained
chrome*, and its photographs are ~60% of the composition and never absent. Ours
are phone snapshots that arrive unpredictably and often not at all.

### The law, restated

> **Restraint lives in the chrome. Warmth lives in the paper.**
> A screen with no photograph on it must still feel like somewhere worth being.

Photographs remain the only *saturated* thing on screen and still carry the
colour. What changes is that the page underneath them is no longer required to
be dead when they're absent.

### Warm is not washed — read this twice

The danger in "warmth" is that it reads as permission to reinstate exactly what
was rejected. It is not. The distinction is absolute:

| Allowed — warmth in the material | Banned — warmth as an effect |
|---|---|
| A single flat warm canvas value: bone, paper, warm off-white | Gradients of any kind, anywhere |
| Warm-tinted neutrals in text and hairlines (warm greys, never blue-greys) | Animated blobs, mesh, aurora — `AuroraBackdrop` is deleted |
| Paper-grade texture: a fixed, `pointer-events-none` grain at ≤3% | Glow of any colour, on anything |
| Warm-tinted shadows — wide, soft, barely there | Glass / `backdrop-blur` as a surface style |
| Depth from real elevation and hairline rules | Coloured fills standing in for hierarchy |

The test for any proposed warmth: **does it come from the material, or is it
applied on top?** Paper is warm because of what it is made of. v6 was warm
because someone painted light onto it. The first is allowed; the second is what
the founder rejected twice.

Still absolute, unchanged:

- Surfaces separate by hairline rules and space, not by coloured fill.
- Photographs are never dimmed, tinted, duotoned or washed. Full strength, always.
- No emoji. No hearts. No gamified affection-tokens — R2 found these, **not**
  saturation, are what actually makes couple apps read as cheesy.

### Night is a primary surface, not a variant

`library.json` defines **w1 — "She's in bed, he's awake" (IL 05:00–09:00 /
NYC 22:00–02:00) — as "the biggest window you have."**

So the single largest overlap window in their entire week is one where Eva is in
bed with the lights off. Night mode is therefore not a theme toggle to be built
last; it is the surface with the most sessions in the product. **Design night
first, or at minimum alongside day — never after.** A white-paper canvas has
nothing to say about this window, which is exactly the contradiction the old law
failed to notice.

Night is warm too: a deep warm neutral, not plum, not black, not inverted day.

### The single carve-out — the authorship edge

The founder chose to keep a per-person hue, at hairline scale only:

- Eva and Adam each get **one desaturated hue** (target saturation under 45%).
- It appears **only as a ≤2px edge** on the left of something that person made,
  and as a small dot in dense lists where an edge won't fit.
- It is **never** a fill, never a text colour, never a background, never a
  gradient, never a glow, never a button.
- Eva's hue is defined first. (Founder rule: Eva's name comes first everywhere.)

Two hairlines of colour on a white page. That's the entire chromatic system
outside of photographs.

---

## 2. What each reference actually contributes

Every one of these is listed **palette-stripped**. If a note says "card", it
means the geometry and the information hierarchy, not the pink.

### `8d075fd5…` — SORDJATI, the furniture site
**This is the palette and typography model.** Note what it does: white page,
enormous wordmark set edge-to-edge as the masthead, and two photographs that
carry one hundred percent of the colour in the composition — rust velvet and
olive green. Delete those two photos and the page is black on white. That is
exactly our law, already executed by someone competent.

Take: the edge-to-edge display type as structure rather than decoration. The
extreme scale contrast — a 120px masthead against 11px uppercase meta labels,
with almost nothing in between. The photo pair where one carries white text
overlaid and the other takes a caption below. The black pill button with the
arrow nested in its own inner circle. The `+` accordion with no container box.
The small pill label sitting beside a circular arrow button.

### `24199150…` — the events app
Take: the **vertical date rail** down the left edge, with an active pill that can
span more than one date. That is very close to what a two-timezone spine needs,
where one of them is on a different calendar date for seven hours a day. Also:
the chip filter row, the two-weight headline that changes weight mid-sentence,
the floating dock as a detached pill rather than a bar glued to the bottom edge,
poster cards with type baked into the image, the avatar cluster.

### `original-62c7…` — the Time Capsule app
**Conceptually the most important of the five.** Sealed things opened later is
the literal shape of this couple's life — one of them is always awake to leave
something the other finds hours later.

Take: the capsule as an object with a title and a date. The **voice waveform
player** — asynchronous voice is stronger than text across a seven-hour gap. The
month calendar with markers on days that hold something. The paired big-number
stat. The photo strip living inside a capsule card.

### `6b2ad671…` — the memories app
Take: the **first-open screen built from scattered photo cards** at varying
rotations and depths, rather than an illustration. Their real photos, floating.
The album tile with title and count set over the image. The send-flow preview
card. The `+9` overflow tile.

### `9e22d054…` — Lunara, the reading app
Take: the **fanned card stack** with real depth and rotation — physical, holdable,
the closest thing here to a keepsake tin. The segmented tab control. The editorial
serif used for warmth in headings while the UI stays grotesque.

---

## 3. Kill list — currently in `apps/web/app/globals.css`

The v6 system is the rejected direction rendered as tokens. It goes.

| Token / pattern | Why it dies |
|---|---|
| `--canvas: #faf6fb` | Tinted canvas. Must be white / bone. |
| `--eva`, `--adam`, `--us` at full saturation | Become hairline-only, desaturated. `--us` is deleted — jointness is shown by composition, not a third hue. |
| `--grad-eva/-adam/-us/-sky` | No gradients. All four deleted. |
| `--aur-rose/-violet/-amber` | The aurora backdrop is the single biggest slop signal. Deleted. |
| `--glow-eva/-adam/-us` | No glow. Deleted. |
| `--e1/2/3` plum-tinted shadows | Retint neutral, reduce opacity hard. |
| `--photo-dim: brightness(0.86) saturate(0.96)` | We never dim a photograph. Deleted. |
| `--glass`, `--glass-strong`, `--glass-edge` | Glassmorphism is attempt #2's fingerprint. Deleted unless a reviewer is convinced by a specific case. |
| Night mode `#140e1e` plum | Night is genuinely half this product — Eva reads it at 11pm. Keep a night mode; rebuild it as true neutral, not plum. |

Keep: `--ease-out`, `--ease-io`, the four durations, the radius scale. Those were
never the problem.

### The single highest-leverage deletion

`AuroraBackdrop` is mounted in `apps/web/app/(app)/layout.tsx` — meaning the
three-blob animated gradient wash sits behind **every authenticated surface**,
not just login. One component in one file is responsible for the tint on all
seven screens.

Deleting it is the largest single step toward the colour law in §1, and it is a
one-line change. Do it first; everything else gets easier to judge once the wash
is gone.

---

## 4. Typography

The fonts currently in the repo — Outfit and Fraunces — are not themselves the
failure, and both are explicitly permitted by our own taste skills. **The failure
was scale, not family.** v6 has no extreme contrast; everything sits in a narrow
mid-range, which is what makes a page read as templated.

Adopt SORDJATI's discipline: a very large display size and a very small
uppercase meta size, with little in between. Set the body measure at 45–90
characters. Ship real typography — curly quotes, en dash for ranges, em dash for
breaks, one space after punctuation. `~/.claude/skills/ui-typography` is
enforcement-mode; follow it silently.

One trap, since this is React: **`’` does not work in JSX text content.** It
renders literally. Paste the real UTF-8 character into the source.

Design-lead: re-test the Outfit/Fraunces pairing against the references at
correct scale before changing families. If a change is warranted, argue it with
specimens, don't just swap.

---

## 5. Motion — where the "special feeling" comes from

The founder asked specifically for motion to make the app feel like a place worth
visiting. The references are static images, so motion comes from our skills and
from real shipped products.

These numbers are **measured**, not asserted. R4 read them out of the shipped
source of Vaul and Sonner — Emil Kowalski's own libraries, the ones our
animation skill was derived from — so they are citable rather than inherited.

| Motion | Value | Provenance |
|---|---|---|
| Press | 150ms `cubic-bezier(0.22,1,0.36,1)`, `scale(0.97)` | Already correct in `globals.css`. Keep. |
| UI transition | 220–320ms `--ease-out` | Already correct in `globals.css`. Keep. |
| Sheet / drawer | 500ms `cubic-bezier(0.32,0.72,0,1)` | **Measured** from Vaul's source. Matches our skill exactly. |
| Toast | 300ms in / 200ms swipe-out | **Measured** from Sonner's source. |

Also: `ease-out` by default, entrances ease-out and exits ease-in; `transform`
and `opacity` only; interruptible; never animate keyboard-initiated actions;
stagger ≤50ms.

### Two places our animation skill is wrong

Both found by reading shipped source. Follow the source, not the skill.

1. **`prefers-reduced-motion`.** Our skill says degrade to opacity-only. Sonner's
   own CSS does a full `transition: none / animation: none` removal. Sonner ships
   to far more users than we ever will.
2. **The blanket "≤300ms UI transitions" rule** does not survive contact with
   Sonner itself — 400ms container transition, 300ms enter keyframe. Treat 300ms
   as a strong default, not a law.

### The signature moment already exists

`apps/web/components/home/SealedCard.tsx` is a real spring-based sealed-to-opened
flip. It is the best interaction in the codebase and it is **exactly** the moment
R3's research points at: opening something left while you were asleep, where
asynchrony turns into a gift instead of a delay.

It is currently buried under a violet gradient fill and a shimmer sweep.

**So this is not a build. It is an excavation.** Strip the decoration, keep the
spring, and give it the 500ms drawer easing above with the background receding
Vaul-style behind it. One memorable moment beats micro-motion sprayed across
every component — `frontend-design` requires exactly one such anchor, and this is
it, and it is already half-built.

**The seal must be the real gap.** Never a manufactured timer, never a global
reveal clock — a fixed clock structurally privileges one partner's morning over
the other's, which with seven hours between them is broken by construction.
Unlock-on-arrival, no visible countdown.

---

## 6. Skills — what governs, what is suspended

Load and follow: `emilkowal-animations`, `~/.claude/skills/ui-typography`,
`~/.claude/skills/12-principles-of-animation`, `frontend-design`,
`high-end-visual-design` (structure and depth sections), `wcag-audit-patterns`.

`design-taste-frontend` and `stitch-design-taste` are written for premium B2B
SaaS. Their craft rules apply. **Two of their defaults are overridden here:**

1. Their "one accent colour" rule is replaced by the colour law in §1, which is
   stricter — zero accent, plus two hairlines.
2. Their density and card guidance assumes a dashboard. This is a photo product
   for two people; photographs get scale and air.

Their anti-slop lists — no glow, no gradient text, no pure `#000000`, no
oversaturated accent, no three-equal-card row, no filler UI copy, no emoji —
apply in full and align with §1 rather than fighting it.

Text stays at WCAG AA whatever happens.

---

## 7. The surfaces to build — revised 2026-08-02

**Superseded.** This section originally listed three founder-chosen surfaces:
Today, The Gap, Saturday. After the research and persona board, CPO argued for
two reversals and the founder accepted both. See `PRODUCT-VISION-V2.md` §3.

### Build two places, not three

| Surface | What it is |
|---|---|
| **Today** | Not a tab — **it is what the app is when you open it.** The last thing the other one left, already there, owing no reply. |
| **The Book** | Everything either of them has ever left. An object that gets better with age and comes back on the day it matches. **Pocket is a locked drawer inside it**, not a third place. |

### The Gap is a stamp, not a room

A clock is correct on day one and on day four hundred, and correctness gives
nobody a reason to return. It was also built on the one ache two independent
research passes searched for and could not find — the date-crossing came back
LOW confidence in R1 and LOW-MEDIUM in R1b after nine dedicated threads.

So the two-timezone engine works on **every item, everywhere**:

> *left while Eva was asleep · 5:12 his morning · 22:12 her night*

`lib/shared-day/` does more visible work this way, not less — on every screen
rather than one screen nobody revisits.

**And it gets the thing that is actually evidenced: DST asymmetry.** For the ~26
days a year the offset is 6 hours instead of 7, the clock line reads differently
and says so plainly. No banner, no countdown, no push — the register is a fact,
not an event. R1b found this as a real, named, recurring dread (*"the difference
in our timezones increasing from 7 to 8 hours is painful"*, 61 upvotes), and P3
at three years in says it never dulls.

### Saturday: the day is protected, the surface is cut

The premise was that their one shared day needs help. R1b looked and found the
opposite — the corroborated pain is having **no** shared day, while couples who
have one build their week around it without complaint. Even P5, arguing its own
surface as hard as it could, concluded most of those hours should have the app
saying nothing at all.

The activity library stays as **on-demand rescue, never a weekly default**.
Reached for once or twice a month it lasts past a year; used weekly, the ~20–24
both-alert items exhaust in ~4.5 months — almost exactly the category's observed
churn point.

### This is an excavation, not a demolition

R4 walked all seven surfaces of the running app. Underneath the gradient there
is real, specific machinery: Today's three-state day model out of
`lib/shared-day`, a live NOW-badged time-window chip with a written empty state,
a genuine dropped-connection retry, and a working spring-based sealed-note open.
None of it survives first glance because the first glance is the aurora.

**The defect is a colour and surface pass over working machinery.** Delete
`AuroraBackdrop`, rewrite the tokens, and the good work starts showing. Do not
touch `lib/shared-day/` behaviour — 109 tests, four DST transitions. 251 tests
pass today; keep them passing.

---

## 8. How this gets judged

1. **The Tuesday test** (replaces the old grayscale test) — render the surface
   with **no photograph on it at all**, because that is an ordinary afternoon,
   not an edge case. Is it still somewhere worth being? If it reads as an empty
   container waiting to be filled, it fails.
2. **The logo test** — screenshot it, remove the wordmark. Would you know it was
   this app? (`frontend-design` calls this the differentiation anchor.)
3. **The 11pm test** — does it work for Eva in New York at 11pm with the lights
   off, on an iPhone, installed to the home screen?

   **This test needs enforcing, because the person who can't run it is the one
   building it.** Adam will live his 5am hundreds of times and will never once
   live Eva's 11pm. Every instinctive "does this feel right" check runs from his
   side of the gap, so the product drifts toward fitting him exactly and
   approximating her — invisibly, because from inside it only ever feels better.

   Concrete consequences, all of them cheap:
   - Nothing ships until it has been walked as the **exhausted** one at the end
     of a long day, not the alert one at the start of a fresh one. The same
     reveal that is savourable at 5am is friction at 11pm.
   - Notification quiet-hours must be verified against **both** zones. This is
     the bug most likely to exist and least likely to be noticed, because it will
     only ever be debugged for the schedule the builder actually lives.
   - **Never count or display who left more.** Adam's slack morning against Eva's
     rushed commute-prep morning means he can leave more, and richer, without it
     meaning anything about how much he loves her.
   - If the product ever visualises who spoke first, note that Israel's calendar
     flips first every single day — Adam would hold first-mover status
     permanently, by geography.

   "Eva's name first" is a real countermeasure but it fixes display order, not
   any of the above.
4. **The slop test** — the founder's. Two directions have already failed it.

Nothing marked private appears in any ordinary view, thumbnail, preview, cache or
notification. GPS is stripped from every photo before upload. Already built;
don't break it.

No streaks. No guilt. Nothing that makes a missed day feel like failure.
