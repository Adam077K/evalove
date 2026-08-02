---
title: Design Direction — Eva & Adam
owner: design-lead
date: 2026-08-02
revision: 5 — native scroll-driven page turn is the foundation (both on iOS 26); §12 re-scoped as a feel spike
status: direction — ready for engineering brief; nothing gates the spike, it can run now
scope: name, icon, visual system, the book, the cover, dates, the daily spread, seeding, private items
depends_on: docs/04-features/LDR-APP-PRD.md §3A
---

# Design Direction — Eva & Adam

*A private PWA for two people. New York and Tel Aviv, six or seven hours apart depending on the month (§13).*

---

## 0. The thesis

The brief holds two words that pull apart: **cute** and **professional**. The compromise version of this app — soft pastels, rounded everything, a heart somewhere — fails both. So does the other compromise: a clean neutral product UI with a photo grid in it, which is professional and means nothing.

The synthesis is a **well-made notebook**, not a scrapbook.

A Smythson diary, a Leuchtturm, a Japanese photo album with corner mounts. These objects are *sober*. The binding is disciplined, the paper is plain, there is no decoration anywhere on the object — and they are among the warmest things people own, because everything tender about them is in the **contents**, not the container. That is the rule this whole design runs on:

> **The interface never expresses emotion. Only the content does.**

No hearts in the chrome. No emoji in the nav. No confetti. The app is a vessel, built to a high standard, and the two of them fill it.

Warmth comes from three places, and only these three:

1. **Materials** — warm paper, ink that is not black, real page edges.
2. **Physics** — things move like matter. Weight, momentum, resistance at the binding.
3. **Their own language** — the shelf names are already written in their voice. The typography's job is to *set* that language, not replace it with icons.

Bad skeuomorphism reads as 2011 iOS because it simulated **materials photographically** — stitched leather, torn edges, bevels imitating light. The modern way to build a real object is to simulate **behaviour** instead. A rigid page that follows your thumb at 60fps feels more real than a beautifully curled page that stutters. Spend the tactility budget on motion, almost none on texture.

CPO's locked thesis — *a private object that always knows what time it is in both cities, and because it knows, it never asks them to browse, decide, or explain themselves* — sharpens this. An object that knows things does not present a menu.

---

## 1. The name — Eva & Adam

**Locked.** The founder rejected the shortlist (*Meanwhile*, *Erev*, *Quire*) in favour of their own two names, and chose a **title-page treatment over a brand**. That is the stronger answer, and it is the same instinct as §0 taken further: a book is titled, not branded.

**Eva's name comes first, everywhere.** This is a system-wide ordering rule, not a string — see §2.3.

### Setting the title

`Eva & Adam` is set the way a title page sets two names, never as a wordmark:

- **Fraunces**, `wght 400`, `WONK 1`, `opsz 120`. Not bold. Not tight.
- Letterspacing `0` to `+0.01em`. **Never optical-tightened.** A startup wordmark kerns names together; a title page lets them stand apart.
- **`Eva` in `--ink-eva`, `Adam` in `--ink-adam`, the ampersand in `--ink-soft`.**
- The ampersand is **italic** — the classic title-page ampersand, and Fraunces has a good one. This one detail is most of the difference between "title page" and "logo."
- It appears in exactly two places: the title page (§3.5) and the app icon. Nowhere else. No header lockup, no splash wordmark, no footer.

### The icon — E & A

The icon is the two initials, in order.

- `E & A` on `--paper`, centred, in Fraunces with the italic ampersand. Same three colours as the title.
- Glyphs sized so the trio spans ~62% of the icon width; keep **12% clear on every edge** for iOS's squircle mask.
- **Three variants:** light (`#F6F1E9` ground), dark (`#26221F` ground with the lifted inks `#D48CA5` / `#8FB3D9`), and tinted (grayscale mask, letters as the mask — iOS composites the tint itself).
- Manifest `name`: `Eva & Adam`. `short_name`: `Eva & Adam` — 10 characters, no truncation on iOS.
- **No** rounded-rect drawn into the asset (iOS masks it), no gradient, no shadow, no glyph in a badge, no book illustration.

### On the resonance — one paragraph, then never again

They are named Eva and Adam. The Eden association is real, and the founder chose their names, not a myth. It gets **one expression and no more**: the book's own ribbon — the third one, belonging to neither of them — is a muted garden green (`--ink-book`, §2.1). That is the entire undertone.

**Banned outright:** leaves, vines, apples, serpents, garden or foliage imagery, the word *Eden* anywhere in the product or the codebase, and any "first man / first woman" framing. If a future contributor discovers the pun, this paragraph is the answer: it was noticed, and it was deliberately spent on one ribbon.

---

## 2. Visual direction

### 2.1 Colour

Two people own two inks. **Every handwritten thing in the book is set in the colour of whoever wrote it** — captions, notes, bookmarks, and the primary button under your own thumb. No avatars, no name badges, no chat bubbles. You know who wrote it because you know the colour of their ink. This is the signature of the whole system.

**Ink assignment is fixed and not user-selectable.** It is an identity, not a preference; making it changeable would undo the point.

**Day (light)**

```css
--paper:        #F6F1E9;  /* the page — warm uncoated stock */
--paper-edge:   #E8DFD1;  /* fore-edge lines, rules, frames */
--surround:     #EDE6DB;  /* around the book (overridden on the cover — §5) */
--ink:          #231F1C;  /* text — near-black with a brown bias, never #000 */
--ink-soft:     #6B6259;  /* captions, timestamps, metadata, the pocket rule */
--ink-eva:      #8E4A63;  /* rose-oxblood */
--ink-adam:     #2C4B6E;  /* deep marine blue-black */
--ink-book:     #5E6B4F;  /* muted garden green — the book's own ribbon, §1 */
```

**Night (dark)**

Dark mode is **half the product**. W1 is the biggest window they have and Eva is in it with the lights off. The rule: **do not invert the book — dim the light on it.** The page stays a page; the room around it goes dark. Far kinder at 2 a.m. than white-on-black, and it preserves the object.

```css
--paper:        #26221F;  /* the page, unlit — warm charcoal-brown */
--paper-edge:   #3A342E;
--surround:     #151311;  /* the dark room */
--ink:          #EDE5D8;  /* warm off-white — never #FFF, it halates at night */
--ink-soft:     #A69C8E;
--ink-eva:      #D48CA5;
--ink-adam:     #8FB3D9;
--ink-book:     #9CAA88;
```

Contrast, computed (WCAG 2.1; normal text 4.5:1, non-text controls 3:1):

| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--paper` (day) | 15.1:1 | AAA |
| `--ink-soft` on `--paper` (day) | 5.31:1 | AA |
| `--ink-eva` on `--paper` (day) | 5.64:1 | AA |
| `--ink-adam` on `--paper` (day) | 7.99:1 | AAA |
| `--ink-book` on `--paper` (day) | 5.06:1 | AA |
| `--ink` on `--paper` (night) | 12.6:1 | AAA |
| `--ink-soft` on `--paper` (night) | 5.83:1 | AA |
| `--ink-eva` on `--paper` (night) | 6.08:1 | AA |
| `--ink-adam` on `--paper` (night) | 7.23:1 | AAA |
| `--ink-book` on `--paper` (night) | 6.40:1 | AA |
| `--paper` on `--ink-eva` fill (button) | 5.64:1 | AA |
| `--paper` on `--ink-adam` fill (button) | 7.99:1 | AAA |

Everything clears AA before QA runs. Do not let anyone "soften" `--ink-soft` — it is at the floor. **Consequence, and it is load-bearing: you may never express a state by lowering text contrast** (§8), because there is no headroom to do it in.

**Photos at night.** Photos stay bright; they are the point. But full brightness at 2 a.m. is what makes her put the phone down. Ship **Dim**, on by default in Night: `filter: brightness(0.82) saturate(0.95)`, released on press-and-hold.

**Mode switching.** Follow `prefers-color-scheme` with a manual override persisted per device. Do **not** switch on local clock — she will sometimes be up at 3 a.m. in daylight mode by choice, and an app that overrides that is an app with opinions.

### 2.2 Typography

**Two families. Both serif. No sans-serif anywhere in the product.**

The deliberate risk. Justification: it is a book, and books do not have UI sans. The instant a `-apple-system` label appears next to a page of Literata the object breaks and it becomes an app again. It is also the fastest way to stop this looking like every other product on the phone.

| Role | Face | Why |
|---|---|---|
| **Display** — the title, shelf names, page headings, dates, the suggestion | **Fraunces** (variable, self-hosted) | Old-style warmth with real quirk. Its `SOFT` and `WONK` axes exist to add character without cuteness — `WONK 1` at large sizes gives the flick in the *g* and *y* that makes it feel drawn. Not Playfair, not a Didone. Good italic ampersand (§1). |
| **Text** — captions, descriptions, all reading | **Literata** (variable, self-hosted) | Commissioned for Google Play Books, designed for **long-form reading on screens**. Sturdy at 17px, holds at low luminance, has its own slight quirk so it does not read institutional. Real oldstyle and tabular figures. |

**Guard against the failure mode:** all-serif plus dense columns and hairline rules equals *broadsheet*, a known generated-design cliché. The guard is layout, not type — generous margins, one column, macro-whitespace. Serif in an airy modern layout reads as a book; serif in a tight ruled grid reads as a newspaper.

| Token | Face / settings | Size / leading |
|---|---|---|
| `display` | Fraunces `wght 500`, `opsz 120`, `SOFT 50`, `WONK 1`, `letter-spacing -0.02em` | 40 / 44 |
| `heading` | Fraunces `wght 500`, `WONK 1` | 24 / 30 |
| `entry-title` | Fraunces `wght 500`, `WONK 0` | 17 / 24 |
| `eyebrow` | Literata `wght 600`, uppercase, `letter-spacing 0.12em` | 11 / 16 |
| `body` | Literata `wght 400` | 17 / 25 |
| `caption` | Literata `wght 400`, `oldstyle-nums` | 13 / 19 |
| `numeral` | Literata, `tabular-nums lining-nums` | 13 / 19 |

Mobile-first; scale ~1.15× at `md` and above. Not negotiable:

- Line length **60–66 characters**. `max-width: 34rem` on any text column.
- **Oldstyle figures** for dates, times under photos, and counts. Tabular lining figures **only** in the dial, where digits must not jitter.
- Curly quotes and apostrophes, em dashes for sentence breaks, en dashes for ranges and the city pair. Never `--`.
- All-caps only in `eyebrow`, letterspaced `0.12em`, never over one line.
- `font-feature-settings: "kern" 1, "liga" 1` globally.
- Nothing is both bold and italic. Italic for the soft register; weight for structure.

**Budget:** two variable faces, self-hosted, subset Latin + punctuation. Preload **Literata only**; Fraunces on `font-display: swap`. ≤ 160 KB woff2 total.

**English only.** No RTL, no bilingual fork, no Hebrew face. A Hebrew edition would be a **design fork, not a toggle** — RTL reverses the page-turn direction, mirrors the spread, and swaps which leaf is Eva's, which unravels §2.3 and §6. If it ever comes up, it is a new project.

### 2.3 Their names, and the order they go in

The app calls them by name. *"Eva's on her commute."* *"Adam's awake."* Never pronouns, never second person. Placeholders are retired — write the real strings.

**Eva's name comes first, everywhere.** Not cosmetic; carry it through the system:

| Where | Order |
|---|---|
| The title and the icon | `Eva & Adam` · `E & A` |
| The daily spread (§6) | Eva's photo on the **verso** (left leaf), Adam's on the recto |
| The two clocks on the dial (§5) | New York first, then Tel Aviv |
| The ribbons (§4) | Eva's is the **upper** ribbon; Adam's below it; the book's green ribbon below both |
| Any list, sentence, table, or legend | Eva, then Adam |

**Where a sentence scans better the other way, rewrite the sentence — do not reorder the names.** This has exactly one consequence in the existing content, and it works:

```
He’s fading, she’s just off work   →   Eva’s just off work, Adam’s fading
```

The rest of the shelf names already lead with her, or name only one person:

```
She’s in bed, he’s awake  →  Eva’s in bed, Adam’s awake
Her lunch break           →  Eva’s lunch break
His Friday off            →  Adam’s Friday off
Saturday — go long        →  unchanged
One of us can’t look at a screen  →  unchanged — “one of us” is either of them, and warm as it is
```

**A note on the rationale, so nobody builds logic on the wrong version of it.** The order is *identity, not chronology*. It was put to me that her photo genuinely precedes his in the shared day; checked against the clock, the opposite holds — Adam's named day begins seven hours before Eva's (his midnight is her 17:00 the previous evening), so the 31-hour shared day **opens on Adam's side and closes on Eva's**. This does not weaken the decision at all, and it has a real design consequence in §6.2 that is much better to know than to discover. **The left leaf is Eva's by fixed rule, whoever posts first.**

**Typographic rules for names:**

1. **Never ellipsize a name.** Anywhere, ever. Wrap or reflow. `text-overflow: ellipsis` on a name field is the default an engineer reaches for — constrain the container, never the string. (`Eva` and `Adam` are short, which makes this cheap to honour and easy to forget.)
2. **Names always render in that person's ink**, never in `--ink`. That is what lets a sentence containing both be parsed at a glance — the colours do the work.
3. Give name-bearing lines two lines of room and `text-wrap: balance`.
4. **No window codes.** `W1`, `W3`, `W7` never appear in the UI, a tooltip, or any debug affordance that could ship.

### 2.4 Texture and depth — where the paper stops

**Far** on physics. **Medium** on paper structure. **Light** on grain. **Zero** on simulated materials.

**Yes:**
- **One** noise layer for the whole app: SVG `feTurbulence`, `baseFrequency 0.8`, `position: fixed; inset: 0; pointer-events: none; z-index: 40`, opacity `0.025` Day / `0.035` Night, `mix-blend-mode: multiply` / `overlay`. Fixed, never inside a scrolling container.
- **The fore-edge**, drawn honestly: 3–6 stacked 1px `--paper-edge` lines at decreasing opacity, offset 1.5px. The count is a function of how many pages the book actually has.
- **The gutter**: `linear-gradient(to right, rgba(0,0,0,0.14), transparent 28px)` Day, `rgba(0,0,0,0.50)` Night, plus a 1px `--paper-edge` centreline.
- **One shadow recipe**, warm-tinted: `0 1px 2px rgba(58,44,32,0.05), 0 12px 32px -12px rgba(58,44,32,0.18)`.
- **Photo corner mounts.** The single skeuomorphic flourish allowed, because corners are how photographs actually attach to album pages. They do a great deal of work in §6 and §7.
- **Ribbon bookmarks** (§4), **thumb-index tabs** (§4), **tipped-in slips** (§5.2), **the rear pocket** (§10). All real bookbinding, all carrying function.

**Radius discipline:** pages have **2px** corners. Paper is not rounded. Photos get **1px**. The moment page corners go to `rounded-xl` this is a card UI and the object dies. Radius is for controls only: pill for the one primary action per screen, 8px for the rest.

**No, and these were considered:** leather, cloth weave, wood, shelf backgrounds; stitching, deckle edges, tape, washi, paperclips; photographic paper texture as a background image; bevels, inner glows, faux-3D buttons, letterpress text shadows; handwriting or script typefaces (their handwriting is the *ink colour*); coffee stains.

### 2.5 Motion — one object, one physics

```css
--ease-page: cubic-bezier(0.32, 0.72, 0, 1);  /* anything that moves like matter */
--ease-ui:   cubic-bezier(0.2, 0, 0, 1);      /* fades and small state changes */
```

- **Two easings. The whole vocabulary.** No `linear`, no `ease-in-out`, no third curve.
- **Durations:** UI 180 ms · sheets 400 ms · slip replacement 240 ms · photo drop 280 ms · pocket flap 320 ms. The page turn is **velocity-driven, not duration-driven** (§3).
- **Press:** `scale(0.97)`, asymmetric — 90 ms down, 180 ms up.
- **Only `transform` and `opacity` animate.** Shadows animate by changing the `opacity` of a pre-existing gradient layer.
- **`will-change: transform`** on the leaf being dragged, removed on settle.
- **Everything is interruptible.** A page mid-turn is grabbable from wherever it is. This separates "real object" from "animation playing."
- **`prefers-reduced-motion`:** the scroller stays — the gesture and the scroll position must not change — but the leaf's keyframes swap from `rotateY` to an opacity cross-fade on **the same timeline**. Turning still tracks the thumb; it just stops rotating in 3D. The riffle becomes an instant jump; the slip swaps on opacity. Reduced, never deleted, and the spatial model survives intact.

---

## 3. The book

### 3.1 Form factor

**Portrait phone shows one page at a time**, gutter shadow pinned to the left edge so the book always continues off-screen. **Landscape and desktop show the true two-page spread** with the spine in the middle — the reward for a bigger screen, and why desktop is not a stretched phone.

Content binds to a **leaf index**, not a screen, so a photo lands on the same leaf on both devices. This matters more now than in earlier revisions: the daily pair (§6) is *authored* as a spread and read on a portrait phone as two consecutive leaves. Eva's is always the first of the two.

### 3.2 Turn mechanics

**Scroll-driven `animation-timeline`, native.** Not JavaScript. Not WebGL mesh curl.

The turn is a horizontal scroller whose scroll progress drives a two-sided rigid leaf's `rotateY` through keyframes. **Momentum, interruptibility and off-main-thread compositing come from the platform**, which is precisely what P1 was afraid of losing.

**Both Eva and Adam are on iOS 26, so this is the foundation and there is no JavaScript turn implementation.** `@supports (animation-timeline: scroll())` stays as a guard on principle, but nothing is built, specced or budgeted behind the `else` — no dual maintenance of the signature interaction, ever.

Mesh curl stays rejected for the original reason: per-vertex deformation means a texture upload per page per turn, and with real photographs that is a memory and jank risk on the one interaction that must never stutter. Apple demoted the iBooks curl from default.

1. **Grammar.** Drag-follow primary; tap secondary; fling a shortcut. Drag anywhere on the page pulls the leaf; tap the outer 15% edge strip turns one page.
2. **Mapping.** Scroll progress 0 → 1 across one page width drives `rotateY` 0 → 180deg, `transform-origin: left center` portrait, spine-centred landscape.
3. **The lift — do not skip this.** The first ~2% of progress (~8px at phone width) does *not* rotate the leaf. It lifts the corner: `translateZ(1px)`, `scale(1.004)`, corner shadow in. Express it as keyframes — `0%` and `2%` carry the lift, rotation runs `2%` → `100%`. This is the paper unsticking, it costs almost nothing, and it is where the tactility lands. If you build one detail from this document, build this one.
4. **Two shadows, both `opacity`-only, both on the same timeline.** A *gutter shadow* fixed at the spine deepening as `sin(θ)` — the book's valley, it never moves. A *cast shadow* from the moving leaf onto the page beneath, peaking at 50% progress.
5. **Two faces**, `backface-visibility: hidden`, both in the DOM before the drag starts. **Only three leaves mounted** — previous, current, next. That is the memory budget, and it is unchanged by the technique.
6. **Release — native `scroll-snap`, with one required setting.** `scroll-snap-type: x mandatory`, and **`scroll-snap-stop: always`.** The second is not optional: without it a fast flick can skip a snap point and turn two leaves at once, which in this product means **silently skipping a day.** The browser's snap heuristic replaces the tuned `|v| > 0.35 px/ms` threshold from earlier revisions — probably an upgrade, since it is the same heuristic as every native carousel, but confirm on device (§12).
7. **At the spine — the one place that may stay custom.** The binding must **resist**, not rubber-band; see §12 for what that means precisely and how to judge it. A scroll view rubber-bands by construction, so this is the one boundary condition that may need `overscroll-behavior: contain` plus a damped lift layered on top: clamped to 25°, settling without overshoot. **That is two boundary conditions, not a parallel turn engine** — keeping it custom does not reopen dual maintenance.
8. **Scroll versus drag.** `touch-action: pan-y` on page content, nested inside the horizontal scroller. Native nested scrolling handles this better than the JS gesture arbitration earlier revisions specified.
9. **Sound and haptics.** iOS Safari has no Vibration API, in-browser or installed — page-turn haptics are **unavailable** without a native wrapper, and CBO has settled the stack as PWA-only unless a stated trigger fires. Substitute a very quiet **paper sound**: one ~40 ms sample (~8 KB) via WebAudio on turn completion. **Default off, discoverable in settings** — decided, not open. An unexpected sound from a private object in public is worse than a missing one, and Eva may open this at her desk in an open office. The same reasoning as the pocket (§10): the app never makes a noise she did not ask it to make.

### 3.3 The riffle

Hold the fore-edge, drag vertically: the book riffles, pages fanning. The founder's own description — *"a book that you can move the pages and see the images."*

A separate lightweight mode: 12 thin page-edge slices that shift and fan under the thumb, landing on release. **Build it second**, after §12 passes, and **re-cost it on the scroll-driven technique first** — it may now be a second scroll timeline rather than a JS animation, which changes its cost in both directions. **The rear pocket's contents never appear in the riffle** (§10).

### 3.4 Adding a photo

**No floating `+` button.** A FAB is a UI element on top of an object and the fastest way to reveal that the book is a picture of a book.

Instead: **the book always has one unfinished page at the end — today — and it is empty until someone puts something on it.** You add a photo by turning to the end, which is what you do with a real album. Full spec in §6.

### 3.5 The title page

The book opens with a real title page. Real margins, centred, one screen, nothing else on it:

```
                    Eva & Adam

               New York · Tel Aviv
                Begun 2 August 2026
