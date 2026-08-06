---
date: 2026-08-06
role: design-lead
task: the making metaphor — composing a Book page by hand, on a phone
type: SPEC (no code)
measured_on: integration/wave4 @ a6fbde6, localhost:3000, 393×852, day + night, hydration verified
companion: docs/04-features/specs/hand-composed-book-pages.md (CPO, product half)
---

# The making metaphor

## §0 · The central question, answered — and what had to be given up

**Thumb-composition can feel like making, but only by inverting what moves.** Three
things in the phrase *"drag-place-rotate-scale"* had to go:

1. **Scale.** A print is the size it is.
2. **Precision.** No snapping, no alignment, no 0°. **The moment you add a snap you have
   built a form, because the user starts aiming.**
3. **The hand travelling to the target.** This one decides it.

> Attention spent on reaching is attention not spent on the composition. **That is the
> actual mechanism by which an interaction becomes a form — not the widgets, the
> attention.**

What is left: *a thing comes up in your hand when you press it, the book slides under it,
the objects already on the page move aside because something heavy came near, and letting
go drops it crooked.* **Four physical facts and no controls.**

## §1 · The measurement that forced it

At 393×852 on the trunk: open page 303×518 at y48–566 · board 335 wide at x34 · free
table y633–783 · tray 290px at x52–342. Thumb pivot, right grip ≈ (355, 790).
393 CSS px = 71.5 mm → 5.5 px/mm.

| From pivot | Distance |
|---|---|
| pile band | 33 mm — easy |
| page bottom-right | 44 mm — comfortable |
| page bottom-left | 71 mm — stretch |
| page mid | 94 mm — full stretch |
| **page top-right** | **131 mm** |
| **page top-left** | **142 mm** |

Adult thumb maximum ≈ **100 mm**. The top half of the page **cannot be touched
one-handed at all** — not uncomfortable, impossible — and you cannot re-grip mid-drag
without dropping.

**Therefore the book comes to the hand.** Vertical page-scroll is *not* the alternative:
the whole page already fits on screen, so scrolling would push its head off.

## §2 · The mechanic — five acts

**TAKE** — press ≥250 ms, <10 px slop, on any object *or on bare paper*. A 2 px rise
begins at 120 ms so the object acknowledges the finger before committing; release under
250 ms puts it back with no consequence. On commit it lifts (scale 1→1.05, translateY −6,
`SHADOW[3]`→`SHADOW[4]`) and rotates to **the hand's angle, a fixed −3.5°**. It never
squares up — *squaring up is a form, and a hand holds paper crooked.* Then tracks the
finger 1:1. Set `-webkit-touch-callout:none` and `user-select:none` or iOS Safari's
save-image callout eats the gesture. While held, the rail's `overflow-x` and scroll-snap
are **locked**.

**THE BOOK SLIDES** — on first lift the book translates **+332 px** (500 ms `--dur-4`
`--ease-io`), putting a 292 px working band at y380–672, entirely inside the thumb's arc.
The pile sweeps in beneath at y672–783. Thereafter the book slides freely 0→+332 under a
one-finger drag **on the cloth only, never the paper**. **The invariant is the law, not
the number:** the region under the held object stays within **495 CSS px (90 mm)** of the
pivot.

**LAY** — the page lifts 2 px and deepens its shadow. **The page's own shadow is the only
drop affordance** — no outline, grid, dashed zone or highlight, ever. Objects already on
the page **shift 3–5 px away** along the vector plus ≤1.5° rotation (220 ms `--dur-2`),
settling back if you move off. *Paper moves because something heavy came near it.* That
is the entire drop-target language. Release → falls 6 px, **keeps the angle your hand gave
it** plus `Mounted`'s seeded ±2° drift, spring 300/30, at rest ≤400 ms, no bounce.
**Reuse `Mounted`'s `settled={false}` path verbatim — it already IS this animation.**

**TURN** — two-finger twist 1:1, clamped to the law's −8°…+8°, rubber-banding past the
clamp at half rate. **Single-pointer alternative (WCAG 2.5.1):** lift and drop a laid
object within 12 px and it **re-rolls its drift** ±2° inside the clamp. That is the only
place anything re-rolls in this product, *and it re-rolls because a person touched it,
never because a page re-rendered.* **No pinch-to-scale — do not bind it.**

