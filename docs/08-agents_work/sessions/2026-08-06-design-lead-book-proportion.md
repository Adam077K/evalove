---
date: 2026-08-06
role: design-lead
task: book-proportion-and-today-bleed
status: COMPLETE — spec only, no source file changed
qa_verdict: N/A (no code produced; the gates this spec must be measured against are in §5)
viewport: 393 × 852, deviceScaleFactor 3, isMobile, both modes
hydration: verified — React fibre attached on every capture (`__react*` keys present on the book button)
measured_against: main @ afdd19f, live at localhost:3000
---

# Book proportion & Today's bleed — measured spec

## §0 · What I confirmed, corrected, and found

**Confirmed exactly.** The Book's cover board measures **378 × 494 CSS px** (bounding box 391.7 × 504.5 after the −1.6° rotation), running **x = −42.8 → 348.8**. The `-ml-9` puts the spine 36 px off-screen. Today's hero photograph runs **x = 40.2 → 416.8**, overflowing the 393 viewport by **23.8 px**; `scrollWidth === clientWidth === 393`, and the clipper is `overflow-x-clip` on the page root (`app/(app)/today/page.tsx:60`). `.photo` carries `filter: none` in both modes — the law holds, keep it.

**Corrected.** There is no washi tape at Today's top-right. The only tape on the surface is `washi-terracotta.webp` at **x = −5.3 → 73.2, y = 579** — on the sealed note, sliced by the **left** edge. The cream band framing the photograph top and right is `torn-edge-coldpress-mount.webp` (x = 10 → 431), the torn mount, and its deckle notches survive the cut intact. The slice is real; the edge and the material were both misidentified.

**Also not a defect.** The open Book reports 100 overflowing elements — that is the `overflow-x-auto` page carousel holding leaves to the right, which is what a page rail is. The deco plates at x = −16 and right = 417 are the two skylines; a scene running off both edges is what §1 asks an illustrated window to do. Neither is to be "fixed."

**Found, undiagnosed until now — the root cause.** The board's height is fixed (`h-[min(540px,58dvh)]`) and its width is a flex remainder (`flex-1`), so the fore-edge's growth is subtracted from the *cover*. Measured: board = 406 − foreEdge. Today (6 leaves, edge 28) → 378 × 494, ratio 0.765. At the current 132 px ceiling → **274 × 494, ratio 0.554**. **The Book changes shape as the archive thickens.** A book's cover does not get narrower as you add pages. This is what "not in the correct sizes" is pointing at, and no margin tuning reaches it.

## §1 · The Book — exact geometry

| | Now | Spec |
|---|---|---|
| Board | 378 × 494, ratio 0.765 (drifts to 0.554) | **280 × 364.4, ratio 189/246 = 0.7683, invariant** |
| Left margin | −36 (spine off-screen) | **34 px, no bleed** |
| Fore-edge | 12 → 132 px | **12 → 60 px** |
| Right margin | 17 px | **53 px today → 19 px at the ceiling** |
| Object width | 406 px constant on a 393 screen | **306 → 340 px (78% → 87%)** |

**Ratio justification.** 189 × 246 mm is **Crown Quarto**, a standard bound-book trim used for illustrated and photographic books. The object has boards, a spine, a fore-edge and a ribbon marker — it is a bound book, not a ring album, so a bound-book trim is the right stock. Height is always derived from width; the proportion must never again be a side effect of something else's size.

**Why the bleed goes.** §4 move #1 permits one element off one edge and states its own purpose: three edges stay visible "showing the mount, the rotation, and the paper beneath." On this object the purpose fails on its own terms — the bleeding edge is the **spine**, the one feature that distinguishes a bound book from a rectangle of olive cloth, and the rotation is −1.6°, far too small to carry "placed object" alone. The move spends the object's identity and buys nothing. Move #1 is a permission with a constraint, not a per-surface quota. **/book has no bleeding element, deliberately.**

