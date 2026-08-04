---
role: design-critic
task: foundation-review
branch: feat/design-foundation
head: 43cecbb
reverified_at: 303ba2b
date: 2026-08-02
verdict: CHANGES REQUIRED
reverify_verdict: all four P1s cleared; one new P2 introduced by the P3-3 fix
tuesday_test: FAIL
logo_test: FAIL on every authenticated surface, PASS on login
status: COMPLETE
---

> **Re-verification at `303ba2b` is in §9 at the end of this file.** The body
> below is the original review against `43cecbb` and is left unedited, so the
> findings and the responses to them can be read against each other.

# Design Critic — Foundation Review (v7)

Judged against `docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md`.
Evidence is the committed `viewport-*` captures and the source at `43cecbb`.
I did not run the app; where I judge a state that has no capture (a surface with
no photograph on it) I say so and I cite the code path that produces it.

The three known capture artifacts — dock mid-page, the `NEXTJS-PORTAL` badge,
the "Reading aloud until she sleeps" wrap — are not reported.

---

## 1. The Tuesday test — FAIL

> *Render the surface with no photograph on it at all. Is it still somewhere
> worth being? If it reads as an empty container waiting to be filled, it fails.*

Design-lead self-assessed PARTIAL PASS and named the coverless book tile. The
book tile is real and worse than described. It is not the main problem.

**What a photograph-free Home actually renders**, traced through
`app/(app)/home/page.tsx`:

| Element | Photo-free state | Source |
|---|---|---|
| Header | micro date + 33px Fraunces line | `HomeHeader.tsx:37-42` |
| Clocks | two plates, 38px digits, breathing dot | `DualClocks.tsx:77-98` |
| Today | card containing two `well` tiles, each a white circle with `+` and a name | `home/page.tsx:137-152` |
| Sealed | card, mail glyph in a circle, ink pill | `SealedCard.tsx:72-95` |
| Tonight | card, sparkles glyph in a circle, eyebrow + title + meta | `TonightCard.tsx:59-82` |
| Book tile | `well` slab under a 74%→12% dark gradient with white type on it | `home/page.tsx:210-227` |
| Echo tile | `tile-ink` black slab | `EchoTile.tsx:37` |

Two findings that the PARTIAL PASS missed.

**The coverless book tile is not merely blank — it renders wrong.**
`home/page.tsx:211` falls back to a `well` (`#f1ede7`) and then `:213-220`
paints the full-bleed dark gradient over it regardless. In day mode that
composites to a muddy grey-brown rectangle carrying white text on a warm paper
page. It is the only element in the system that is neither paper, plate, well,
photograph nor ink. It is not an empty state; it is a rendering accident.

**With the photographs gone, the dominant visual motif of the product is a
lucide glyph centred in a circle.** Count them in `viewport-home-day-top.png`
and `viewport-home-day-scrolled.png` with the two photos removed: lock, two
presence dots, the `+` in Eva's slot, mail, sparkles, book, Echo waveform, dock
`+`, dock Home — ten circles, eight of them a glyph in a ring. That component is
the single most reproduced object in machine-generated interface design. On
Tuesday it *is* the interface. Photographs are currently hiding it; they will
not hide it most afternoons.

So the honest answer to "is it still somewhere worth being": it is pleasant, it
is not embarrassing, and it is an empty container waiting to be filled. The
paper is good enough that the failure is quiet, which makes it more dangerous,
not less.

---

## 2. Has it escaped, or changed costume? — PARTIALLY RE-COSTUMED

Not v6 slop. Genuinely not. But the escape is half-completed, and the half that
was completed is the easier half.

**The founder's instruction was two-sided:** take layout, type, structure and
motion from all five references; take colour from none. §2 of the direction
enumerates, reference by reference, exactly which structures to take.

Here is what was actually taken:

