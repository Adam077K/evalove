---
date: 2026-08-04
status: LOCKED — founder-directed
authority: founder set the fourth direction in the session documented at /Users/adamks/.claude/plans/ceo-agent-you-are-witty-pillow.md. Every decision in "Decisions locked this session" is non-negotiable.
supersedes: 2026-08-02-DESIGN-DIRECTION.md
companion: /Users/adamks/.claude/plans/ceo-agent-you-are-witty-pillow.md
from: design-lead
to: frontend-engineer, product-designer, design-critic, design-polisher, CTO, CPO
---

# Design Law — Scrapbook & Deco
## Eva & Adam · Fourth Direction · 2026-08-04

---

## §0 — Supersession Notice

**Read this before anything else. If you obey the 2026-08-02 direction and ignore this document, you will sand the scrapbook back into a Linear clone. That is the one outcome this notice exists to prevent.**

### What is dead

The chromatic and material law in `2026-08-02-DESIGN-DIRECTION.md` is superseded in full. Specifically:

| Rule in the old law | Status |
|---|---|
| "Restraint lives in the chrome" | **Reversed.** The chrome is now made of paper, tape and brass. |
| No gradients | **Lifted for illustration and the night sky.** Still banned as a UI fill on a control. |
| No texture | **Reversed completely.** Texture is the point. |
| Two ≤2px desaturated inks as the only chromatic system | **Retired.** Authorship is carried by handwriting and by the objects a person chose, not by hairlines. |
| Bone-only canvas | **Replaced** by a library of paper stocks; `#F8F5F1` survives as the base tone *under* real paper fibre, not as a flat fill. |
| Night as "the same paper, unlit" | **Replaced** by the deco city. Night is a window onto another world, not a dimmed version of the day. |
| The v7 token system on `feat/design-foundation` | **Wrong direction, correct engineering.** Its structure (motion constants, radius scale, elevation model, the Tailwind inline theme) is reused. Its chromatic content is replaced by this document. |

The two inks (`--eva`, `--adam`) as hairlines are retired but not deleted from the token file — they still exist in the system for the stamp and for accessibility-specific authorship hints in dense list contexts. They are no longer the *entire* chromatic system.

### What survives untouched

Every behavioural rule in the old law was derived from real research, not from taste. None of them are reopened. Any agent who treats a behavioural rule as negotiable is operating outside authority.

| Rule | Why it is structural |
|---|---|
| No counters, no streaks, no scorekeeping | P4 documented the exact mechanism by which displayed counts become pressure. R2 ranked it as killer #2 across the graveyard. |
| No "seen" status, ever | Not delivered, not read, not opened, not "active now." No variant of this is acceptable. |
| Nothing that makes a missed day feel like failure | Silence on a missed day. No empty-state copy, no dashed rectangle, no plus-in-a-well. |
| Absolute stamps, never relative | "Monday, 5:12 his morning" — never "3 days ago." The two-timezone engine earns its place by being visible on every item. |
| Photographs are never dimmed, tinted or washed | Full strength, always. Including at night, on a dark ground. §1 solves this — read it. |
| Eva's name first | In copy, in source order of token definitions, everywhere. |
| No emoji | None. Ever. |
| No gamified affection-tokens | No "send a hug" button. A sticker placed on your own page is craft. A sticker sent to someone is a token. The line is authorship. |
| Private content never in any ordinary view | No thumbnail, preview, cache or notification of private content. |
| `lib/shared-day/` is untouchable | 109 tests, four DST transitions. |
| Nothing above the item on Today | No masthead, no greeting, no skeleton, no reserved placeholder. |
| No slot, no prepared place, no plus-in-a-well | The pen is always in the same place. It is never handed to anyone. |
| The seal fires only on genuine sleep | Never a manufactured timer. Never a global reveal clock. |
| The 11pm test enforced as process | Adam cannot run it. See §6. |

### The one new behavioural rule (added this session)

**Composing is never solicited.** The app must never prompt, suggest, remind or nudge anyone to decorate anything. Edit mode is found, not offered. This is not a tone note — it is a structural requirement. Any surface that hints "you could add something here" violates it.

---

## §1 — The Two Worlds

> **REVISED 2026-08-04 (founder).** The clock no longer governs. What follows replaces the previous rule that deco was the night and scrapbook was the day.
>
> **Naming:** the two worlds are now **PAPER** and **DECO**. Wherever the rest of this document says *day world* read **PAPER**, and *night world* read **DECO** — including "NIGHT ONLY" constraints, which mean "DECO only". The palettes, stocks, type registers and material rules below are unchanged and still correct; only what *selects* them has changed.

### The governing rule

**Paper is what they made. Deco is the distance between them.**

Both worlds can appear on the same screen, because a screen holds a thing they made *and* the distance it crossed. This is what makes the two styles mean something rather than decorate. A style that arrives because of the hour is a skin; a style that arrives because of what it is describing is a place.

| Surface / element | World | Why |
|---|---|---|
| The photograph, at full strength | **PAPER** | It is the thing one of them left. |
| The caption, in their hand | **PAPER** | It is theirs. |
| The Book — cover, spreads, fore-edge | **PAPER** | The Book *is* an object they made. Always paper, no exceptions. |
| The Pocket | **PAPER** | A locked envelope inside the Book. |
| Echo / archive search | **PAPER** | It returns their actual words. It quotes; it never invents. Lives inside the Book. |
| The stamp — both clocks, the other's state | **DECO** | This is the distance speaking, not either of them. |
| The window sentence (*"Eva's in bed, Adam's awake"*) | **DECO** | Same. |
| The Night City — the two skylines | **DECO** | It is literally the two cities and the space between. |
| The Record | **DECO** | A shared present moment held across the gap. Jazz register, and it earns it. |
| The one-card date suggestion | **DECO** | **The founder's instinct, and it is right.** A date is the plan to be together across the distance — so it is the distance, not the artefact. One card, gold on midnight, then out of the way. It was never going to be a browsable shelf; as a single deco card it is the best-dressed thirty seconds in the product. |
| The Tape (cassette) | **BOTH** | The cassette is an object on the table — PAPER. *Playing* it dims the room and brings the city up — the transition itself is the effect. |