Second reason, structural: the page's `LAMPLIGHT` pool centres at `6% 102%` ≈ x 23.6 px. With the board at x = −43…349 that centre lands *under* the board, which is `.under-lamp` and dims uniformly — which is why day and night looked identical and why a fake directional shade (`LampShade`) had to be painted on the cloth to compensate. A 34 px left margin puts the pool on **visible table** beside the spine, where a lamp actually throws light.

**Fore-edge recurve.** `round(min(12 + 7·ln(1 + leaves), 60))` → day one 12, today 26, one year 53, ~2.6 years 60. Linear at 2.6 px/leaf reaches any workable ceiling inside a month; log keeps week-over-week growth visible early (6→13 leaves = +5 px) and never stops. 60 px against a 280 px board ≈ 40 mm on a 189 mm book — a genuinely fat album. 132 px would be 89 mm, which is not an album and cannot coexist with a fixed-width board on a 393 screen.

## §2 · Today — the bleed is right, the margin is not

**Ruling: BUG, but not the reported one. Keep the right-edge bleed.**

It is textbook §4 move #1: one element, one edge, three edges visible, mount + rotation + paper all legible, and the tear is deliberately kept on the non-bleeding side. Defended as built.

What makes it read as clipped is that the **opposite margin has collapsed to 10 px**. The torn mount is 421 px wide on a 393 px screen — at a glance 10 px is indistinguishable from touching, so the eye reads an object wider than the screen on *both* sides, which is a background, not a placed object. Move #1's own words: "a photograph on a table can extend past the table's edge without covering the entire table." 421 on 393 covers the entire table.