| Reference | §2 says take | In the branch? |
|---|---|---|
| SORDJATI | edge-to-edge display type as structure; extreme scale contrast; photo pair at unequal weights; caption-below-photo; black pill with nested arrow; `+` accordion with no container | Masthead **on login only** (`login/page.tsx:33`). Black pill: yes. Everything else: no |
| `24199150…` events | vertical date rail with a multi-day active pill; chip filter row; two-weight headline; **detached dock pill**; poster cards with type baked in; avatar cluster | Detached dock pill: yes (`Dock.tsx:66-89`). Everything else: no |
| `original-62c7…` time capsule | capsule as titled dated object; **voice waveform player**; month calendar with markers; paired big-number stat; photo strip inside a capsule card | None. The waveform appears as a 20px lucide glyph, which is a decoration of the idea, not the idea |
| `6b2ad671…` memories | scattered photo cards at varying rotation and depth; album tile with title+count over image; `+9` overflow tile | Album tile (the book tile) only |
| `9e22d054…` Lunara | **fanned card stack with real depth and rotation**; segmented tab control; editorial serif for headings with grotesque UI | Serif/grotesque split: yes, and done well. Card stack: no |

Two structural contributions out of roughly twenty. The colour law has been
executed with real rigour — every token is argued, `--eva`/`--adam` are
deliberately unreachable from Tailwind, the aurora is gone, the kill list is
honoured almost everywhere. The layout law has barely been started.

That asymmetry has a name and it is the costume. What remains when you take
saturated consumer references, strip the colour, keep the card stack and add a
serif is: warm off-white paper, large editorial serif headings, 11px uppercase
letterspaced eyebrows, lucide glyphs in circles, rounded cards at one width, a
floating pill dock with a black FAB. That is a recognisable house style and a
thousand generated pages share it.

**On `#F4F1EA` specifically.** Design-lead avoided the cream and argues at
`globals.css:40-58` that `#F8F5F1` escapes it by leaning red (hue 34°) rather
than yellow. The reasoning about skin hue is good and I believe the intent. But
at 2.8% saturation, hue is not perceptible — the delta between these two values
is invisible on a phone. The anti-cream defence is a rationalisation of a colour
that was going to be chosen anyway. It is not a *problem*; the canvas is fine.
It is just not the escape it is documented as being, and it should not be
counted as one.

**The logo test.** Remove the wordmark from `after-login-day.png` and you have
"TWO CITIES, ONE BOOK" over a 59px edge-to-edge grotesque and a password field —
distinctive, confident, unmistakably from the SORDJATI lineage. That screen
passes. Remove the wordmark from `viewport-home-day-top.png` and the honest
answer is: a well-made journalling or habit app. It fails.

The one thing that would make Home identifiable is already on it and is
currently wearing the most generic available costume: **two clocks, two cities,
side by side, one of them showing a person asleep.** No other product has that.
It is rendered as two identical 50/50 cards.

**So I agree with design-lead, plainly and on the record:** bringing the radius
down removed a signal without adding a structure, and Home is five full-width
elements at one width, one radius, one elevation, one rhythm. It is worse than
that — Home contains *three* 50/50 pairs (clocks, the two Today slots, book +
Echo), and a 50/50 pair is the most templated shape in the kit.

---

## 3. Night — best palette in the branch, wrong composition, and unreachable

**As a material: excellent, and the strongest work here.** `globals.css:188-255`
is the same paper unlit, not an inverted day — `#1E1A17` at hue 26° is the day
canvas taken down in value, wells go *darker* than surfaces because a recess at
night is in shadow rather than in light, the ink pair holds hue exactly across
modes at luminance parity (0.337 / 0.325), and photographs are never dimmed.
That is designed, not generated. Protect all of it.

**As a composition: it fails its own stated hierarchy.** §2 of the CSS says "at
11pm the brightest thing on Eva's screen is Adam's face." In
`viewport-echo-night-top.png` there is no face, and the three brightest objects
on the screen are the header avatar, the dock's send FAB and the active tab
pill — all chrome, all `pill-ink` inverted to `#ede7e0` on a `#1e1a17` page. In
`viewport-home-night-top.png` the dock outglows Adam's photograph, which is a
dark star-trail image. In the most-used window in the product, the brightest
thing on screen is a navigation button.