### The seam, and why there is only one room

The table stands **by a window**. The table is paper; the window is deco. Both are true at once, which is how a room actually is — you do not wait for nightfall to have a window.

So the transition is not a theme change, it is **your gaze moving**. Scrolling down Today from the photograph to the stamp and the cities is lifting your eyes from the table to the window. It must be built as one continuous space with a light falloff across the seam, never as two stacked panels with a hard edge.

This preserves D2 in a stronger form. The old ruling — *moving Today → Book is turning away from the window and looking down at your lap* — was already this idea; it just needed the clock to stop pretending it was in charge.

**The seam is the hardest thing in this design and it is where the direction will be judged.** A bad seam looks like two half-designed apps stitched together, and both worlds cheapen at once.

### What still selects a world

1. **Section allocation** (the table above) — primary, and always wins.
2. **Light / dark mode** — a global override either of them can set. Dark is the lamp off: PAPER sections stay paper, lit dimmer and warmer; DECO sections come forward. It never turns a paper section into a deco section.
3. **The clock — opening default only.** Eva opening at 23:10 NYC lands in dark; Adam opening at 05:40 IL lands in light. Either can flip it, and the flip is remembered. The hour proposes; it no longer decides.

**Unchanged and non-negotiable:** photographs are never dimmed, tinted or washed — including in DECO sections, on a dark ground, at full strength. The three legal mounts in §3 exist precisely so a photograph can sit in the deco world without a filter ever touching the `<img>`.

### PAPER — The Table

**Mental model:** a table by a window with the day's things on it. Papers overlap. A pushpin holds a note. A photograph leans against something.

**Ground palette:**

| Token | Hex | Role | Reason |
|---|---|---|---|
| `--canvas-base` | `#F8F5F1` | Base tone under paper fibre | Retained from v7. Hue 34°, sat 2.8%. Red-leaning, not yellow-cream. Reads warm under a white plate (photograph). |
| `--surface` | `#FFFFFF` | Clean plate — the photograph, a white note | Separates from canvas by *stock*, never by fill. |
| `--surface-note` | `#FBF8F2` | Notes, torn paper with slight age | Warmer than `--surface`, the colour of paper that has been handled. |
| `--kraft` | `#C4A673` | Kraft paper, card, envelope flap | Visible in scrapbook references. Never as a UI chrome colour. |
| `--ink` | `#191512` | Primary text | Warm near-black, hue 34°. 16.7:1 on canvas. Never `#000`. |
| `--mute` | `#6B6259` | Secondary text, labels | Warm grey, never blue-grey. 5.49:1 on canvas. |
| `--line` | `rgba(37,29,22,0.10)` | Hairlines separating elements | Warm-black at 10%. |

Colour in the day world comes from **photographs, washi tape, pressed flowers, ink, stickers, thread**. Never from a UI fill on a control. A button is not coloured. A card background is paper, not a colour.

**Paper stocks (8 families — asset library, not CSS fills):**
These are generated assets (scanned and composited), not CSS values. The `--canvas-base` is the tone UNDER the fibre. The stock sits on top of it.

1. Bone writing paper — `#F8F5F1` base, subtle horizontal grain
2. Kraft — `#C4A673`, rougher, visible fibre
3. Ledger / ruled — `#EEE9E0`, light horizontal blue lines at 22px
4. Graph — `#E8E4DB` with warm grey grid `#C0BAB0`
5. Vellum — `#F4F1EC`, semi-transparent, used for layered overlays only
6. Newsprint — `#D4CCBC`, warm grey, coarser grain
7. Cold-press watercolour — `#EFE8DC`, slightly dimpled surface visible at high zoom
8. Onion-skin — `#F2EFE8`, near-vellum, very thin, used for delicate inner pages

**Material rules for day:**
- Objects sit on the paper and cast **contact shadows that tighten as they settle.** A photo that has been sitting for an hour casts a wider ambient shadow than one just placed. The physics system handles this — the settled state is the display state.
- Depth comes from real elevation: an object on top casts a shadow on what is below it. There are no backgrounds with z-index tricks; there is only physics.
- Nothing glows. Nothing blurs behind a glass panel. Nothing has a gradient fill.
- Warmth comes from the material, not from an applied effect. If you have to apply something to make it warm, you have made the mistake v6 made.

### DECO — The Window

**Mental model:** a window onto a deco city. Not a darkened version of the table. A different place entirely — but *in the same room*, visible at the same time, reached by looking up rather than by waiting.

This is illustration, not chrome. Nobody has ever made a deco *button.* The night face of Today is a drawn scene. The UI elements that appear in it (the stamp, the cassette, the window sentence) are objects held in the illustration — physically grounded in the scene, not floating above it.

**References that define the look:**
- Batman: The Animated Series background art — flat vector, hard-edged shadow, strong silhouette, limited palette per scene. This is the exact discipline. Not gradient mesh. Not photorealism.
- The couple-at-window painting (images 12): two silhouettes against amber-orange dusk, deep navy curtains, city beyond. This is the romantic register.
- The balcony scene (images 14): a woman on a balcony in the rain at night. Dramatic. Specific. A real place.
- The jazz salon poster (screenshot 7:38): geometric art deco border, burgundy/amber/teal, flat bold shapes.

**Night palette:**

| Token | Hex | Role | Reason |
|---|---|---|---|
| `--night-sky` | `#0D1220` | Night canvas / sky ground | Deep navy-black. Hue 225°, sat 45%, light 9%. This is the Batman:TAS night sky — clearly night, a blue-black, not grey or warm-black. Never `#000`. |
| `--night-gold` | `#C49A1E` | Building windows, streetlamps, architectural accent | Aged gold, not iPhone yellow. Hue 40°. The window-light of a lit building at 11pm. |
| `--night-emerald` | `#275E42` | Foliage, certain building faces, verdigris patina | Deep forest green. Hue 150°. From Batman:TAS interiors. Not neon; deeply rich. |
| `--night-burgundy` | `#6B1E30` | Curtains, bar interiors, upholstery, warm interiors | Deep wine red. Hue 340°. Sumptuous without reading as pink. |
| `--night-amber` | `#D4892A` | Foreground lamp light, intimate table warmth | Brighter amber. Hue 33°. The glow of a reading lamp when you are close to it. |
| `--night-ink` | `#EDE7E0` | Text on the dark ground | Warm off-white. Not `#FFF`. 14.08:1 on night sky. |
| `--night-mute` | `#A0968D` | Secondary text at night | 5.96:1 on night canvas. |