```

`Eva & Adam` in `display` per §1. The city line and the date in `caption` with oldstyle figures — **New York first** (§2.3). A title page is what tells you an object was made deliberately, and it costs one screen.

The streak number never appears here (§9).

### 3.6 The book's structure

```
title page
  ↓
the opening gathering        — seeded photos, §7
  ↓
dated leaves, interleaved by date:
    · daily spreads          — one per day both were here, §6
    · date pages             — one per finished date, §6.4
  ↓
today                        — the open page, and any date still being written (§5A)
  ↓
colophon                     — §9
  ↓
inside back board            — the pocket, §10
```

**The book is a list of days that happened, not a calendar of days.** If they miss a day there is no spread for it, and the book skips from one date to the next. Pagination runs over existing spreads, never over a date range. This is the build-level expression of "complete silence on a missed day" (§9), and it is easy to get wrong by generating pages from a calendar.

---

## 4. Navigation — no tab bar, ever

A tab bar ends this. Three tabs across the bottom and the object is a container with sections in it.

The nav is **ribbons** — real cloth bookmarks sewn into the head of the binding, thin coloured strips at the top edge, in this order top to bottom:

1. **Eva's** (`--ink-eva`) — where she last was.
2. **Adam's** (`--ink-adam`) — where he last was.
3. **The book's** (`--ink-book`) — the contents.

**Each of them can see where the other is reading.** Presence as a property of the object rather than a green dot or a "typing…" indicator. Nearly free, and no other product in this space does it. The ribbons also carry the asleep state (§8) and the not-yet-seeded state (§7.3).

Gestures, consistent everywhere — this is what makes it one object:
- **Horizontal drag** always means *turn a page*.
- **Fore-edge hold + vertical drag** always means *riffle*.
- **Ribbon tap** always means *jump*.
- **Thumb-index tabs** on the fore-edge, one per month, for coarse navigation. Sized by what a month actually contains; a month with no spreads has **no tab** — never an empty one (§9).

No search, no filter panel, no album system. A book has no filters. Dates and the fore-edge are the index.

**Desktop:** same book, centred, spread at ~1100px max with the surround visible. Keyboard `←` `→` to turn, `Esc` to the cover.

**Load-bearing PWA note:** in Safari-in-browser a left-edge horizontal drag collides with Safari's back gesture. In **standalone (installed) mode that gesture does not exist**, so the book works cleanly. Installing is functionally required, not a nicety.

---

## 5. The cover

### 5.1 A clock, a sky, and one suggestion

Opening the app lands on the **front cover** — the object doing its one job: knowing what time it is in both cities and drawing a conclusion from it.

Nothing on the cover counts anything. No countdown, no days-apart, no time-elapsed, no progress toward anything. That register is closed. What replaces it is **present tense**: the light where the other one is, what they are probably doing, and the last thing they left.

**Portrait, top to bottom:**

1. **The ribbons** — three thin strips at the top edge, 8px.
2. **The dial** — largest element, ~46% of viewport height. A 24-hour circle, two concentric rings: **New York outer, Tel Aviv inner** (§2.3). Lit arc `--paper`, dark arc `--surround`. **The clock's two colours are the app's own two modes.** Where the paper is lit, it is day there — the whole legend, needing no key. A hairline marker shows now; the nine windows sit as small ticks, named in their own language.
3. **One line beneath**, `heading`, present tense: `Eva's on her commute.` Two lines of room, `text-wrap: balance`, never truncated.
4. **The suggestion slip** — §5.2.
5. **Two buttons** — §5.2.
6. **The last thing they left**, tucked at the bottom edge — §5.3.

**Desktop:** dial left, slip right, tucked photo at the fore-edge. Two columns, generous, no stretching.

### The sky

**The surround on the cover is the other person's sky, right now.**

Solar altitude is a pure function of latitude, longitude and time — no weather API, no network, offline, ~2 KB of maths. A single soft **two-stop vertical gradient**, low chroma, keyed to the sun's altitude in *their* city:

| Their sun | Gradient |
|---|---|
| Below −18° (night) | `#0B1020` → `#151311` |
| −18° to −6° (twilight) | `#1E2440` → `#3A3350` |
| −6° to 0°, rising (dawn) | `#4A3B52` → `#C97B6B` |
| −6° to 0°, setting (dusk) | `#5A3F55` → `#A55E70` |
| 0° to 15° (low sun) | `#E8B87A` → `#F0D9B8` |
| 15° to 45° | `#CFE0EC` → `#EDE6DB` |
| Above 45° | `#BCD6E8` → `#F2EFE7` |

Dawn and dusk are told apart by the sign of the altitude derivative — dawn skews rose-gold, dusk violet. A small thing that will be right twice a day forever.

So Eva opens the app at 11 p.m. in New York and the light behind the book is Adam's morning. She is holding the book in her room and the window behind it is his. That is the most present-tense thing this app can do, and it is the direct replacement for the deleted counter.

Three hard rules:
- **No text ever sits on the sky.** All cover text lives on paper and on the dial. Absolute — a computed gradient cannot be contrast-tested in advance.
- **In Night mode the sky is capped** to ~0.25 relative luminance and desaturated 20%, or she opens the app at 2 a.m. and takes his 9 a.m. in the face. Capped, it reads as a *memory* of their sky — which is the truer thing anyway.
- **Two stops, low chroma, no mesh.** A three-stop aurora gradient is the most recognisable generated-design tell there is. This one earns its place by being computed and unremarkable most of the day.

### 5.2 The suggestion slip — one card, zero taps

**Everything the app offers is a *date*** (PRD §3A). Not an activity, not a game, never a minigame. That vocabulary is retired product-wide, including in this document, in component names, and in the codebase.

The dates surface opens on **one date the app has already reasoned its way to**. Not a grid, not a list, not a filter bar. Because the cover already knows what time it is, it belongs **on the cover** — the clock's conclusion, directly under the clock. Zero taps from launch.

**It is not a card.** It is a **tipped-in slip**: a small piece of paper laid on the cover, one hairline `--paper-edge` rule and the standard warm shadow. Real books have these, and it makes `Something else` physically sensible — a slip is *replaced*, not re-rendered.

**On the slip and nothing else:** title (Fraunces `entry-title`), one line of description (Literata `body`, ≤66 characters), one metadata line (minutes · energy · cost, `caption`, oldstyle, `--ink-soft`). No tier badge, no window code, no icon, no image. **No badge distinguishing a hosted date from one the app hands over** — per PRD §3A.5 there is no distinction to surface.

**Two buttons, deliberately unequal:**
- The primary — the one pill on the screen, **filled with the ink of whoever is holding the phone.** Each of them sees a differently coloured primary button. Its label is **`Start`** when the app is about to open something, **`We're doing this`** when it is about to hand over and get out of the way (PRD §3A.5). **Two labels, one button.** The label is the affordance, not a taxonomy — nobody should tap and be surprised by what happens next. Size the button for the longer label so it never resizes between slips.
- `Something else` — text only, no fill, `--ink-soft`.

The asymmetry is the thesis as visual weight: the app has already decided, and disagreeing costs slightly more effort.

**An open date awaiting your turn outranks a new suggestion** (PRD §3A.4). Visually it is **the same slip** — same paper, same layout, same primary button. It is not a "resume" state, it carries no badge, no "your turn!", no elapsed time, and no count of how many are open. If it needs a distinguishing mark at all, it is that the title is the date already in progress. **A faded date has no visual state whatsoever** — it simply is not in the slot. Nothing is ever shown about it, and resuming one says nothing like "welcome back."

**Replacement motion:** old slip out down 8px on opacity, new slip in from 6px above at `scale(1.02) → 1`. 240 ms, `--ease-page`.

**After three `Something else` taps, do not open a browser.** Dumping them into a list is the app giving up and asking them to decide — what the thesis forbids. The third slip carries one quiet line beneath: `Or look through everything.` Offered once, not shoved.

### 5.3 The anchor — today's page, cropped

**A platform constraint makes this load-bearing.** Safari supports neither **Web Share Target** nor manifest **`shortcuts`**, so the natural gesture — *I just took this, send it to our book* — does not exist, and there is no long-press jump either. Every photograph must be added by opening the app and reaching the picker. **One tap from launch to the picker is therefore a hard requirement, not a nicety.**

The answer is not a `+` button (§3.4 forbids it, correctly). The answer is that the bottom edge of the cover shows **today's page itself, cropped by the viewport** — a live crop of a real page, not a widget about one. Whatever is on today's page is what you see:

| Today's page | The anchor shows | One tap does |
|---|---|---|
| Both empty | Two named frames, crisp corners | Your frame → the picker |
| Theirs filled, yours empty | Their photograph and your waiting frame | Your frame → the picker |
| Yours filled, theirs empty | Your photograph and their waiting frame | Turns to the page |
| Both filled | The pair | Turns to the page |

Cropped by the bottom of the viewport, so it also tells you the book continues and invites the turn.

**Their unseen photograph** keeps its treatment from earlier revisions: lifted 2px, full shadow, rotated `0.6deg`, as though tucked by hand — settling to flat, `0deg`, shadow at 30% once seen. **The unread indicator is that it has not been pressed flat yet.** No dot, no badge, no count. `transform`-only.

Never empty — on day one it is two named frames, which is the §3.5 invitation.
**Never a private item** (§10).

**A considered divergence from PRD §3A.4, for CPO to accept or reject.** The PRD proposes that "left for you" and "a date turn awaiting you" share one slot, two producers. I have split them: **the anchor is today's page; a waiting date turn lives on the slip.** Two reasons. First, the Web Share Target gap above means the anchor's one-tap-to-picker cannot be time-shared with anything else — if a date turn occupies it, adding a photograph stops being one tap on the one platform where that already costs the most. Second, the PRD's own rule that *an open date outranks a new suggestion* is a statement about the slip, which is exactly where suggestions live. Split this way each slot keeps one job: **the slip is what to do, the anchor is today.** If CPO prefers one slot, the priority order should be date turn → their unseen photo → your empty frame, and the one-tap-to-picker requirement needs another home.

### 5.4 Browse — the contents page, one level down

Reached by the book's green ribbon. Still good, no longer the front door.

The shelf names are long human sentences, and **a book's table of contents is the only layout that presents them as navigation without shredding them into chips**:

```
Eva’s in bed, Adam’s awake ....................... 31
Eva’s on her commute ............................. 17
Eva’s lunch break ................................ 36
Eva’s just off work, Adam’s fading ............... 30
Saturday — go long ............................... 40
Zero setup, right now ............................ 37
One of us can’t look at a screen ................. 25
```

Dot leaders, right-aligned counts in oldstyle figures. The leaders absorb variable line length for free — which is what leaders were invented for.

**Inside a shelf:** typeset entries, **not cards.** Title in Fraunces `entry-title`, description in Literata `body`, metadata one `caption` line in `--ink-soft`. No badges, no chips, no icons.

- **Tiers (S/A/B) are position, not badges.** S first, hairline rule, one `eyebrow`: `BEST RIGHT NOW`. Badges are gamification; order is information.
- **Unverified** entries in italic beneath one line in the book's voice: `Untested — try at your own risk.`
- **One control:** a small `Now` / `All` toggle. The clock already did the filtering that matters.
- **No hosted/world distinction anywhere** — no badge, no section, no filter, no "playable" label (PRD §3A.5). The only tell is the primary button's label, and that is an affordance, not a category.

---

## 5A. A date the app hosts

PRD §3A.2 ships three hosted dates in Phase 1 sharing **one interaction shape**: alternating turns of short text · no timer · resumable indefinitely · ends with a page. One visual treatment therefore covers all three, and the second and third cost nothing to design.

**A date in progress is a page being written.** Not a chat, not a thread, not a game board. The story grows down the page; the question trail accumulates; the paired question waits for its second half. Same paper, same margins, same type as everything else — **turns are set as prose, not as bubbles.**

- Each turn is a paragraph in **that person's ink**. No names, no avatars, no timestamps in the flow — the ink says who, which is the two-ink system doing the work it was built for.
- Eva's turn sets first where both are present in one exchange (§2.3).
- Whose turn it is, is shown by **an empty paragraph with a caret waiting in your ink** — the same chrome-free field as a caption (§3.4). If it is not your turn, there is no field, no placeholder, and no "waiting for Adam." The page simply ends.
- **No timer, no deadline, no elapsed time, no turn count, no "your turn!"** anywhere on the page (PRD §3A.4). The absence of pressure is the design.
- **The paired question** hides the other's answer until both are in: your answer sets normally, theirs is a **blank measure of the page held open beneath it** — space reserved, not a redaction bar, not a blur. When both are in, theirs sets into the space it was already holding. Reserved space reads as anticipation for the same reason crisp empty corners do (§6.2).