Does anything glow like a lamp in a dark bedroom? Yes — the wrong things. There
is no element on any night surface that reads as a light source belonging to the
content. Night is competently unlit; it is not lit.

**And nothing can put you in it.** `data-mode` is set by no component anywhere
in `apps/web` — the only occurrences are the seven selectors in `globals.css`.
Night is reachable exclusively through `prefers-color-scheme: dark`. Eva's
iPhone on the default Light setting gets `#F8F5F1` at full brightness in bed at
11pm. The night tokens are the best-argued thing on this branch and they are
currently unreachable by choice.

---

## 4. The law, clause by clause

| Clause (§1) | Status | Evidence |
|---|---|---|
| No gradients of any kind, anywhere | **VIOLATED** | `home/page.tsx:173`, `:218` — two photo scrims. Skeleton sweeps at `DualClocks.tsx:125`, `TonightCard.tsx:32`, `DatesExplorer.tsx:109` are also gradients, but they describe loading and I accept them |
| No glow | HELD | nothing found |
| No glass / `backdrop-blur` | **VIOLATED** | `QuickSend.tsx:124` — `bg-black/45 backdrop-blur-md` |
| No coloured fills standing in for hierarchy | HELD | `--eva`/`--adam` are not exposed to Tailwind at all (`globals.css:279-299`); reaching them requires new CSS |
| Photographs never dimmed, tinted or washed | **VIOLATED** | `home/page.tsx:213-220` washes the entire book cover |
| Warmth from material, not applied | HELD | canvas + `NoiseLayer` at 2.2%, warm-tinted shadows, no painted light |
| Surfaces separate by hairline and space | HELD | `card` / `well` / `photo`, `globals.css:513-533` |
| Authorship hue ≤2px edge or small dot, only on something that person made | **VIOLATED** | see P2-1 |
| Eva defined first | HELD | `globals.css:114`, source order and render order both |
| No emoji, hearts, affection-tokens | HELD | none found |
| AuroraBackdrop deleted | HELD | `app/(app)/layout.tsx:11` records the deletion |
| Text at WCAG AA | HELD | every value carries a measured ratio in the comment; spot-checks agree |

---

## 5. Motion

| Spec (§5) | Implementation | Verdict |
|---|---|---|
| Press 150ms `cubic-bezier(0.22,1,0.36,1)` `scale(0.97)` | `globals.css:580-585` | correct |
| Sheet/drawer 500ms `cubic-bezier(0.32,0.72,0,1)` | `--dur-4`/`--ease-io` declared correctly at `globals.css:178,182` | tokens correct, **consumers inverted — see P2-4** |
| Full removal under `prefers-reduced-motion` | CSS: `globals.css:744-752`, correct. JS: **4 of 5 `motion/react` components never check** | **VIOLATED — see P2-3** |
| `transform`/`opacity` only | held throughout | correct |
| One signature anchor, not micro-motion everywhere | correct instinct, wrong execution | **see P1-2** |

**Does `SealedCard` feel like opening something, or like a card animating?**
A card animating. It is `AnimatePresence mode="wait"`: the sealed state fades and
scales to 0.96 over 200ms, unmounts, then the opened state mounts on the spring.
That is the shadcn/Radix dialog-close default, and `mode="wait"` guarantees the
two states never coexist — so nothing recedes and there is no space for the note
to come forward into. Full finding at P1-2.

---

## 6. Craft at 393px