**FASTEN** — tape is not dragged. **Swipe across an edge or corner** of a laid photograph,
starting on it and ending on paper or the reverse. A strip appears perpendicular to the
crossed edge at your swipe's deviation, clamped ±5°. Maps 1:1 onto `<Taped placement
angle>` — **no new component.** Re-swipe removes it.

**WRITE** — tap bare paper → caret appears **on the paper** at that point, `max-w-[15rem]`,
no field, no box, no border, no placeholder.

Two consequences worth keeping: a held object **locks the rail**, which is physically true
— you cannot turn a page while your hand holds something down on it. And a photograph
**cannot move between days**, which is correct: it belongs to the day it was sent.

## §3 · Discovery, with nothing drawn

> **Press and hold anything in the book and it comes up in your hand.**

Zero pixels. The physical fact doing the work: *on a real page a thing that is glued does
not move and a thing that is laid there does — you find out which by touching one.*
Nothing is drawn, so nothing is solicited; **the object was always loose.** Long-press is
the universal "what is this" gesture on this hardware, so it is found **by accident**,
which is the correct discovery mode for something that must never be offered.

It works on **bare paper** too — which closes the Tuesday hole: a page with no photograph
is still composable.

**Nothing changes on a page nobody has touched.** No tools on `/book`, none on opening the
book, none on turning to a page. Only on a completed press.

**And the "arranged by" line is the teacher.** A reader sees it and now knows a page can be
arranged. It states a fact in the app's voice, offers nothing, has no button under it. It
solicits nothing and it teaches.

## §4 · Whose hand writes where — the authorship seam, solved by material

In a real scrapbook nobody writes on the emulsion; you write on the white chin or on the
page. **That instinct is the rule.**

| Surface | Who may write |
|---|---|
| **The image** | **Nobody. Not even its author.** Consistent with `.photo{filter:none}` — nothing is ever applied to a photograph, ink included. |
| **The chin** (mount's caption surface) | **Its author only.** A second hand there *is* re-authoring, which the product spec forbids. |
| **The page** | **Either hand, anywhere** — including hard against the other's photograph and across its corner. |

**So Eva annotates Adam's photograph by writing a note on the paper and taping it to his
print.** The swipe crosses the edge between her note and his print; nothing is written on
his image; the two objects become one object. That is the washi-bridges-two-objects
rationale **expressed as a gesture rather than a policy** — and `<Taped>` already does it.

You always write in your own hand — no picker, ever. If Caveat appears, Eva wrote it.

Riders: re-mounting never rewrites a chin (falls back to `PageCaption` via the existing
`hasChin()`). A sticker may overlap a photograph's mount or edge but **may not sit with its
centre inside the image** — a sunflower over a face is not craft.

## §5 · Size, without a scale gesture

The lead/follower widths are seeded from the **day** — and on a page a person arranged,
**nobody leads**. So size had no source.

**Mounts are objects in the pile too.** An empty polaroid frame, a torn backing sheet,
photo corners. You lay a print onto a mount and it seats; the mount's size is the print's
size. **Size becomes a material choice, not a numeric one** — which is how a table works.

**The receive cue costs zero pixels:** everything on the page shifts aside when the held
object nears it — **a mount does not.** *Stillness is the cue.* A frame on the table does
not get pushed by a photograph you are lowering into it; it receives.

⚠️ **Dependency:** `polaroid-frame-empty.webp` is asset-gated out of `mountFor()` for a
dark left-border smear that survives any honest key. **It needs a clean scan before this
ships — it is the mount a person reaches for most.**

## §6 · Undo — settled by the law, not by taste

The founder's question (unforgiving scrapbook: feature or cruelty?) is already answered:
**nothing is ever consumed.** If peeling tape damaged a photograph, the photograph would
be consumed. So: cruelty, and out.

**Every act is reversible and none of them is called undo.** No undo button, no undo
stack — **a stack is a history, and a history of who changed what and when is a "seen"
status wearing a different hat.** Each act's inverse is its own gesture: drag it below the
page and it lands back in the pile; re-swipe the tape and it lifts off; tap the writing and
delete it. No confirm dialog anywhere, because nothing destructive is available. No
versions, no history, no "edited" marker.

**The structural claim that makes it literally true:** laying a photograph lays a **print**
of it. The archive item is never mutated, moved or removed. **That is why the pile never
runs out** and why "nothing is ever consumed" holds at the data layer, not just in copy.

## §7 · The arrangement record — plain, and the same artefact as the export

**Positions are percentages of the page box, never pixels** — the board is a fixed Crown
Quarto invariant, so percentages survive any device and read plainly on paper. Rotation to
one decimal. Mount by name. Tape by target + variant + placement + angle. **No z-index
column** — stacking comes from `Mounted`'s mass hierarchy (photograph 4, note 3, tape 2,
sticker 1), and between equals **the order of lines is the order they were laid.**

```
page 2026-08-04 · arranged by Eva · 4 August
  photograph eva/2026-08-04-1712.jpg   18%,12%  −6.2°  polaroid (chin)
  photograph adam/2026-08-04-0620.jpg  44%,38%   3.1°  torn mount
    taped across its top-left corner · ochre dots · −3°
  note (Eva) 22%,64% −2.4° "the awning again"
    taped to adam/2026-08-04-0620.jpg · terracotta · 2°
  sticker sunflower 71%,20° 11°