**Where it lives — a proposal for CPO.** The PRD says a *finished* date writes a page, and that open and faded ones "sit quietly in the record," without saying what the record is. **Proposal: an open date is already a page in the book**, sitting at the back near today, settling into its date position when it finishes. Then no record surface has to exist at all — no list, no archive, no second tab — which is both cheaper and truer to "the book fills itself." A faded date is simply a page that stopped growing: an unfinished story, sitting there as what it is, **with no marker of any kind.** Never dimmed, never labelled, never mentioned. CPO's call; flagged rather than assumed.

**Vocabulary that must not exist**, in copy or in code: `failed`, `abandoned`, `expired`, `incomplete`, `stalled`, `overdue` (PRD §3A.4). Nor any visual equivalent — no grey state, no dashed border, no strikethrough.

---

## 6. The daily spread — the most-repeated page in the book

One photo each per day, shown as a **pair on one spread**. Over a year this becomes the book's spine, so it is designed as a first-class artifact, not as a layout that falls out of the data.

### 6.1 The completed pair

```
┌────────────────────────┬────────────────────────┐
│                        │                        │
│   ┌────────────────┐   │   ┌────────────────┐   │
│   │                │   │   │                │   │
│   │   Eva’s photo  │   │   │  Adam’s photo  │   │
│   │                │   │   │                │   │
│   └────────────────┘   │   └────────────────┘   │
│                        │                        │
│   caption, her ink     │   caption, his ink     │
│   11:48 pm             │   6:20 am              │
│                        │                        │
└────────────────────────┴────────────────────────┘
              Tuesday, 4 August
```

- **Verso (left) is always Eva's. Recto (right) is always Adam's.** Fixed, whoever posted first (§2.3).
- The date is a **running head** at the foot of the gutter, centred, `caption`, oldstyle figures. One date per spread — it is one named day seen from two sides.
- Photos mounted with corners. Captions beneath in that person's ink, optional.
- **Beneath each caption, the local time in that person's own city.** Not "2 hours ago" — `11:48 pm` under Eva's, `6:20 am` under Adam's, oldstyle figures.

That last line is the whole product in one detail. It shows the seven hours rather than stating them, on every spread, forever, at the cost of one line of type. **The gutter between the two photographs is the time difference.** Say that here; never say it in the UI.

**On a portrait phone** the spread is two consecutive leaves, Eva's first. The running-head date appears on both, so a single leaf is never orphaned from its day.

**When the pair completes**, the second photo drops into its corners (280 ms, `--ease-page`, §3.4) and **the fore-edge gains a page.** The book gets fractionally thicker at the exact moment the day closes. That is the streak (§9), paid for by a component that already exists, and it is the only celebration in the product.

### 6.2 The half-pair — anticipation, not absence

One has posted, the other has not. Given the gap this is visible for hours every single day, so it gets as much care as the completed state.

**The empty side shows the photo corners, alone, on the paper, with the name beneath in their ink and their current local time.** Nothing else. No dashed outline, no grey box, no spinner, no "waiting for…".

Why it reads as anticipation: **four mounted corners with nothing in them are unambiguously a place prepared for something.** They are not an absence, they are a reservation. It is exactly what a physical album looks like when someone has mounted the corners and not yet slid the print in.

The one detail that decides whether it works: **the empty corners are drawn crisp, at full opacity — never faded.** Faded reads as spent. Crisp reads as ready. That is the whole trick, and it is the first thing an engineer will soften.

**A structural asymmetry worth designing for.** Adam's day begins seven hours before Eva's, so **his side fills first on most days**, and the empty side is usually the left one — the first leaf you read. The book will routinely open on Eva's page still to come. That is not a flaw to design around; it is the literal shape of their life, and the crisp-corners treatment is what makes it land as *her page is coming* rather than *her page is missing*. Build and review the half-pair state on the **left** leaf, because that is where it will almost always be seen.

### 6.3 When a day closes half-finished

If only one posted and the shared day closes, the photograph still exists and must be kept — but the empty corners must **stop reading as waiting**, or they become the "greyed gap in the book" that §9 forbids.

**On day close, an unpaired photo re-lays out as a single plate:** one photograph centred on one leaf, generous margins, caption and local time beneath. The empty corners are removed. A single-plate page is a legitimate, complete book page — not half of a broken spread.

So corners-waiting is a **live state only**. When the 31-hour day closes, every spread has resolved to either a pair or a single plate. Nothing in the finished book is ever waiting for anyone.

**If neither posted, there is no spread at all** (§3.6). The book skips the date in silence.

### 6.4 The date page — the book's other kind of leaf

Every finished date writes a page (PRD §3A.4), so the book holds text as well as photographs. One leaf, not a spread — a record, not a pair.

```
                Fortunately, Unfortunately


  Fortunately, the ferry was still at the dock.

     Unfortunately, so was everyone else in Brooklyn.

  Fortunately, Eva has never once been early to anything.

     Unfortunately, neither has the ferry.


                                        Tuesday, 4 August
```

- **The date's name** in Fraunces `heading`, generous space above and below — no rule beneath it. Space is what marks a heading (ui-typography); a rule would be chartjunk on a page this quiet.
- **The turns as prose**, Literata `body`, 17/25, capped at 60–66 characters, each in that person's ink. Eva's sets first where the shape allows.
- Alternating turns get a small indent on the second voice — not a bubble, not a rule, just the typographic convention for alternating speakers. It makes a story readable from the top, which is the whole reason hosting beats a text thread (PRD §3A.2).
- **The running-head date** at the foot, `caption`, oldstyle figures — same position and treatment as a daily spread, which is what binds the two kinds of leaf into one book.
- **Plain paper. No ruled baselines**, no margin lines, no diary furniture. Consistent with the chrome-free caption field, and §2.4 bans decoration.
- Interleaved chronologically with the daily spreads. A single day can hold both a photo pair and a date page; they sit adjacent under the same date.

**A date page never counts toward the day-count** (PRD AC-50, §9). It does thicken the fore-edge, because it is a real page — see the §9 note on why those two facts do not conflict.

---

## 7. Seeding — the opening gathering

Photographs come from their two camera rolls. Nothing is pre-gathered, so day one is a deliberate act: Eva and Adam each open the native picker and choose a batch to start the book with. **This is not an onboarding flow. It is the first page of the object** — two people sitting down separately, in two cities, seven hours apart, each choosing which photographs go into the book they are starting.

### 7.1 Where seeded photos live

They become the book's **front matter** — a gathering of plates before the dated spreads, the way a book has plates before chapter one. A divider leaf opens it, set in `display`:

```
                  How it started
```