**Are `#5B6B87` and `#875E50` distinguishable at 2px on a phone?** Side by side,
yes — the clock pair in `viewport-home-day-top.png` reads clearly as one cool
line and one warm line, and 203° of hue separation was the right call over
desaturating the old rose and amber in place. In isolation (`SealedCard`, which
shows one edge and no comparison) a user cannot name which; they can only learn
it. That is acceptable and is what a 2px mark can honestly deliver. Night lifts
both correctly. **This part works. The problem is not the values, it is where
they are being spent** (P2-1).

**Touch targets.** Pass. Dock tabs `h-11 w-11` = 44px (`Dock.tsx:105-107`), send
FAB `h-13` = 52px (`:80`), header lock `h-11` (`HomeHeader.tsx:47`). No target
under 44px found.

**Focus rings.** `globals.css:366` forces `border-radius: 6px` on every
`:focus-visible` outline. The tree has 45 `rounded-full` controls. On all of
them the ring is a 6px-radius rectangle drawn around a fully round pill. Visible
on the login field in `after-login-day.png`, where the outline's corners are
tighter than the field's. P3-3.

**Type wrapping.** `SealedCard`'s `ml-auto` Open pill (`SealedCard.tsx:146`)
squeezes the text column until the timestamp orphans — "sealed by Adam · 8:12 am
his / time" in both viewport captures. A one-word last line under a two-line
heading, in the most important card on the surface.

---

## 7. Findings

### P1 — must fix before anything builds on this

**P1-1 · The references were stripped of colour but never mined for structure.**
Two of roughly twenty structural contributions enumerated in §2 made it into the
build: SORDJATI's masthead (login only) and the events app's detached dock pill.
The date rail, the unequal photo pair, the caption-below-photo, the waveform
player, the marked calendar, the paired big-number stat, the fanned card stack,
the two-weight headline, the overflow tile — none. What shipped is a card stack
with excellent tokens. The founder's instruction had two halves and only the
colour half was executed. Full argument in §2 above; design-lead's own note
already contains most of the fix list. **This is the finding that decides
whether the branch is a foundation or a costume.**

**P1-2 · The signature moment is a cross-fade, not an opening.**
`components/home/SealedCard.tsx:59, 117-167`. `RECEDE = { duration: 0.2 }`, and
`AnimatePresence mode="wait"` sequences unmount-then-mount. Three consequences:
nothing recedes behind anything (§5 asks for the background receding
Vaul-style); there is no shared space, because the sealed card is gone before
the note exists; and the opened state is taller than the sealed one (2 lines vs
a 4-line quote, see `after-sealed-opened-night.png`), so the gesture ends by
shoving `TonightCard` and the tile pair down the page. The file's own comment at
`:33-36` describes a different animation than the one below it — "the seal
recedes … and the note comes forward into the space it left," "the whole gesture
lands around 500ms." Neither is true of this code. §5 calls this the one
memorable moment the product hangs on; right now it is `scale(0.96)` + fade,
which is the most common exit animation in the React ecosystem. Fix it before
Today and The Book copy the pattern.

**P1-3 · Photographs are dimmed, by gradients, in both places photographs
appear.** `app/(app)/home/page.tsx:213-220` lays
`linear-gradient(to top, rgba(25,21,18,0.74) 0%, rgba(25,21,18,0.12) 55%,
transparent)` across `absolute inset-0` — the *entire* book cover, with a
visible veil at mid-height. `viewport-home-day-scrolled.png` shows the lower half
of the cover washed dark. `:168-175` scrims the Today slot at `h-1/4` while its
own comment at `:166` claims "bottom eighth only." §1 has exactly two absolutes
and this breaks both: "Gradients of any kind, anywhere" and "Photographs are
never dimmed, tinted, duotoned or washed. Full strength, always." `--photo-dim`
was killed for this, and `globals.css:530` states the `photo` utility exists "so
nobody reintroduces `--photo-dim` by writing a one-off" — the first consumer
reintroduced it as a one-off gradient instead. SORDJATI's own answer is in the
reference: one photo carries overlaid type because it was chosen to, the other
takes its caption *below*. Do that, or put the caption on a solid ink plate.