```

Storage and export are **the same artefact**.

## §8 · The largest engineering consequence — composition is DERIVED, not stored

`Spread.tsx` computes the **entire** arrangement at render time from seeds: rotation and
mount from each photo's stable ID, and the page-level choices (which side leads, lead width
66–76%, follower 46–55%, tuck depth, tape variant) from the **day** string. Nothing is
persisted. **The page is a pure function of (day, photo IDs).**

Hand composition cannot live in that model — *a person's choices are not derivable from an
ID.*

**A page must have exactly one driver.** Zero stored placements = auto-composed, seeded,
exactly as today. One or more = theirs, read from the record. **The transition is the first
lay-down**, which *materialises* the currently-seeded composition into stored placements
and hands the page over permanently.

Two consequences: the seeded values become **initial defaults** rather than the display
state, so §4's never-re-rolls guarantee transfers from the seed to the record. And **there
is no way back to auto-composition, which is correct — you cannot un-arrange a page, you
can only arrange it differently.**

**CPO and CTO must settle the placement shape before a builder starts. The dispatch packet
instructs the worker to return BLOCKED rather than invent it.**

## §9 · Acceptance gates

1. **REACH** — at every moment of a full compose, the region under the held object is
   within **495 CSS px (90 mm)** of the pivot (355,790). Scripted trace, both modes.
2. **NO PREPARED PLACE** — a never-touched page in the making-capable build vs. the current
   build differs by **zero DOM nodes and zero pixels**. Automated.
3. **TRAY** — ≤340 CSS px with tools present, left edge x = **34 ± 2**
   (`BOOK_LEFT_MARGIN_PX`). Never a full-width bar. `--dock-footprint` unchanged.
4. **PHOTOGRAPH UNTOUCHED** — computed `filter` on every `img.photo` is exactly `none` in
   all four making states (resting, held, neighbour-shifted, settling), day and night.
5. **SETTLE** — rest within 400 ms, never overshooting final rotation beyond the seeded
   ±2°. From a recorded transform trace, not eyeballed.
6. **ROTATION CLAMP** — no laid photograph outside −8°…+8°; no washi strip beyond ±5° of
   perpendicular.
7. **REDUCED MOTION** — computed `animation-name`/`transition-property` are `none` on every
   making element **and take/lay/fasten/write all still complete.** *The second half is the
   one that gets skipped.*
8. **DRAGGING ALTERNATIVE (WCAG 2.5.7, AA)** — every drag action achievable by keyboard in
   ≤5 keystrokes. **Long-press-drag alone FAILS this — without it QA-Lead must BLOCK.**
9. **TARGET SIZE (2.5.8)** — tray tools ≥44×44; pile photographs ≥88 px on the long edge.
10. **NOTHING CONSUMED** — after taking a photograph off a page, it is present in the pile
    and its archive record's `updatedAt` is unchanged.
11. **ARRANGED-BY LINE** — exactly one per composed page, and **no other visual difference**
    between composed and auto-composed. Pixel-diff two pages differing only in driver.
12. **RECORD IS PLAIN** — round-trips through human-readable text with no loss.
13. **FRAME RATE** — ≥55 fps median over 2 s dragging across a page holding three objects,
    **on a real iPhone, not a desktop throttle.**
14. **11PM** — walked as Eva at 23:10, lights off, night mode, one hand. The brightest thing
    on screen during a compose is a photograph, never a tool, never the tray. **Not
    self-certifiable; process gate.**

## §10 · Refusals, flagged rather than quietly absorbed

- **Scissors refused**, against `Dock.tsx`'s own Stage-2 comment. *Nothing here is ever
  cut, because nothing is ever consumed.* Scissors are the one tool whose entire purpose is
  destruction; building them would put a contradiction of the law in the tray. **That
  comment should be corrected when the tools land.**
- **No pen tool** — the pen is already the raised centre send. *Two pens is a bug in the
  metaphor.* You tap the paper and write.
- **No pinch-to-scale.**
- **"The tray itself does not change" is not literally satisfiable**, and is flagged rather
  than quietly widened: two 44 px tools take it from a measured 290 px to **324 px**, left
  edge x52 → **x34.5** — which lands on `BOOK_LEFT_MARGIN_PX` (34). Compliance claimed in
  spirit: contents slide along a tray, which is what trays do. **"No empty wells" is
  satisfied absolutely.**
- **Any design that asks the user to drag to the top of the page fails on hardware.**
  131–142 mm against a ~100 mm maximum is not a comfort finding. An implementation that
  drops the book-slide as an optimisation would be rejected.

## §11 · The risk the brief did not name

Hand-composed pages will look different from auto-composed ones, and **if they look worse
the feature reads as a downgrade.**

Mitigation: **the physics carries the taste.** Rotation clamped to ±8°; mass hierarchy
enforced by `Mounted`'s elevation so a photograph can never sit under a sticker; drift
seeded on release; no scale. **You cannot make an ugly page here because you cannot put a
photograph at 40°.**

> **The constraints are the craft — and that is why this is buildable at all.**

## §12 · The recommendation: falsify it in a day first

> Build **only** the take → lift → lay loop. No tape, no stickers, no writing, three prints
> in the pile. Hand it to the founder. **If laying a second photograph beside the first and
> watching it land crooked does not read as making within three tries, the model is wrong
> and no amount of washi texture rescues it.**

Roughly a day. **Run it before committing the full wave.** Design-Lead's own words: *that
answer is worth more than my confidence.*