*(Copy proposed, not owned — CMO/CPO override freely. The structural requirement is that it reads as a **section title in the book's own voice**, not a UI label like "Your photos.")*

Seeded photos are **not dated spreads**. They are from before, they carry no running-head date, and they never count toward the streak. They lay out as plates — one or two per leaf depending on orientation — in **the order each person picked them**, because that order is a curation choice and discarding it discards real intent.

### 7.2 The act of filling

- Tap → the native multi-select picker. That is the whole affordance.
- Then **you watch the book fill.** Each photo lands on a page with the same 280 ms drop as §3.4, in selection order, and **the fore-edge thickens by a hair with each one.**
- **The fore-edge is the progress indicator.** Third time that component has paid for itself. No progress bar, no percentage, no "12 of 30", no file names, no cloud-storage vocabulary anywhere.
- Failures get one line on the page in `--ink-soft`, not a toast: `Three didn't make it. Try those again.` *(copy to CMO)*
- Seeding **gates nothing.** The daily pair works from day one regardless of seeding state. *(Assumption — CPO's to confirm.)*

### 7.3 The half-seeded state

One has seeded, the other has not. Seven hours apart, possibly a day apart. This is §6.2's problem on the most emotionally loaded screen in the product, and it may persist for a long time.

**Same answer, same components:**

- The book **exists and is readable.** Her gathering is there. It is not "incomplete" — it is a book with one person's plates in it so far.
- The opening-gathering divider leaf carries **both names**, in order. The section that has photographs shows them; the section that does not shows **prepared leaves with crisp corners** — a place ready, not a hole.
- **His ribbon is still at the title page.** That is the state, and it needs no words. A ribbon at the front of a book is not a failure; it is just where someone is. The tenderest available way to say "he hasn't opened it yet," costing nothing, because the ribbon already exists.
- On the cover the tucked photograph is one of hers, and the line under the dial stays factual and present-tense.
- **Do not prompt, nudge, badge, or notify about it.** The register the streak rules forbid (§9) is forbidden here too, and here it matters more.

---

## 8. The asleep state

When one is asleep the app knows, and nothing live is offered or pinged. A visual state, and after the day-one book the most important one in the product.

**Never:** greyed-out chrome, a crossed-out moon, a "Do Not Disturb" pill, `Eva is unavailable`, or a disabled `We're doing this`. **Never show a disabled control — remove it.** A disabled button is a small rebuke, and this app does not have those.

**Mostly already drawn.** The dial's other ring is in its dark arc; the sky behind the book is night. Both computed, both already saying it without a new element. That is the payoff for building the cover out of real state instead of status widgets.

**What changes:**

1. **The slip changes register, not quality.** It stops offering live dates and offers asynchronous ones — and this is the tender part: **asleep is the state the library is best at.** *"Something she leaves as she falls asleep, that he wakes up to."* *"One line at her lunch desk."* *"A slow build across his Friday."* The app does not go quiet when Eva sleeps; it switches to leaving things.
2. **The line under the dial is factual and warm**, using their real local time: `Eva's asleep. It's 3:40 in the morning there.` Present tense, no arithmetic about the two of them.
3. **The ribbons carry it.** The sleeping person's ribbon lies flat and still against the page; the awake one's is where they are. Physical, wordless, reusing a component that exists.
4. **Never express asleep by lowering text contrast.** The obvious move — that person's ink at 70% — takes `--ink-adam` from 7.99:1 to **3.77:1, failing AA.** No headroom in this palette for opacity-as-state. Carry it on the ribbon and the ring, both non-text.
5. **No pushes during their night.** Ever, regardless of setting.

**Between windows uses the same pattern.** When they are in no named window the cover does not say "No window." The clock still shows both times, the line still says what the other is probably doing, and the slip still has something — only its register changes. **The slip is never empty.**

---

## 9. The streak

It counts up, never breaks, and can never read as a rebuke. One concern stated once: any visible number invites comparison to itself, so the risk is not the rebuke — it is the number quietly becoming the point. The mitigation is to keep it non-numeric wherever it lives.

**The streak is the fore-edge.**

Days both of them were here are days that have a spread. Days they were not simply have none. It accumulates, never decreases, has no target, cannot be lost, and is evidence rather than a scoreboard — every requirement met by a component that already exists, with zero new UI.

**One clarification now that the book holds date pages too** (§6.4). The fore-edge is **the accumulated record of everything they did**, not a rendering of the day-count. Date pages thicken it; they do not feed the count (PRD AC-50). Those two facts do not conflict, because the fore-edge was never a counter — it is the evidence, and a finished date is evidence. The **day-count** is a separate, stricter thing: daily photo pairs and nothing else. If a number is ever shown (below), it is the day-count, and it must be computed from pairs alone.

**Binding rules:**

- **The unit is *days you were both here*. Never *consecutive*.** That word reintroduces breakability through the back door, and nothing in the product may imply it — not in copy, not in a data field name, not in an API response.
- **Complete silence on a missed day.** No marker, no greyed gap, no dimmed date, no placeholder spread. The book skips from one date to the next (§3.6). A visible hole is a rebuke with extra steps.
- **Month tabs are sized by what exists**, never scaled against a maximum. A month with no spreads has **no tab.**
- **Banned:** flames, fire, any red, any draining or depleting state, any "broken" state, "keep it up", "don't lose your streak", comparison to a previous best, calendar grids of any kind, and any notification whose subject is the streak.

**If a literal number is required**, it goes on the **colophon** — the small page at the very back where a book records how it was made:

```
              Forty-one days, both of us.
```

Two reasons for the back and not the front. You have to go looking for it, which is the least scoreboard-like place a number can be. And the title page says `Begun 2 August 2026` — **a count next to a start date invites subtraction** (*ninety days in, forty-one counted*), manufacturing exactly the elapsed-time arithmetic that was cut. Front and back keeps them far apart.

**Spell the number in words, not digits.** Digits read as a metric; words read as prose.

---

## 10. Private items — the pocket

Structurally separate from the page turn: never in a spread, a thumbnail, a preview, the riffle, the thumb index, the cover's tucked photo, or the fore-edge count. Reachable only behind deliberate re-authentication. It exists because Eva may be turning pages at her desk in an open office.

**It should feel like a locked drawer in a good piece of furniture, not a panic button.**

### The object

Not a section of the book — if it were a page, a page turn could reach it. It is the **pocket bound into the inside back board**, which is where real albums and portfolios keep the things that live in the book but not on its pages.

- On the inside back board, after the colophon: a shallow trapezoid drawn as a **hairline in `--ink-soft`** — the shape of a real album's rear pocket. Closed.
- **`--ink-soft`, not `--paper-edge`:** the pocket is an interactive control, so it needs 3:1 against the paper. `--ink-soft` gives 5.31:1; `--paper-edge` would give ~1.15:1 and fail.
- Closed, it shows **nothing** — no count, no thumbnail edge peeking out, no dot, no lock glyph.

### Access

- Tap the pocket → re-authenticate (Face ID / passcode via WebAuthn). Nothing else happens without it.
- On success the **flap lifts** — `rotateX` on the flap, 320 ms, `--ease-page`.
- Contents are a **loose stack in a pocket, not book pages.** Flicked through as a small stack — deliberately a *different* interaction from the page turn, so muscle memory can never land you there by accident.
- **Re-locks instantly on `visibilitychange → hidden`**, not on a timer. The threat model is someone glancing over her shoulder, and backgrounding the app is the moment she is putting the phone down.
- Adding to the pocket happens **only from inside the pocket**, never from the ordinary add-a-photo path. A photo can then never be misrouted into the wrong place — a safety property, not just a UI one.

### Why it does not feel shameful

**The pocket is always drawn**, whether or not it has anything in it. A control that appears only when there is something to hide is what makes it feel shameful. Drawn always, in its natural place, with the same care as everything else, it is simply part of a well-made object.

**No panic affordances:** no shake-to-hide, no decoy content, no quick-exit button, no discreet-mode toggle. All of those signal *you are doing something wrong.* The instant re-lock on blur does the same job silently.

---

## 11. References, and exactly what to capture

The refero MCP is configured on this machine but was not exposed to this agent (no `mcp__refero__*`, no Playwright). Everything below is a real, named product or artifact.

| # | Reference | Take | Do not take |
|---|---|---|---|
| 1 | **Apple Books, iOS — page curl** **[capture]** | Drag-follow mapping; the corner lift; the gutter shadow staying put. | Photographic paper texture; full mesh curl. |
| 2 | **Paper by FiftyThree / WeTransfer Paper** **[capture]** | Pinch-to-close-into-a-book; notebooks visibly thickening; colour-as-ink. Closest thing that ever shipped to the founder's description. | Brush / watercolour simulation. |
| 3 | **Day One — dark theme** **[capture]** | Warm dark rather than black; photos bright while chrome recedes; date typography. | Its tab bar. Its streak and "On This Day" — the exact register §9 rejects. |
| 4 | **Instapaper / Readwise Reader — sepia and night** | The luminance *relationship* between page and ink at night. Borrow the proven numbers. | Their typography settings UI. |
| 5 | **Family (family.co)** **[capture]** | Spring-based, drag-followable, **interruptible** motion — everything grabbable mid-flight. | Its palette; its crypto content entirely. |
| 6 | **Vaul and Sonner (Emil Kowalski)** — source | `cubic-bezier(0.32, 0.72, 0, 1)`; the `0.11 px/ms` velocity threshold; damping at boundaries. Read the source. | Their visual styling. |
| 7 | **Literata and Fraunces specimens** | Literata's brief was screen reading for Google Play Books. Fraunces' `SOFT`/`WONK` axes; the italic ampersand (§1). | Fraunces at `WONK 1` below 20px — it gets noisy. |
| 8 | **Physical: a Japanese photo album with corner mounts; a Leuchtturm1917; a Smythson Panama diary** | Photo corners (§6), ribbons (§4), thumb tabs (§4), tipped-in slips (§5.2), **the rear pocket (§10)**, and the discipline of no decoration on the object. | Leather, embossing, gilt edges. |
| 9 | **Bear / iA Writer** | The no-chrome writing surface: a caret on a page, no field, no border. | Their markdown affordances. |
| 10 | **The Old Farmer's Almanac sun-times tables** | Presenting two places' times together: oldstyle figures, dot leaders, dense but calm. | Its illustration style. |
| 11 | **`suncalc` (npm, ~2 KB)** | Solar position for §5's sky. Pure function, offline. | — |
| **N** | **Any web flipbook library** — turn.js demos, Heyzine, FlipHTML5 **[capture: negative reference]** | Nothing. Capture it so the engineer knows what **wrong** looks like. | Everything. |

### Capture specs

These cannot be understood as prose or as stills. Screen-record at **60fps**, tethered, and keep the raw files.

**① Apple Books — the page turn.** iPhone, any book with the curl reading mode enabled. Three takes: **(a)** a slow drag from the right edge, held at roughly 40% and then *reversed without releasing*; **(b)** a fast flick; **(c)** a drag begun in the *middle* of the page rather than at the edge.
*What "right" looks like:* the corner lifts before any rotation begins — watch the first 8px. The gutter shadow does not move while the leaf does. Take (a) is the important one: reversing mid-drag stays perfectly smooth and the page never snaps to a decision. That is interruptibility, and it is the property §2.5 is asking for.
*Note:* curl availability varies by iOS version. If it is not offered, use archived footage rather than substituting a different app — the specific behaviour is the point.

**② Paper by FiftyThree.** Discontinued; archival video only. Capture the notebook shelf and the pinch-to-close gesture.
*What "right" looks like:* the object never stops responding — there is no modal moment where the app takes over and plays an animation at you. And the notebooks are visibly, physically different thicknesses, which is §9's mechanic ten years early.

**③ Day One — dark theme.** iPhone in dark mode, **at night, screen brightness low** — not in an office at noon, or the whole point is lost. Capture an entry containing a photograph, scrolled slowly.
*What "right" looks like:* the photo reads as *embedded in* the dark page rather than *cut out of* it. Note the gap between page-background luminance and the photo's darkest regions, and the size of the date relative to body text.

**④ Family (family.co).** Capture opening a sheet, dismissing it, and — the essential take — **grabbing the sheet mid-animation.**
*What "right" looks like:* the sheet is catchable mid-flight and inherits its velocity rather than restarting. Watch the settle for overshoot, and watch how it damps when dragged past its boundary. The best available demonstration of §3.2 point 7.

**Ⓝ The negative reference.** Any JS flipbook library demo, **on an actual iPhone in Safari**, not desktop.
*What wrong looks like:* the drag does not track the thumb 1:1; the turn is tap-only or snaps to a fixed duration; frames drop under a real photograph; and there is usually a photographic paper texture doing the work that physics should be doing. Ten seconds of this is worth a page of prose.

---

## 12. The spike — a feel spike with a performance floor

Both devices are iPhone 14+ on iOS 26, and the turn now runs on the platform's own compositor. **Raw frame rate is largely answered before the spike starts.** So the spike's purpose has changed: it is no longer *does it hold 60fps*, it is **does it feel like an object or like a scroll view wearing paper.**

Performance is retained as a **floor** — cheap to measure while you are there, and still capable of failing.

### What to build

A **single static HTML file.** No React, no framework, no router. Thrown away afterwards, not in the product repo.

- Three leaves in the DOM (previous, current, next), each with two faces, `backface-visibility: hidden`, `transform-style: preserve-3d`, `perspective: 1600px`.
- A horizontal scroller with `scroll-snap-type: x mandatory` and `scroll-snap-stop: always`, driving `rotateY` via `animation-timeline: scroll()`. Keyframes per §3.2: lift at `0–2%`, rotation `2–100%`, both shadow layers on the same timeline. No riffle, no captions, no chrome.
- **Real photographs from an actual iPhone camera roll.** Not stock, not placeholders. Decode time and texture memory are the floor's real subject, and a 40 KB placeholder proves nothing.
- Serve at **two sizes** — native portrait (1290×2796) and downscaled (828×1792). Native is now the expected pass; keep the second arm anyway so a surprise has its answer in the same session.
- Build the boundary **twice**: once with raw native overscroll, once with `overscroll-behavior: contain` plus the damped 25° lift. That comparison is the main event.

### The three feel questions, in order of how much they matter

**① The boundary — does it resist, or does it rubber-band?**

This is the question, and it is the one that cannot be adjudicated from a number, so here is what "right" looks like.

The physical difference is not resistance versus none. Both give. The difference is *what kind of giving*:

| | Scroll rubber-band | A book's binding |
|---|---|---|
| What moves | The whole surface, translating as a unit | One leaf, rotating at its hinge |
| Resistance | Asymptotic — always yields a little more, forever | Approaches a hard stop |
| Travel | Generous | Short |
| On release | Springs back **past** rest, then settles | Falls back and **stops** |
| Feels like | Elastic, attached by rubber | Structural, hinged, sewn in |

**The single decisive test: pull the last page as far as it will go, release, and watch the return.** If it comes back past flat and settles into place, it is a scroll view. **Paper does not overshoot.** A page you pull and let go falls back and stops. Everything else on that table is corroborating; the overshoot is the tell, it is visible at 60fps in a screen recording, and it does not require a trained eye to call.

Two supporting checks: **does anything move except the leaf** (a binding holds the rest of the book still — if the spread shifts, the scroller is translating and it will read as a surface, not an object), and **can you pull it arbitrarily far** (if sustained pressure keeps yielding travel it is elastic; a binding gives you a little and then nothing).

**Why this matters more here than in most books.** There are only two boundaries — the first leaf and the last. But **the last leaf is today's page**, and the anchor (§5.3) takes them straight there, so they arrive at the trailing boundary constantly and drag past it daily. This is a high-traffic surface in this product specifically, which is not true of a normal book. It earns custom code if it needs custom code.

**If native overscroll cannot be shaped into resistance, say so plainly and keep the boundary custom.** `overscroll-behavior: contain` plus a damped lift is two boundary conditions, not a parallel turn engine — it does not reopen dual maintenance. And beware the opposite failure: `overscroll-behavior` may suppress the give *entirely*, leaving a dead stop with no lift at all. **A dead stop reads as a bug, not as a binding.** The 25° damped lift exists precisely to avoid that, and if you suppress overscroll you must add it back.

**② The snap — does a brush turn a page?**

`scroll-snap` replaces the tuned `|v| > 0.35 px/ms` threshold. It is probably an upgrade, being the same heuristic as every native carousel, but the failure mode is over-eagerness: a light brush committing a turn makes the book feel jumpy and skittish rather than weighted. Two takes:

- **Brush test.** A short, light flick from ~10% of a turn. Does it commit? A book should not turn because you touched it.
- **Deliberate half.** Drag slowly to ~50% and release with near-zero velocity. It should be predictable — falling back is right, committing is acceptable if it is *consistent*. What is wrong is if the same gesture does different things on different attempts.

Also confirm **`scroll-snap-stop: always` prevents a two-page skip** on a hard fling. A skipped leaf here means a skipped day.

**③ Interruptibility — confirm what you are getting for free.**

Grab the leaf mid-fling. It should catch from wherever it is and inherit velocity, not restart. This is the property the Apple Books and Family capture specs exist to define (§11), and the native path should deliver it without effort — confirm rather than assume.

### The performance floor

Retained, and still capable of failing.

| Measure | Threshold |
|---|---|
| Frame time during drag | **p95 ≤ 16.7 ms and zero frames > 33 ms.** |
| Input latency | **< 50 ms** touchmove → paint. |
| Memory | Stable across **100 consecutive turns**, no monotonic growth. Growth means the 3-leaf window is not recycling. |
| Thermal | The p95 check **still passes at minute 3** of continuous turning. |

Safari Web Inspector Timelines, device tethered to a Mac.

**Keep the minute-3 warm check.** Thermal behaviour of a native compositor path is still worth knowing, and a 14 in a case in an Israeli summer is not a bench-tested 14.

### On what device

- **iPhone 14+, iOS 26** — both of them, confirmed.
- Test **installed (standalone PWA)** and **in-browser Safari**. The edge-swipe conflict differs, and it matters more now that the turn is a scroller.
- Test **Chrome on iOS**. WebKit underneath, so results should match; confirm rather than assume.

### What each outcome means

- **Feels like an object, floor passes at native resolution** → build §3.2 as written.
- **Boundary rubber-bands and cannot be shaped** → keep the boundary custom, per ① above. Expected outcome, cheap, not a setback.
- **Floor fails at native, passes downscaled** → serve downscaled with full resolution on tap-to-zoom, and **decide it now** — the storage pipeline has to produce two sizes from the start.
- **Floor fails at both** → surprising on this hardware and points at the implementation, not the ambition. Check `will-change` hygiene and the 3-leaf window before concluding anything.

**Re-cost the riffle (P3) on this technique before building it.** It may now be a second scroll timeline rather than a JS animation, which would change its cost substantially in both directions — cheaper to run, different to build.

---

## 12A. Platform constraints to design against

Verified iOS/Safari facts that close off design directions. Recorded so nobody spends time rediscovering them.

**No Web Share Target. No manifest `shortcuts`.** Eva cannot share a photograph from the iOS Photos app into the book, and there is no long-press jump from the home screen. The natural gesture — *I just took this, send it to our book* — **does not exist on this platform.** Every photograph is added by opening the app and reaching the picker. This is what makes §5.3's one-tap anchor a hard requirement rather than a refinement, and it is the single largest piece of friction in the product that we cannot design away.

**A backgrounded iOS PWA is off, not asleep.** No timers, no motion, no sensors, no scheduled local notifications while closed. The only signal is `visibilitychange`: the app knows when it was opened, and nothing else.

Nothing in this document depends on background execution, and everything time-based is already built the only way it can be — the dial and the sky recompute on open and on a 60-second tick *while open* (§13), the asleep state is computed on open, and the pocket re-locks on `visibilitychange → hidden` (§10), which is exactly the right primitive.

**One distinction someone will conflate:** *scheduled local notifications* are impossible; *Web Push* (server-sent, iOS 16.4+ for installed PWAs) works, because the server does the waking. So "no pushes during their night" (§8) remains a policy we enforce server-side, not a platform limitation. Anything phrased as "the app notices X while closed" is impossible; anything phrased as "the server notices X and pushes" is available — and per PRD §3A.4, **never for a date turn.**

---

## 13. The offset is computed, never illustrated

**The gap is 6 hours for roughly 26 days a year**, because Israel and the US change clocks on different dates. Nothing may bake in 7.

- **Every offset-dependent element derives from IANA zones** — `America/New_York` and `Asia/Jerusalem` via `Intl.DateTimeFormat`. Never a stored integer, never a constant, never an illustration.
- **No fixed-offset asset exists anywhere:** not the icon, splash, favicon, share image, or any static SVG. If the dial is ever exported as an image it is wrong by construction.
- **Recompute on `visibilitychange` and a 60-second tick**, not only on load. A PWA left open overnight otherwise shows a stale clock — and a wrong clock is worse than no clock in an app whose whole thesis is that it knows what time it is.
- **DST shifts the windows relative to each other**, so the app must render gracefully when they are in *no* window (§8 — the slip is never empty).
- **The 31-hour shared day is also computed**, and it is what guarantees the daily pair can complete regardless of when either posts (§6). It runs from Adam's local midnight to Eva's local end of day — 31 hours normally, 30 in the six-hour weeks.

---

## 14. Open questions

Two left. **Nothing gates the spike** — it can run now.

1. **One decision I have proposed rather than made, CPO's to take:** where an open date lives (§5A). Proposal: it is already a page in the book, which means no record surface has to exist at all — no list, no archive, no second tab.
2. **Copy on two strings** — the opening-gathering divider (`How it started`) and the seeding failure line. Proposed, not owned; CMO/CPO override freely.

**Closed:** the name (Eva & Adam), name order, ink assignment, English-only, one-photo-each-as-a-pair, photo source, RTL (dropped), device floor (iPhone 14+), **iOS version (26 — native path is the foundation, no JS turn implementation)**, paper sound (off, discoverable), seeding does not gate the daily pair, what the primary button does (PRD §3A.4), whether the book holds text (**yes** — §6.4), and **the anchor/slip split (adopted, §5.3)**.

---

## 15. Performance risks

| # | Risk | Mitigation |
|---|---|---|
| **P1** | ~~Page turn dropping frames on iOS Safari.~~ **Substantially retired.** Both devices are iPhone 14+ on iOS 26, and the turn runs on the platform's own compositor via `animation-timeline` — momentum and interruptibility are inherited, not built. **What remains is a *feel* risk, not a performance risk:** whether the boundary reads as a binding or as a scroll view (§12 ①). | §12 is now a feel spike with a performance floor. 3 leaves mounted, LQIP placeholders, `scroll-snap-stop: always` to prevent a skipped day. |
| **P2** | Two variable serif faces; Fraunces is multi-axis and not small. | Self-host, subset Latin + punctuation, preload Literata only, Fraunces on `swap`. Hard budget 160 KB. |
| **P3** | The riffle — a second animation surface. | Ship after §12. **Re-cost it on the scroll-driven technique first** — as a second scroll timeline it may be far cheaper than the JS version this risk was written against. Twelve slices, `transform`-only. If it still cannot hold, cut it; thumb tabs cover the need. |
| **P4** | Noise overlay destroying scroll performance. | Exactly one layer, `position: fixed`, `pointer-events: none`, never inside a scrolling container. |
| **P5** | **No haptics in an iOS PWA.** Vibration API unavailable, installed or not. | Optional 40 ms paper sound, default off. If haptics are essential that is a native-wrapper decision for CTO. |
| **P6** | iOS `100vh` jumps. | `100dvh` everywhere; account for the home-indicator inset. |
| **P7** | The book gesture needs standalone mode — in-browser it fights Safari's edge-swipe-back. | Install is functionally required. Say it once, at the start, never again. |
| **P8** | The sky recomputing too often. | Pure function — compute on load, `visibilitychange`, and a 60s tick. Never per frame. Transition the gradient in CSS rather than recomputing. |
| **P9** | **Seeding a large batch on a phone** (§7). Dozens of full-resolution camera-roll photographs decoded and uploaded at once will thermally throttle the device and can OOM the tab. | Process serially, not in parallel. Downscale before upload. Never hold more than a few decoded images in memory. The fore-edge thickening is what they watch while this happens, which buys real time — but it must never block the main thread. |

---

## 16. What I rejected, so nobody re-proposes it

- **A tab bar.** Ends the object metaphor instantly.
- **A floating `+` button.** Same reason.
- **Photo grid view.** The book has no grid. The riffle and thumb index cover fast scanning.
- **A browse list as the dates front door.** Superseded — one slip, zero taps (§5.2).
- **Auto-opening a browser after repeated `Something else`.** The app giving up and asking them to decide.
- **Cards for dates.** Would make the dates surface a different product from the book.
- **The word *activity*, and *game*, and *minigame*.** Everything is a date (PRD §3A) — in copy, component names, and the codebase.
- **A hosted-versus-world badge, section, filter, or "playable" label.** There is no distinction to surface; only the button's label changes (§5.2).
- **Chat bubbles for date turns.** Turns are prose on a page, set in each person's ink (§5A).
- **`failed`, `abandoned`, `expired`, `incomplete`, `stalled`, `overdue`** — in strings or in code — and every visual equivalent: grey states, dashed borders, strikethrough (§5A).
- **Any "your turn!" indicator, turn count, elapsed time, or deadline** on a date (§5A). The absence of pressure is the design.
- **A blur or redaction bar** over an unrevealed paired answer — it is held-open space instead (§5A).
- **A `+` button on the cover** to solve the missing Web Share Target. The anchor is today's page itself (§5.3).
- **Any counter, countdown, days-apart, time-elapsed, or progress-toward.** Closed register (§5, §9).
- **Calendar grids of any kind.** A missed day renders as a hole, and a hole is a rebuke by geometry (§9).
- **Flames, fire, red, "keep it up", or any depleting state** for the streak (§9).
- **The word *consecutive*,** anywhere, including in data field names (§9).
- **A persistent half-empty spread** after a day closes — resolves to a single plate instead (§6.3).
- **Faded empty photo corners.** Faded reads as spent; crisp reads as ready (§6.2).
- **Disabled controls** in the asleep state — remove, never grey out (§8).
- **Opacity as a way to say "asleep."** Fails AA at 3.77:1 (§8).
- **Panic-exit affordances** on the pocket — shake-to-hide, decoys, quick-exit. They signal *you are doing something wrong* (§10).
- **A pocket that only appears when it has contents.** That is what would make it feel shameful (§10).
- **Progress bars, percentages, file names, or "12 of 30"** during seeding (§7.2).
- **Eden imagery of any kind** — leaves, vines, apples, serpents, the word itself (§1).
- **Deckle edges, washi tape, paper clips, pressed-flower graphics.** Where warm becomes twee.
- **Warm cream + high-contrast serif + terracotta accent.** The most common generated-design cluster right now. The brief pins warm off-white, so that axis is set — differentiation is spent on the two-ink system, the all-serif commitment, the computed sky, and the physics.
- **A three-stop aurora / mesh gradient** for the sky (§5).
- **Pure `#000` dark mode.** Cold, wrong for paper, harsh on dilated pupils at 2 a.m.
- **A mood or emotion-tracking layer.** The interface does not express emotion. Only the content does.