**The single hardest constraint — photographs at night:**

The rule is absolute: photographs are never dimmed, tinted or washed. Including at night, on a dark ground.

The solution is structural, not visual. **The mount carries the burden, not a filter on the photograph.**

At night, a photograph always arrives in one of three frames:
1. A **polaroid border** — its own white frame (photographed or rendered) already separates the image from the dark sky without touching the image itself. A polaroid border at `#F0EBE3` on a `#0D1220` sky is a 13.5:1 contrast. The photograph inside stays untouched.
2. A **lit window in the city illustration** — the photograph sits inside a drawn window in the building facade. The window is lit from within the illustration. The photograph occupies the window as if it were a glowing panel. The surrounding city provides context; the photograph itself is never touched.
3. **Held in the foreground, on a lit surface** — on the balcony, a photograph rests on a table lit by the night-amber lamp. The lit surface provides the separation.

What is banned: `filter: brightness()`, `filter: saturate()`, `mix-blend-mode`, any CSS filter applied to the `<img>` element or its wrapper for the purpose of night adaptation. The photograph must render identically at day and at night. Only the surrounding context changes.

**Material rules for night:**
- The illustration is layered as separate assets so the sky, far skyline, mid skyline, near buildings, and foreground can be driven live. Sky tone shifts with the real hour (deepest at midnight, lifting toward dawn). Window lights change with whether that person is marked awake.
- Flat vector and hard-edged shadow only. No gradient mesh (exception: the dusk-to-night sky gradient in the sky layer — the one place a gradient is allowed, because it is illustration, not chrome).
- The limited palette per scene rule: pick 3-4 colours per illustration layer and stay inside them. The reference images use 4-5 distinct values maximum per scene and read immediately.
- Weather is real weather from their two cities — rain, snow, clear — expressed as illustration elements (rain lines, snow scatter, cloud layers), not as overlaid CSS filters.

**The Book at night — governing metaphor for night navigation (settled, CEO-approved 2026-08-04):**

The Book's night face is the same paper stocks lit by amber lamplight from lower-left — warm, dimmer, a reading-room quality. Not the city sky as a background. Not a dark flat canvas. A lit interior.

This resolution is not just a visual choice — it defines the physical relationship between the two night surfaces. If at night you are in a lit room with the city out the window, then moving from Today to The Book is *turning away from the window and looking down at your lap.* You have not navigated to a different screen. You have changed the direction of your gaze inside one continuous space. The city is still there, behind you.

This means the two night surfaces are one continuous place rather than two separate screens. A transition between them is a physical motion, not a route change — the city view pans or recedes as the book comes into focus; the book comes back out of focus and the city reasserts as you return to Today. This is the governing metaphor for night navigation. It supersedes the §7 open item "how Today and The Book relate as surfaces" — that question is now answered: they are one room.

---

## §2 — Type

Five typefaces. No others. Any agent who reaches for a sixth is out of scope.

The count was four in the first version of this document — correct for the day world, wrong for the night world. The visual probe agent (working independently, without contact with this law) reached for a deco display face on its own. That independent convergence is the evidence. The day world's type is *handwriting on paper*; four faces is right there. The night world is *illustration*, and deco illustration is inseparable from deco lettering. Outfit set on a night city will read as a web app with a skyline behind it — exactly the "well-made and anonymous" failure the §6 logo test exists to catch. So: five faces, scoped hard.

### The two hands

**Eva's hand: Caveat** (Google Fonts, SIL Open Font License — fully commercially usable)

Justification: Caveat is the most naturalistic flowing handwriting face available under a permissive license that remains legible at 15px on a phone. Its strokes are genuinely cursive — letters connect loosely, with natural pen lift variation — but the baseline is stable enough to read at small sizes without fighting the eye. The variable weight axis (400–700) means a single face covers captions (400) and emphasis (600) without switching families. Most importantly: at a glance, it reads as *a person who writes in connected script.* That is the visual signature of Eva's hand.

**Adam's hand: Patrick Hand** (Google Fonts, SIL Open Font License)

Justification: Patrick Hand has a structured, semi-print quality that is visually opposite to Caveat's cursive flow. Where Caveat's letters lean and connect, Patrick Hand's are more upright and clearly separated — closer to the handwriting of someone who trained as an engineer or an architect. At a glance, you read the difference between the two hands without looking at a label. This is the criterion that matters: disambiguation at speed, not aesthetic preference. Patrick Hand is also highly legible at 15px in a way that more casual scripts are not.

**How to tell them apart at 15px in a phone screenshot:** Caveat flows; Patrick Hand stands. One is cursive-dominant; the other is print-dominant. This is the test.

**What these hands write:**
- Captions that were composed by that person
- Notes placed on a page by that person
- Anything authored, in the present tense of authorship

**What they do NOT write:**
- The stamp (see below)
- The window sentence
- System messages of any kind
- Labels, clocks, navigation

**They are never swapped.** Eva's text appears in Caveat. Adam's text appears in Patrick Hand. If the content's author is ambiguous, it appears in the app's own voice (Fraunces), not in either hand.

### The app's own voice: Fraunces italic

Fraunces italic is the app speaking. Not a person.

Used for: the window sentence ("Eva's in bed, Adam's awake"), editorial notes, the book's colophon, any moment the system has a voice of its own.

Fraunces italic has a warm, slightly literary quality that is distinct from both handwriting scripts and from the data display face. It reads as thoughtful, not functional.