Fix: `ml-6 -mr-10` → **`ml-12 -mr-12`**. Mount left edge lands at ≈ 34 (the Book's margin — one table edge across the product, and where the lamp pool sits), photo right at ≈ 425, bleeding ≈ 32 px. Asymmetry becomes legible: real table on the left, object running off the right.

Separately, the sliced tape: washi is a **fastener**, and a fastener with no visible end is not holding anything. §3 requires washi to have "slightly rough edges (not a clean cut)"; the viewport gives it a perfectly straight one. The sealed note's wrapper needs `ml-3` → `ml-8`, putting the tape's own rough end back on the table.

## §3 · The blind stamp — why shadow tuning cannot fix it

Measured from a 3× capture of the plain board: cloth mean RGB **(136.4, 132.0, 90.3)**, L **129.9**, sd **28.5**, p1 **74.2**, p5 **85.0**; weave pitch **4.67 CSS px**.

Composite the current fills over that cloth:

| | alpha | floor L | vs cloth |
|---|---|---|---|
| EVA & ADAM | 0.30 | **98.9** | between p10 (92) and p50 (129) |
| Colophon | 0.44 | **84.5** | ≈ p5 (85.0) |

**Both impression floors sit inside the cloth's own tonal range** — lighter than the weave's ordinary shadows. Sampling the glyph band against bare cloth at the same columns, the mean luminance shift is **3.25/255 for "EVA" and 0.33/255 for the colophon**, against a weave noise sd of 28.5. The colophon is not low-contrast; it is two orders of magnitude below the substrate's noise.

The rebuild that produced this added *walls* — equal-and-opposite 1 px light/dark shadows — which are **luminance-neutral by construction**: summed over a glyph they cancel, which is exactly what the 0.33 measurement shows. Pure high-frequency edge signal, laid on a substrate whose own high-frequency energy is an order of magnitude stronger.

The missing physical fact: **a die crushes the weave flat inside the impression.** You read a blind stamp because the texture *inside* the letter differs from the texture outside it, not because of its rim. A 70%-transparent fill lets the weave through the letterform at nearly full strength.

One lever does both jobs — an opaque-ish fill occludes the weave (kills noise inside the glyph) *and* depresses the mean (adds signal):

- `EMBOSS` → **`rgb(30 27 13 / 0.62)`**: floor L 66.9, 7.3 below the cloth's p1; residual weave sd 10.8 = 38% of the cloth's.
- `EMBOSS_SMALL` → **`rgb(30 27 13 / 0.68)`**: floor L 59.7, residual sd 9.1. Deeper, because a small die is struck deeper — which the existing code comment already intended, at the wrong magnitude.

**The line that keeps it a blind stamp: residual weave sd must stay ≥ 5.** The floor keeps the cloth's texture at reduced contrast — crushed fibre. Past alpha ≈ 0.75 the weave inside the letter dies completely and it becomes flat print.

**Alpha alone will not save the colophon.** At 13 px Fraunces italic the stems are ≈ 1.2 CSS px, so at nominal weight the stroke never reaches full fill opacity across its width — its *effective* floor stays lighter than specified whatever the alpha says. Stems must reach ≥ 2 CSS px: **16 px at weight 600** gives ≈ 2.1. Tracking 0.05em → **0.08em** (1.28 px) stops adjacent strokes merging into the weave's shadows between them. The face stays Fraunces italic — §2 assigns the colophon to the app's own voice, and that is not mine to reassign.

**Light direction, second priority.** The walls are lit from above (highlight `0 1px 0` below the stroke, shade `0 -1px 0` above). This surface's light is lower-left: `LAMPLIGHT` at `6% 102%`, `LampShade` `to bottom left` + `at 8% 100%`. For a *depression* lit from below-left the far wall — upper and right — catches light and the near wall shades. The lips should invert and gain a horizontal component. Ranked second because the fill is load-bearing; if only one change ships, ship the fill.

## §4 · What breaks if this is done carelessly

The bleed is encoded in **five** places that must move together, or the Book will stop opening: `BookCover` `-ml-9` and `CoverBoard`'s compensating `pl-9`; `BookObject`'s open-pose `-ml-9` and `pl-9`; the flap's `left: -36` and `width: calc(100% + ${36 - edge - 6}px)`. The height is in **two**: `h-[min(540px,58dvh)]` and the flap's `height: "min(540px, 58dvh)"`.

The ribbon's `bottom: -150` and `w-[83px]` are tuned to a 494 px board — preserved unchanged they put the ribbon's exit at 24% down a 364 px board instead of 52%. They scale: **`w-[62px]`, `bottom: -111`**.

`/review/book-states` renders `leafCount={200}`. Under the old curve 200 hit the 132 ceiling; under the new one it yields 49, so the harness would silently stop testing the widest state. It must become **1095**.

## §5 · Acceptance gates — measurable, §9.8 style

At 393 × 852, 3×, viewport captures only, both modes:

1. Closed cover bounding box: left ≈ **29 ± 3**, right ≈ **345 ± 4** (the −1.6° rotation expands the box ≈ 5 px each side — that expansion is not overflow). Board offsetWidth **280**, offsetHeight **364 ± 1**, ratio **0.768 ± 0.005**.
2. Ratio invariance: render `leafCount` 0, 6, 1095 — board offsetWidth/offsetHeight must be **0.768 ± 0.005 in all three**. This is the gate the current build fails.
3. Fore-edge fully on screen at `leafCount={1095}`: right edge ≤ **385**.
4. Today: torn-mount left edge ≈ **34 ± 4**; photo right ≥ **415** (the bleed stays); `img.photo` computed `filter: none` in both modes.
5. `washi-terracotta.webp` on the sealed note: left edge ≥ **8**.
6. Stamp, both glyph sets: bare-cloth patch median L **129 ± 6** (the board must not darken), stroke-interior median L **≤ 74**, stroke-interior sd **≤ 14 and ≥ 5**. At night multiply by the `.under-lamp` `brightness(0.73)`: cloth ≈ 95, floor ≤ 54.
7. The Book still opens, swings, turns pages and closes; Escape still closes; focus still moves into the pages and back.

---

*Measured, not asserted. Every number above comes from `getBoundingClientRect` and computed style on a hydrated page at 393 × 852, or from pixel statistics on 3× viewport captures. Nothing was captured `fullPage`.*