**P1-4 · Nothing on any authenticated surface takes the large end of the type
scale.** `type-masthead` (59px at 393px) has exactly one consumer:
`app/login/page.tsx:33`. Every in-app surface tops out at `type-hero` (33px) —
and `type-clock` at 38px (`globals.css:489`) is larger, so the biggest type in
the product is a clock read-out. Home runs 38/33/22/17/15/13/11: a seven-step
ramp with no gap. §4 diagnosed v6 as precisely that ("38/36/22/17/15/13/11 — a
smooth ramp with no gap anywhere in it") and prescribed SORDJATI's contrast. The
tokens implement the prescription; six surfaces ignore it. This is not a Today
composition problem — it is true on Book, Dates, Send, Echo and Pocket, which
makes it foundation-level. Note also that §7 cut The Gap because "a clock is
correct on day one and on day four hundred, and correctness gives nobody a
reason to return" — and Home makes the clock the largest object on the page.

### P2 — fix in this branch

**P2-1 · The authorship ink is being spent as a person-label, not an authorship
mark.** §1 is exact: the hue appears "only as a ≤2px edge on the left of
something that person made."
- `DualClocks.tsx:52,57,77` — edge on a **clock card**. Nobody made a clock.
- `home/page.tsx:134,140` — edge on an **empty slot**, where by definition
  nothing has been made.
- `LoginForm.tsx:115` — `dot-eva` as an avatar chip.
- `DualClocks.tsx:81-87` — the edge **and** the dot on the same card, when
  `globals.css:544-546` reserves the dot for "dense lists where a 2px edge has
  nowhere to sit."
- `DualClocks.tsx:84` — the dot is animated with `breathe` (scale 1→1.35).
  `globals.css:545` says 6px is "small enough to read as a mark rather than a
  status light," and then it is made to pulse. That is a status light.

Net: `viewport-home-day-top.png` carries five chromatic marks and not one of them
marks authorship. This is the mechanism by which "two hairlines of colour"
becomes colour-coded UI — the exact failure the founder rejected twice. Let the
clocks be ink; reserve both marks for authored objects; pick one form per
context.

**P2-2 · At night, the brightest object on every screen is a navigation
button.** `pill-ink` inverts at night to `--ink: #ede7e0` on `--canvas: #1e1a17`
(`globals.css:226, 600-604`). Consumers: the dock send FAB and active tab pill
(`Dock.tsx:80, 113`), the Echo header avatar (`EchoChat.tsx:131`), the Echo send
button (`:259`), and the viewer's own chat bubbles at `max-w-[80%]` (`:199`).
`globals.css:628-632` already established the principle for `tile-ink` — "a
140px block that inverts becomes a lamp in a dark bedroom" — and then exempted
"small ink controls." The dock's FAB plus active pill form a continuous ~150px
bright band, the same size as the block that was exempted, on every
authenticated surface, in the window §2 calls the highest-traffic in the
product. Give `pill-ink` the `tile-ink` night treatment, or cap the inverted
fill at ~44px so the FAB and the chat bubbles fall out of it.

**P2-3 · `prefers-reduced-motion` is documented as complete and is not.**
`globals.css:744-752` does the full Sonner-style removal for CSS, and `:742-743`
asserts "components using `motion/react` handle this themselves via
`useReducedMotion`." Only `SealedCard.tsx` does. `Dock.tsx` (layoutId spring at
`:34,110-114` and a label slide at `:119-126`), `EchoChat.tsx`, `QuickSend.tsx`
and `DatesExplorer.tsx` all import `motion/react` and never call it. The dock's
active pill therefore springs across the bar on every navigation for a user who
asked for no motion. A comment asserting a guarantee the system does not have is
worse than no comment — the next reader will trust it.