### Labels and clocks: Outfit

Outfit is the functional voice. Used for: timestamps, duration displays, tab labels, anything that is a data value rather than a human-authored string.

Outfit is NOT a display face. It is never large. It never carries emotional content. It does data at night too — the clock, the window sentence's time values, any label.

### Night world titling: Poiret One — NIGHT ONLY

**Poiret One** (Google Fonts, SIL Open Font License)

Justification: Both Limelight and Poiret One are SIL OFL and have credible geometric deco construction from the 1920s–30s register. They are visually distinguishable: Limelight is high-drama, high-contrast, very thick-thin — the Broadway marquee. Poiret One is lighter, more uniform stroke width, the refined poster. The night world is primarily illustration, and type in it should feel part of the scene, not labeled on top of it. Limelight's high contrast commands attention and competes with the illustration; Poiret One cooperates with it. At the display sizes where this face appears (32px minimum — see scope below), Poiret One reads unmistakably as art deco without dominating the visual field. That cooperation is the criterion.

Named after Paul Poiret, whose geometric fashion sensibility is precisely the register the SALON poster and the couple-at-window references inhabit.

**Scope — this face has a leash. Read it.**

Poiret One may set:
- City indicators within the night illustration context ("New York," "Tel Aviv," a street sign in the foreground layer)
- The app's own wordmark *when displayed in a night-world context only*
- Any single-line night-world titling at 32px or larger

Poiret One must never set:
- Any caption
- The stamp — ever. The stamp is typeset in Outfit.
- Any clock value or time display
- Any navigation label
- Any body text or note
- Anything in the day world — even a heading
- Fraunces italic's territory (the window sentence, editorial voice, book colophon)
- Outfit's territory (data values, labels)

If Poiret One appears at less than 32px, it is being misused. Its thin strokes become illegible below that threshold.

The leash exists because a deco face with no constraint becomes a costume. It is one accent in a large composition; if it leaks into functional text or daytime surfaces, the design collapses into theming.

### Register table

| Content type | Face | World |
|---|---|---|
| Eva's captions, notes | Caveat | Day (and Book) |
| Adam's captions, notes | Patrick Hand | Day (and Book) |
| The stamp | **Outfit** | Both — the stamp is never handwritten |
| The window sentence | Fraunces italic | Both |
| The book's colophon | Fraunces italic | Both |
| Clock values, durations | Outfit | Both |
| Navigation labels | Outfit | Both |
| Book page headings | Fraunces italic | Both |
| City indicators in illustration | **Poiret One** | Night only, ≥32px only |
| App wordmark in night context | **Poiret One** | Night only |

**The stamp rule in full:** The stamp reads *"left while Eva was asleep · Adam 6:20 am · Eva 11:20 pm"*. It is typeset in Outfit at small scale (10–11px equivalent). It is **never** in Caveat or Patrick Hand. The reason: the stamp is the app observing what happened. It is a fact, not a feeling. Handwriting the stamp would imply one of them wrote it. They didn't. The app wrote it.

### Typography craft floor

- Curly quotes (" " ' ') everywhere. Straight quotes are a regression.
- En dash for ranges (5:12–6:20). Em dash for breaks — like this. One space after punctuation.
- `'` does not work in JSX text content. Paste the real UTF-8 character.
- Body measure: 45–90 characters per line.
- Scale contrast: large versus small, with little in between. A 48px label beside an 11px meta label. Nothing in the mid-range unless it serves a specific reading purpose.
- Text stays at WCAG AA whatever happens.

---

## §3 — The Material Library

