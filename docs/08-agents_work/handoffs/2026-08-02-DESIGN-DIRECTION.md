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

## 1. The colour law — this is the one non-negotiable

> **Remove every photograph from a screen. What remains must read as
> near-black ink on white.**

That is the acceptance test. It is binary and any reviewer can run it in ten
seconds: screenshot the surface, delete the image layers, look at what's left.
If what's left is tinted, gradient-washed, glowing, or has a coloured surface —
it fails, no discussion.

Consequences, spelled out so nobody has to interpret:

- The canvas is white or a bone off-white. Not lilac-white. Not `#faf6fb`.
- Surfaces are white on white, separated by hairline rules and space, not by fill.
- No gradients on any surface, ever. No `--grad-sky`, no mesh, no aurora blobs.
- No coloured shadows. Shadows are neutral, wide, and nearly invisible.
- No glow. Glow is the single loudest AI tell in the rejected build.
- Photographs are never dimmed, tinted, duotoned or overlaid with a colour wash.
  They are the only saturated thing on screen and they run at full strength.

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

Non-negotiable craft floor, from `emilkowal-animations` and
`12-principles-of-animation`:

- `ease-out` by default. Entrances ease-out, exits ease-in.
- UI transitions ≤300ms. Sheets and drawers 500ms on `cubic-bezier(0.32,0.72,0,1)`.
- `scale(0.97)` on press. Every interactive element gets an active state.
- Animate `transform` and `opacity` only.
- Interruptible. Never animate keyboard-initiated actions.
- Honour `prefers-reduced-motion` — degrade to opacity, don't strip motion entirely.
- Stagger ≤50ms per item.

**And one signature moment.** The app needs a single piece of motion it is
remembered for, and it should be the thing that is true about these two people:
**opening something that was sealed while you were asleep.** That is the Time
Capsule idea, and it is the moment where asynchrony becomes a gift instead of a
delay. Spend real craft there. One memorable moment beats micro-motion sprayed
across every component — `frontend-design` requires exactly one such anchor, and
this is it.

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

## 7. The three surfaces to build

Founder-chosen:

| Surface | What it answers |
|---|---|
| **Today** | What's waiting for you right now — what she left while you slept. |
| **The Gap** | The two-clock spine. Seven hours, two calendar dates, built on `lib/shared-day/`. This is the one thing no other product has. |
| **Saturday** | Their single shared day off, one day a week. This is where the 98 researched date ideas finally have a reason to exist. |

Do not touch `apps/web/lib/shared-day/` behaviour. 109 tests, four DST
transitions, and it is the app's only real differentiator. 251 tests pass today;
keep them passing.

---

## 8. How this gets judged

1. **The grayscale test** — delete the photos, is it black on white?
2. **The logo test** — screenshot it, remove the wordmark. Would you know it was
   this app? (`frontend-design` calls this the differentiation anchor.)
3. **The 11pm test** — does it work for Eva in New York at 11pm with the lights
   off, on an iPhone, installed to the home screen?
4. **The slop test** — the founder's. Two directions have already failed it.

Nothing marked private appears in any ordinary view, thumbnail, preview, cache or
notification. GPS is stripped from every photo before upload. Already built;
don't break it.

No streaks. No guilt. Nothing that makes a missed day feel like failure.