**P2-4 · The one measured drawer duration is used in the one place it doesn't
belong.** `--dur-4` (500ms, measured from Vaul for sheets and drawers) has a
single consumer: `stagger-child` page entrances at `globals.css:731` — a 500ms
rise on six Home sections at page load. Meanwhile the actual drawer-class moment,
the seal, runs at 200ms (`SealedCard.tsx:59`). §5 puts content transitions at
220–320ms and drawers at 500ms. The two are exactly swapped.

**P2-5 · There is no way to be in night mode.** `data-mode` is set by nothing in
`apps/web`; the only occurrences are seven selectors in `globals.css`. Night
comes solely from `prefers-color-scheme: dark`, so Eva on a Light-mode iPhone
gets warm white at full brightness at 11pm — the scenario §8's 11pm test exists
to prevent. Secondary: because night is declared twice (`globals.css:221-255`
and `257-277`) the two blocks must be hand-synced forever. They agree today.

**P2-6 · The radius scale is not the source of truth it was just rewritten to
be.** `--radius-md/lg/xl/2xl` have six consumers in the whole tree (five
`rounded-lg`, one `rounded-xl`). Every card, tile, field and sheet writes an
arbitrary value instead — about thirty of them, e.g. `SealedCard.tsx:73,125,155`,
`DualClocks.tsx:57,77`, `home/page.tsx:103,140,156,198`, `book/page.tsx:102`,
`QuickSend.tsx:108,110,133,153,170,184`. Two of the hardcoded values are not in
the scale at all: `1.125rem` (18px — `DualClocks.tsx:57,77`, `HostedDates.tsx:64`,
`DatesExplorer.tsx:103,119,134`) and `1rem` (16px — `Spread.tsx:126,173`,
`EchoChat.tsx:197,217`). The system defines four radii and the app renders six,
and editing a token changes nearly nothing. Commit `9a5954a` brought the
arbitrary values down; it did not make them stop being arbitrary. Thirty call
sites is the cheapest this will ever be to fix.

### P3 — later

**P3-1 · Home prints the same sentence twice.** `HomeHeader.tsx:40-42` renders
`WINDOW_STRINGS[currentWindow(now)]` as the 33px hero; `TonightCard.tsx:57,70`
renders the same lookup as an 11px eyebrow. In `viewport-home-day-top.png`:
"Worth staying up for" at the top, "WORTH STAYING UP FOR" ~900px below. Two of
the four sentences a user reads on Home are the same sentence.

**P3-2 · Glass survived.** `QuickSend.tsx:124` — `bg-black/45 backdrop-blur-md`
on the remove-photo button. §3 permits glass only if a reviewer is convinced by
a specific case. I am the reviewer and I am not: it sits directly on a
photograph, which is where §1 is strictest, and a solid ink circle reads more
reliably over an arbitrary image than a blurred one does.

**P3-3 · Focus rings never match their control's corners.** `globals.css:366`
forces `border-radius: 6px` on all `:focus-visible` outlines, including 45
`rounded-full` controls. Use `border-radius: inherit`, or drop the line.

**P3-4 · Dead shadcn is still in the tree.** `components/ui/button.tsx` is
imported by nothing and references `ring`, `border-ring`, `destructive` and
`dark:` variants — none of which exist here (night is `[data-mode]` /
`prefers-color-scheme`, not `.dark`). It is a standing invitation to reintroduce
a second design system. Also: six PNGs are committed at repo root
(`home-day-mobile.png`, `today-day.png`, `send-day.png`, `pocket-night.png`,
`partner-day.png`, `home-night.png`) duplicating files already in
`docs/08-agents_work/research/screens/foundation/`.

---

## 8. What to protect

1. **The entire night palette.** `globals.css:188-255`. Same paper unlit rather
   than an inverted day; wells darker than surfaces because a recess at night is
   in shadow; hue held at 26°; the ink pair holding hue exactly across modes at
   luminance parity. This is the best-designed thing on the branch. Every
   finding above leaves it intact.