These are the physical families that make up the scrapbook. Every item in the list is an asset to be generated with a unified style bible (one fixed style prompt, one reference set, one seed, per family — the brief's instruction on asset coherence).

This section specifies what exists and what each piece must do. Generation specs come from the style bible (Phase 0b work, not this document).

### Paper stocks

8 families, specified in §1. Physical requirements for each:
- Realistic fibre texture visible at 2× pixel density
- Natural curl at torn edges (not a straight rectangle)
- No photorealistic shadow baked in — shadows come from the physics engine at runtime
- Light transmission: vellum and onion-skin must feel translucent when layered (achieved via asset transparency at the edges)

### Washi tape

12 patterns. Each is a strip asset designed to be placed at any angle, bridging two objects or anchoring one to the surface.

Physical requirements:
- **Translucency is mandatory.** Washi tape is semi-transparent. You should see the paper or photograph beneath it. Opacity approximately 65–75%, with natural fibre variation.
- Real fibre texture visible
- Slightly rough edges (not a clean cut)
- No uniform opacity — real washi tape has variation across its width

Pattern families:
1. Geometric: stripes (narrow), houndstooth, chevron — 3 variants
2. Floral: small blooms, pressed appearance — 2 variants
3. Kraft / neutral: torn-paper-coloured, nearly invisible except for the texture — 1 variant
4. Colour-field: sage green, blush, dusty blue — 3 variants
5. Botanical: leaf pattern, vine — 2 variants
6. Scallop edge: one variant, white scallop border on translucent field — 1 variant

### Mounts (photo presentation frames)

Every photograph appears in a mount. A photograph without a mount is not on the scrapbook — it is a UI element. A mounted photograph is an object.

**Polaroid frames — 3 variants:**
- Classic: thick white bottom border, thinner sides and top. The classic ratio.
- Wide-border: equal borders all around, slightly more square.
- Mini: half the classic size. Used for secondary or older photographs.

Physical requirements: the frame should show subtle paper texture. The bottom border is the natural place for a handwritten caption (Caveat or Patrick Hand, depending on who mounted it). The frame corners show the slight shadow a polaroid casts on the surface behind it.

**Photo corners — 4 pieces that sit at the corners of a photograph:**
Semi-transparent black or manila craft paper corner sleeves. Used when the photograph is not in a polaroid frame. The four corners together imply the photograph is held to the page without a full frame.

**Torn-edge mounts — 8 variants:**
A piece of backing paper with a torn, irregular edge, on which the photograph sits. The tear can be at any edge or combination of edges. The photograph overlaps the mount. This is the most "handmade" of the mounts.

Physical requirements: the tear edge must look genuinely torn, not cookie-cut. Each of the 8 variants should have a different tear character (rough/fine, long/short, angled).

**Deckle edge — 1 variant:**
Soft wavy edge as if torn from watercolour paper. Used for notes and text pieces, not for photographs.

### Fasteners

These hold things to the surface. They cast real shadows and have mass.

**Pushpins:**
- Eva's pushpin: brass-topped, warm gold. This is her colour, expressed through the object she uses.
- Adam's pushpin: cream or off-white topped. Neutral.
- Shared / neutral: matte black or dark olive.
- 3 variants total. Each has: a pin body, a round or faceted top, a tight shadow underneath (contact shadow), a small ambient shadow on the paper behind it.

**Binder clips:**
Large (for thick paper stacks) and small (for single sheets).
Physical requirements: shiny chrome/steel texture, the two handles visible from the clipped position. Must render convincingly at mobile pixel densities.

**Paperclips:**
Standard and large. Semi-reflective silver. Used to attach one item to another, visible at the corner.

**Staples:**
Silver, very small. Used for multi-page attachments. Barely visible but present.

**Brads (brass paper fasteners):**
Brass-coloured, visible where the prong splits behind the page. Used for attaching items that rotate.

### Stickers

**The sunflower is first and it is Eva's motif.** This is not negotiable. The sunflower appears first in every sticker drawer, first in every array, first in every picker. The seed in the composition algorithm gives it higher placement weight when Eva has recently composed a page.

Sticker families:

**Pressed botanical (pressed flowers, flat, slightly translucent, dried colour):**
1. Sunflower — **Eva's motif, always first** — warm gold, slightly dried, with visible petal detail at full size
2. Lavender — pale purple, sprigs
3. Baby's breath — white-cream, cloud of tiny blooms
4. Rose — deep pink, single head, pressed flat
5. Fern frond — green, arching
6. Daisy — white petals, yellow centre

**Stars (foil-style, slightly shiny):**
Gold stars, 3 sizes. The kind you put on a child's homework. Unpretentious.

**Playing card elements:**
Ace of hearts. Two of hearts. Used sparingly — from the reference imagery, these read as small, slightly mischievous.

**Cherries:**
Illustrated, bright red, a pair with stems. Small. From the reference imagery.

**Vinyl record (The Record motif):**
A small illustrated vinyl record for pages that include a shared listening moment.

**Music notes:**
Small decorative, not functional. For musical moments.

**All stickers share:** clean-cut or slightly rough cut edge (not a perfectly smooth SVG circle), no internal shadows (they are flat objects), a very light contact shadow when placed on the page.

### Thread and ribbon

Used as visual connectors between items, not as UI elements.

- Jute twine: visible on cork board-style compositions. The reference imagery shows it.
- Sage green silk ribbon: ties around a folded note, or hangs from a pushpin.
- Blush ribbon: similar use.
- Embroidery floss: red or dark green, stitched appearance between pinned items.

These are used sparingly — one or two per composition at most.

---

## §4 — Composition Law

### The diagnosed defect (carry forward from the build team's findings)

> "Five full-width elements at one width, one radius, one elevation, one rhythm — the eye finds that rhythm on the second element and stops reading."

This was documented from the current build. The law exists to prevent its recurrence.

### The five moves (from the prior law, now extended)

1. **Full bleed one element — off one edge, not four.** The hero photograph on Today bleeds off a single edge of the viewport and is clipped there. Three edges remain visible, showing the mount, the rotation, and the paper beneath. This satisfies "full bleed" in spirit — the object is larger than the frame it sits in — while preserving the scrapbook logic: a photograph on a table can extend past the table's edge without covering the entire table. A photograph that bleeds to all four edges simultaneously cannot wear a polaroid border, cannot sit at an angle, and cannot show the paper underneath it; those three things together describe a photograph that has escaped its scrapbook and become a background. Today's hero photograph is not a background. It is an object. The single-edge bleed is the rule.

2. **Unequal pairs.** When two items appear near each other, one is larger. One leads; one follows. Never two equals.

3. **One masthead per surface.** The Book has a cover. Today has the photograph. Neither has a header bar.

4. **Type directly on paper.** The caption sits on the paper, not in a labelled container. The window sentence sits on the paper near the photo, not in a pill below it.

5. **Varied vertical rhythm.** No two successive elements have the same top margin. The eye must re-establish distance at each item.

### What rotation, overlap and mass add (new this session)

**Rotation** introduces a sixth visual variable that breaks the grid. A photo rotated −4° makes the eye work to resolve it. That work is engagement, not friction. The eye lingers. A composition where every element is at 0° is a spreadsheet.

Rotation ranges are context-specific, not global. The reason for the split is stated here and must not be "fixed" by unifying them — the inconsistency is intentional.

| Context | Range | Reason |
|---|---|---|
| Today hero photograph | −5°…+5° | Large, single-edge-bleeding, subject-forward. More than ±5° eats vertical space on a 393px screen and crops the subject badly. The rotation is read from the visible mount edges and corner wedges of paper — it does not need to be aggressive to be legible. |
| Photographs inside The Book | −8°…+8° | Smaller, surrounded by other objects, the scatter is the compositional point. Wider rotation reads correctly here because the photograph is one item among many, not the anchoring element of an entire surface. |
| Notes and torn paper | −5°…+5° | Text alignment makes large rotations hard to read at speed. |
| Stickers | −15°…+15° | Lightweight, tumble. Any angle is plausible. |
| Washi tape | perpendicular to bridged edge, ±5° | Tape bridges objects; it should read as placed with intent, not dropped. |

**Overlap** creates implied depth without an explicit z-index system. When a note sits partially behind a photo, the photo has mass — it is the heavier object. The relationship becomes legible through depth alone.

**Mass hierarchy:** A heavier object sits on top of a lighter one in any contact.
1. Photograph — heaviest
2. Note, torn paper — substantial
3. Washi tape — light, bridges objects
4. Small sticker — lightest, sits on top of anything

The rule: in any composition, mass is unequal and hierarchy is clear. What is banned: three equally-rotated photographs at the same elevation, none overlapping. That is a template grid wearing a rotation costume.

### The auto-composition system

Composition is deterministic, seeded from item ID. It never re-rolls. Reason: if a page looks right at 9am, it looks right at 9pm. A page that re-composes itself on refresh is a page that never finishes — which creates the exact "unfinished" feeling the no-slot rule is protecting against.

The seed determines: rotation angle, mount type, mount position relative to the photo edge, sticker placement, tape placement. Within the seeded values, the physics engine settles the objects to their final positions on mount.

**The seed must be the item's stable database ID, never its array index or its position in a list.** An index-seeded composition silently re-rolls the entire page the first time an item is inserted or removed — because inserting at position 0 shifts every subsequent index by 1, changing every item's seed, changing every rotation and mount assignment, producing a page that looks entirely different from how it was left. This failure will not be caught by looking at the screen once; it appears only when the page is revisited after a write operation. Using the item's stable ID as the seed is the only implementation that honours "never re-rolls."

### The Tuesday test consequence for composition

A composition without a photograph must be somewhere worth being. This means:
- Bare paper is not an empty container. It is a clear table.
- A note on bare paper (no photograph) is a valid and complete composition.
- A washi tape strip and a stamp on bare paper is a valid and complete composition.
- The absence of a photograph is not marked. No dashed rectangle. No "nothing yet."

The ban on slots is not just a copy rule — it is a composition rule. There is no reserved rectangle where a photograph would go. The paper is always the default state.

---

## §5 — Motion and Physics Law

### Measured constants (carry exactly)

These values were measured from shipped source (Vaul, Sonner), not asserted. Do not re-derive. Do not reset.

| Motion | Value | Provenance |
|---|---|---|
| Press | `150ms cubic-bezier(0.22,1,0.36,1)`, `scale(0.97)` | Correct in v7 globals. Keep. |
| UI transition | `220–320ms` with `--ease-out` | Correct in v7 globals. Keep. |
| Sheet / drawer | `500ms cubic-bezier(0.32,0.72,0,1)` | Measured from Vaul source. |
| Toast in | `300ms` | Measured from Sonner source. |
| Toast swipe-out | `200ms` | Measured from Sonner source. |
| Toast gap | `14px` | Sonner's `GAP` constant. |
| Spring — content | `stiffness 300, damping 30` | Deliberately stiffer than the motion library default. Do not reset. |
| Spring — chrome | `stiffness 420, damping 34` | Deliberately stiffer. Do not reset. |

### Physics rules

**Paper does not bounce.** High damping; everything reaches rest inside ~400ms. This is not a reduction — it is more physically accurate. Real paper dropped on a table does not bounce. It makes contact and settles. Overshooting is a rubber-ball behaviour, not a paper behaviour.

**Arranged pages load pre-settled.** A page someone composed yesterday is already settled when it opens. Physics activates on interaction (drag, place, remove), not on mount. No object enters with an animated settle on page load unless it was just placed in this session.

**Transform, opacity and filter only.** Never `top`, `left`, `width`, `height`. Never `margin`, `padding`. These properties repaint; they are banned.

**`prefers-reduced-motion` → full removal.** Following Sonner's actual shipped CSS: `transition: none; animation: none`. Not degraded to opacity-only. Full removal. Our own animation skill's degradation guidance is wrong on this point; follow the shipped source.

**Stagger ≤50ms.** Never animate keyboard-initiated actions.

**The page turn** (The Book) follows the thumb. The sheet bends at a natural flex point, the back catches light. This is the one expensive signature moment and it is engineered properly — a CSS perspective + transform sequence with the measured spring values above, not a pre-baked animation.

### The `<Mounted>` primitive

Every physical object on the scrapbook surface is rendered through a `<Mounted>` component that manages: its rotation (seeded, not random), its elevation (in the mass hierarchy), its contact shadow, its physics state (settled / being-dragged / settling). This primitive is the foundation of Phase 1 and nothing in Phases 2–7 can exist without it.

---

## §6 — The Four Tests

These are the acceptance gate. A screen that does not pass all four is not shipped. Design-critic applies them.

### 1. The Tuesday test

Render the surface with **no photograph on it at all.** Not as a loading state — as a real state. Their entire photo supply is two people, one of whom is always asleep. A day when no photograph has arrived is Tuesday at 3pm, not an edge case.

Is it still somewhere worth being? If it reads as a container waiting to be filled, it fails. If the paper and the objects on it are their own reason to look, it passes.

Previous failure mode: the old law took this empty state, wrote it into statute as the standard, and produced a page that was only interesting when a photograph was present. This law reverses that. The paper is the answer to the Tuesday test, not the photograph.

### 2. The logo test

Screenshot the surface. Remove the wordmark. Would you know it was this app?

The failure mode is not ugliness. It is being well-made and anonymous. A professional-looking interface that could belong to any product in the category fails this test. The scrapbook idiom, applied consistently, should make the product unmistakable without a logo.

### 3. The 11pm test

Walk the surface as Eva in New York at 11pm with the lights off, on an iPhone, installed to the home screen. Not as Adam at 5am. Not as a designer at noon. As the exhausted one at the end of a long day.

**This test is enforced as process because the person who cannot run it is the one building it.** Adam will live his 5am hundreds of times and will never once live Eva's 11pm. Every instinctive "does this feel right" check runs from his side of the gap. The product will drift toward fitting him exactly and approximating her — invisibly, because from inside it only ever feels better.

Concrete requirements:
- Nothing ships until it has been walked as the exhausted one, not the alert one
- The reveal that is savourable at 5am cannot be friction at 11pm
- Notification quiet-hours verified against both zones
- Night mode designed alongside day, never after

The 11pm test has one specific pass criterion for night: **the brightest thing on Eva's screen is Adam's photograph, not a navigation element.** If any chrome element (dock, label, stamp) is brighter than a present photograph, it fails.

### 4. The slop test

The founder's own test. Two directions have already failed it.

This one has no written rubric because it is a recognition test, not a checklist. The failure state has a specific texture: it looks like something a well-meaning AI generated, not like something a person made for two people.

The scrapbook idiom should make this test easier to pass than the previous directions did, because the idiom is specific and physical. But the test still needs to be run. No direction is immune to being executed generically.

### Verification mechanics

- Viewport: 393×852, both modes
- Full-page captures lie about `position: fixed` — they paint at viewport offset inside full document height. This has caused two false alarms in this project. Verify fixed elements at their actual viewport position.
- Add `?mode=night` to any URL. Night is a primary surface and is tested simultaneously with day.
- Frame rate: 60fps with a full page of objects, on a real iPhone, not a desktop throttle.

---

## §7 — What This Law Does NOT Decide

This section is honest about scope. An agent who reaches into these areas without a separate directive is over-stepping.

**Left open for screen work:**
- The exact paper stock assigned to each page type (that is per-page composition work)
- Specific washi tape patterns for each person (that is taste-level personalisation)
- The detailed city illustration: exact skyline silhouette, building shapes, neighbourhood reference for each city
- The rotation seed algorithm implementation detail (the *range* is specified; the implementation is engineering)
- The edit mode UX: which gestures trigger it, how tools appear, how drag-to-place works
- The pocket (The Book's locked envelope) interaction model
- The cassette's visual treatment at both scales (small object on Today vs. full record display)
- Night navigation animation: the exact motion of turning away from the window toward the book (the metaphor is settled in §1; the animation spec is not)

*(Navigation model for night — how Today and The Book relate as surfaces — was listed as open in the first version of this document. It is now settled by the §1 Book-at-night governing metaphor: they are one room, two directions of gaze.)*

**Deliberately deferred:**
- The token file (`globals.css`) rewrite: this law specifies the values; a separate Phase 0 token task implements them
- Asset generation style bibles: this law specifies the family counts and physical requirements; Phase 0b generates to those specs
- Night city illustration plates: the layered PNG/SVG plates are their own Phase 0b asset

---

## §8 — Disagreements with the Brief

**Any agent on this project who argued back improved the outcome.** This section records the three disagreements raised in the first version of this document, and their CEO rulings (2026-08-04). All three are now settled. Do not re-open them.

### Disagreement 1 — D2: The Book at night — APPROVED

**Original brief (D2):** "The Book is always paper — at night it is the same paper under a dimmer lamp."

**Disagreement raised:** This formulation, if implemented literally as `--night-sky` behind paper-coloured cards, produces a dark mode that is visually incompatible with Today's deco city night face. Entering The Book from a drawn scene into a dimmed flat surface is a jarring material jump. The amber-lit reading room resolution (§1) is coherent with D2's actual intent — the object does not change, the light on it does.

**CEO ruling:** Approved as written. The "same paper under a dimmer lamp" formulation was underspecified; the amber-lit reading room is strictly better and honours D2's intent. The governing metaphor (turning away from the window and looking down at your lap) has been added to §1 and settles the night navigation model. See §1 for the full text.

### Disagreement 2 — Sorriso New York reference — APPROVED

**Original note:** Screenshot `7:39:32 AM` (Sorriso New York, halftone restaurant image) is a different visual register — warm, analogue, photographic, not illustrative deco — and should not be in the city illustration generation brief.

**CEO ruling:** Correct. Keep it out of the city-illustration brief. Park it against the cassette or record feature work, where its warm-analogue-photographic quality may be relevant.

### Disagreement 3 — Rotation range — PARTIALLY UPHELD

**Original brief:** −3°…+3° for photographs.

**Disagreement raised:** At ±3° the rotation reads as a rendering artifact. The reference images show significantly wider rotations; ±8° is needed for the eye to register a physical placement.

**CEO ruling:** ±3° was too tight; ±8° as a single global value exposed a contradiction: the Today photograph cannot simultaneously be full-bleed AND mounted AND rotated at ±8°. Both issues corrected together:

1. The full-bleed formulation is corrected to single-edge bleed (see §4 move #1). Three edges remain visible — the mount and paper are preserved.
2. Rotation is split by context, not unified. Today hero: ±5°. The Book photographs: ±8°. Full table in §4. The reason for the split is stated in §4 and must not be unified by a later agent.

---

## Summary of key numbers

| Constant | Value |
|---|---|
| Day canvas base | `#F8F5F1` |
| Day ink | `#191512` |
| Night sky | `#0D1220` |
| Night gold | `#C49A1E` |
| Night emerald | `#275E42` |
| Night burgundy | `#6B1E30` |
| Night amber | `#D4892A` |
| Eva's hand | Caveat (Google Fonts, SIL OFL) |
| Adam's hand | Patrick Hand (Google Fonts, SIL OFL) |
| App voice | Fraunces italic |
| Data/labels | Outfit (both worlds) |
| Night world titling | Poiret One (Google Fonts, SIL OFL) — night only, ≥32px only |
| Today hero photograph rotation | −5°…+5° (seeded, deterministic) |
| Book photograph rotation | −8°…+8° (seeded, deterministic) |
| Note rotation | −5°…+5° |
| Sticker rotation | −15°…+15° |
| Physics settle time | ≤400ms |
| Press duration | 150ms |
| UI transition | 220–320ms |
| Sheet / drawer | 500ms |
| Spring (content) | 300 stiffness / 30 damping |
| Spring (chrome) | 420 stiffness / 34 damping |
| Paper stocks | 8 families |
| Washi patterns | 12 |
| Mount variants | 3 polaroid + 4 corners + 8 torn + 1 deckle |
| Sunflower | Eva's motif, always first |

---

## §9 — What Wave 0 proved (added 2026-08-04, after the build)

Everything below was *measured*, not asserted, while building the material foundation. It is law now because it was earned, and because rediscovering any of it costs hours.

### 9.1 The window is dramatic because the room cannot be

**Keeping dark ink on paper (D1) puts a WCAG floor under how far paper may dim.** Measured at the accepted night values: ink ~8.5:1 on the night surface, `--mute` held at 4.6:1, `--danger` re-darkened to 4.5:1. Dim past this and text fails *before* atmosphere is gained.

The consequence is the important half: **the true dark of night belongs exclusively to the DECO window.** This is not a compromise forced by accessibility — it is a structural proof that the D1 reversal was right. Paper cannot go dark, so the drama has to live in the window, which is exactly where the law already put it. Do not try to buy night-feeling by dimming the paper further; you will lose the text and gain nothing.

### 9.2 Paper dims, it never inverts

Night dims the PAPER scale (~×0.73, warm) with every relationship preserved: `--surface` stays lighter than `--canvas`, the well stays recessed, `--ink` stays dark ink on lit paper. The old night block that *inverted* the scale is deleted — ~140 lines of it, all inversion-management, which is the tell that the superseded law was fighting itself.

**Testable gate: at night a note's mean luminance must be HIGHER than the table's.** Measured on the accepted build: notes 182, table 173. If a note is darker than the surface it sits on, the model has re-inverted.

### 9.3 The lamp: one dimming amount for the whole table

One light source dims the substrate and everything on it — tape, pins, torn mounts, seam strip, stickers — as a single surface under a lower lamp. **Photographs never carry it** (`.photo` stays `filter: none`), per the standing behavioural rule.

Implement as a per-material filter driven off one token, **not** a blanket overlay div: an overlay also multiplies token-styled text and surfaces that already dim through the token change, so they dim twice and night text dies. Same physical model, one amount, applied once. Accepted value `0.27` against dimmed tokens — note that an earlier `0.78` was correct against the *inverted* baseline; when the baseline changed the number had to be re-derived from the principle rather than preserved.

### 9.4 Substrates are generated as stocks, never derived from edges

Mirror-stacking a narrow strip to fabricate a substrate turns its diagonal grain into **herringbone weave**. Substrates must be generated as full-bleed stocks.

The converse also holds and is not a contradiction: mirroring a *square* stock with non-directional tooth is fine, and is how a non-seamless vertical wrap gets tiled (raw edge diff 10.6 vs 6.6 internal). Direction of grain decides, not the technique.

### 9.5 Two papers never reconcile by scaling — match character, not density

The join between substrate and seam strip is governed by **texture character**, measured as anisotropy — which is what "laid lines" means numerically:

| | rgb | texture sd | anisotropy |
|---|---|---|---|
| cold-press stock (adopted) | 221,212,193 | 10.45 | **1.58** |
| `seam-tear-coldpress` (strip) | 229,220,198 | 9.10 | 1.43 |
| `paper-bone-laid` (rejected) | 235,227,212 | 7.31 | 1.82 |

Scaling matches *density* and cannot fix *character*. Bone-laid was tuned to 134% and stalled at a 1.52 delta; the cold-press stock at 58% reached 1.02, and the join became invisible. **If a join will not close, change the paper, not the percentage.**

### 9.6 Day and night disagree about a light falloff

> **SUPERSEDED 2026-08-06 (measured on `feat/deco-and-tray`).** The mechanism below is half right, and the acceptance behind it was incomplete. The fog was never day-only: profiled at 393×852 in both modes, luminance under the tear fell 129→18 over ~104 CSS px by day and 97→18 by night — the same shape, night simply leaking a dimmer page (behind the transparency sits the canvas: `#F8F5F1` by day, `#BAB1A2` by night, both bright next to the sky). The fog lived in the mid-band, where the accepted stops held 0.55–0.8 opacity for ~45px.
>
> The original acceptance — approved by the CEO on endpoint measurements — profiled the steep start and the deep end and assumed the middle. That is the transferable lesson, worth more than the numbers: **a measurement can be as unexamined as a report. Checking the ends of a curve is not checking the curve.**
>
> What survives, re-verified: light stays on the torn lip (the steep start was correct), and a lip that goes straight to dark still reads as a mask. What changes: the mid-band must commit (0.6→0.9 over ~20px), and the long deep end runs nearly opaque (0.9→0.97→sky), so the slow deepening that gives night its distance happens between luminance 40 and 18 instead of 129 and 18. Re-measured after the change: the fog band went 104→24 CSS px, and the 24 that remain are the lit lip itself. Stops as shipped in `Seam.tsx`: 0 to 47%, 0.6 @ 55%, 0.9 @ 63%, 0.97 @ 74%, `--night-sky` @ 93% (of the 256px Seam).

**Original finding (superseded, kept legible):** A slow, long falloff reads correctly at night and as **fog** by day, because the difference is what sits *behind* the transparency — over a bright canvas a long semi-transparent run leaks page-light under the torn edge. The accepted geometry is asymmetric: steep under the fibre (0→0.6 over ~15px), then a long deep end (~90px into `--night-sky`). Light stays on the torn lip; a lip that goes straight to dark reads as a mask rather than an object.

### 9.7 Keying: luminance is wrong for pale objects

`α = 1 − L/255` is correct **only** for the black-on-white city silhouettes. Applied to a white daisy, baby's breath, a cream ticket or a white polaroid frame it deletes the subject — luminance cannot distinguish a white petal from white paper. Use a **border-connected flood fill** so only background reaching the frame edge is removed, plus a soft edge and an unpremultiply so anti-aliased pixels carry no white fringe on a dark ground. Tooling: `docs/08-agents_work/tools/key_assets.py`, verified with `proof_sheet.py`, which composites every asset over both grounds at once — a halo is invisible on paper and obvious on midnight.

### 9.8 Acceptance is measurable

The seam was accepted on numbers, not opinion, and the same gates apply to any later boundary:

- Luminance step across a join: **< 15** (accepted build: 0.2 day, 0.1 night)
- Texture sd delta across a join: **≈ 1.0** (accepted: 1.02 day, 0.75 night)
- A note at night is lighter than its table (accepted: 182 vs 173)

Do not chase a proxy past the point the visual gate has passed. The day delta sat at 1.52 with the join already invisible to two independent observers and to an automated probe; that was worth one ten-minute A/B, not a fourth iteration.