2. **`--eva` and `--adam` deliberately withheld from Tailwind.**
   `globals.css:279-299`. Making the rule structural — you cannot paint a button
   with someone's colour without writing new CSS — is the only kind of rule that
   survives a deadline. Keep it while fixing P2-1.
3. **The login door.** `after-login-day.png`. "TWO CITIES, ONE BOOK" over a 59px
   edge-to-edge grotesque is the only screen in the product that looks like
   SORDJATI and the only one that passes the logo test. It is proof the
   direction works. Port it inward rather than treating it as the exception.
4. **The two second-order control decisions.** Disabled `pill-ink` empties out
   rather than fading (`globals.css:605-615`) — correct, and the reasoning is
   right. `tile-ink` de-inverts at night so a 140px block doesn't become a lamp
   (`globals.css:628-637, 770-783`) — correct, and P2-2 is only asking for the
   same rule to reach one component further.
5. **Opaque dock over glass, plus the three-layer `--e-float`.**
   `Dock.tsx:14-18`, `globals.css:137-152`. The reasoning about 11pm legibility
   over an unknown background is right, and the float shadow is doing real work.
6. **The two clocks as an idea.** "1:31 pm New York · 8:31 pm Tel Aviv, one of
   them asleep" is the single most identifying thing in this product and no
   competitor has it. It is currently wearing the most generic costume in the
   kit. Re-render it; do not cut it.
7. **The ink-and-paper decisions generally.** `#191512` over `#000`, `--mute`
   warm rather than blue-grey, 2.2% grain as the only texture, the measured
   contrast ratio in every comment. The token layer is genuinely good work. The
   gap is between the tokens and the compositions built on them.

---

## Confidence

**High** on everything cited to file and line — the law violations, the motion
findings, the missing `data-mode`, the reduced-motion gap, the radius drift, the
duplicated string.

**Medium** on the Tuesday and costume verdicts. I did not run the app, so the
photograph-free surface is traced from the code paths in §1 rather than
rendered. The strongest single piece of evidence there — the coverless book tile
compositing a dark gradient over a `well` — is read from `home/page.tsx:210-220`
and has no capture. A render of Home with the fixtures emptied would confirm or
soften it in about five minutes and is worth doing before anyone acts on P1-1.

---

## 9. Re-verification at `303ba2b`

Commits `66cad39` (P1-3, P1-4, P1-2, P2-1) and `303ba2b` (P2-2). Scope of this
pass is the four P1s only.

**How I judged.** Source at `303ba2b`, plus the `viewport-*` captures which were
regenerated in `303ba2b` and therefore show the new build. Live checks were run
against the dev server for anything reachable without a session. Every app route
is behind the door; minting a session token was correctly blocked by the
permission layer, so the seal could not be driven live. Where that matters I say
so rather than implying a render I did not perform. The `tuesday-*` captures are
the DOM-stripped kind design-lead flagged — the right-hand Today slot in them
shows an orphaned `edge-adam` curve with no photograph, which is the stripping
artifact, not the component's empty branch — so I did not read composition off
them.

### P1-3 · photographs dimmed — FIXED

No gradient survives over any image anywhere in the tree. The only
`linear-gradient` calls left are the three loading-skeleton sweeps, which
describe loading rather than a photograph. Captions moved below the image in
both places (`home/page.tsx:178-181` for the Today slot, `:234-238` for the
book). The coverless book no longer composites a slab: `:229-232` renders
`border-y border-line px-5 py-10` — a rule and a line of type. Confirmed not
relocated: the book cover in `viewport-home-day-scrolled.png` is full-bleed,
untouched and at full strength, which is the first time a photograph in this
product has been shown the way §1 always required.

### P1-4 · nothing takes the large end — FIXED

`type-masthead` has a second consumer, `DualClocks.tsx:88`, live-measured at
**58.95px**. The clocks are a rail now — two full-width rows on hairline rules,
the hour sitting directly on paper with no card (`DualClocks.tsx:54-103`).

The ramp has a gap in it: **59 / 33 / 22 / 17 / 15 / 13 / 11**, where the top
step was 38 → 33. The large end is now held by the one object that is always
present, which is also the structural answer to the Tuesday test — the surface
no longer needs a photograph to have something large on it.

Both rows are identical in weight: they render from one `ClockRow` with no
per-member branching, and the authorship inks are gone from the clocks entirely
(the presence dot is `bg-mute`, `:94-97`). Nothing renders one partner larger
than the other.

*One thing to check, not a finding.* The meta line uses `justify-between`
against the hour. In `viewport-home-day-top.png` "NEW YORK · AWAKE NOW" ends
about 2px inside the content edge at 393px. "PROBABLY ASLEEP" is six characters
longer, so the app's single most common state — Eva asleep, which is the premise
of w1 — sits on the wrap boundary. `flex-wrap` catches it and the wrapped result
is acceptable, but it is worth looking at once at 390px and 375px.

### P1-2 · cross-fade, not an opening — FIXED in mechanism; one thing to watch

`mode="popLayout"` with `layout` on the parent section (`SealedCard.tsx:133-134`),
and `RECEDE` lengthened from 0.2s to **0.32s** (`:76`) so the exit genuinely
overlaps the entrance instead of finishing before it starts. The two states now
move in opposite directions — the seal leaves upward (`y: -6, scale: 0.94`,
`:143`) while the note arrives from below (`y: 14`, `:127`). Something recedes,
something comes forward, and `popLayout` takes the exiting seal out of flow so
they share the space rather than queue.

I checked the one thing `popLayout` usually gets wrong: it absolutely positions
the exiting child, which misanchors when no ancestor is positioned. `main` is
`relative` (`app/(app)/layout.tsx:38`), so it anchors correctly.

**Not judged live.** I could not reach the seal without a session. What remains
unverified is whether the overlap *reads* as opening rather than as two things
moving, and one specific risk: `layout` animates size by transform, and neither
child carries `layout` of its own, so the quote may visibly stretch vertically
while the section grows to fit it. If it does, the fix is `layout` on the two
children. Thirty seconds of someone's eyes settles both.

### P1-1 · references stripped of colour, never mined for structure — PARTIAL, and that is the right amount

All three bounded moves landed. Full-bleed: the book cover breaks the column to
the sheet edge (`home/page.tsx:214`). Unequal pair: the book is now a full-bleed
16/10 plate stacked above a short Echo bar, replacing the 50/50 tile row.
`type-masthead` in-app: the clock rail.

**The structural vocabulary is demonstrated.** Home now carries four material
registers where it carried one: ink on bare paper (the clocks, the book's line),
plate (three cards), a full-bleed photograph, and one ink bar. "Five full-width
elements at one width, one radius, one elevation, one rhythm" is no longer a
true description of this surface, and three moves is enough to prove the pattern
for whoever composes Today.

What is left is that Today, the sealed card and Tonight are still three
consecutive identical plates through the middle of the page. That is composition
work on a surface that has not been designed yet, not a defect in the
foundation. **It is not P1 any more.**

### New — P2, introduced by the P3-3 fix, verified live

`globals.css:388` now sets `border-radius: inherit` on `:focus-visible`.
`border-radius` is not an inherited property, so `inherit` resolves to the
**parent's** radius and applies it to the focused element — it overrides the
element's own corners rather than the ring's.

Measured live on `/login`: the password field computes `10px` unfocused and
**`0px` focused**; its parent is `0px`. The field's corners square off the
moment it is focused. On a `rounded-full` control inside a square parent the
same rule flattens a pill into a rectangle on keyboard focus, which is worse
than the 6px mismatch it replaced.

The fix is to **delete the line**. An outline already follows the element's own
`border-radius` per spec — that is why no value should be set at all. Setting
one was the original bug and setting a different one keeps it.

### Merge

Nothing I raised as P1 is still P1. Merge once the focus-ring line is deleted
and someone has watched the seal open once.
