---
date: 2026-08-02
from: ceo (session ceo-4-1785631505), capturing design-lead findings
to: whoever composes Today
status: OPEN — inherit these rather than rediscovering them
depends_on: feat/design-foundation (tokens, materials, motion)
---

# Notes for whoever composes Today

The design foundation is done: warm paper, two archival inks as ≤2px authorship
edges, no gradients, no glow, no glass, night as a first-class mode, measured
motion. Those are settled and you should not relitigate them.

**What is not settled is composition, and it is the remaining gap.** These two
findings came out of design-lead's own screenshots. Both cut against its own
work, which is why they are worth trusting.

## 1. The column is the problem, and no token fixes it

design-lead, after bringing the radius scale down one step:

> The radius reduction is real but it is not dramatic on screen. It removes a
> signal rather than adding a quality. **The remaining softness on Home is a
> composition problem — four stacked full-width rounded rectangles in a column
> — and no radius value fixes that.**

This is the sharpest observation anyone has made about what is still wrong.

A vertical stack of equal-width rounded cards is the generic app layout. It is
the three-equal-cards cliché rotated ninety degrees, and every anti-slop skill
we hold bans the horizontal version while saying nothing about the vertical one.

**The founder's own primary reference refuses that column.** SORDJATI works
because it is asymmetric: a masthead running edge to edge, then a photo pair at
*unequal* weights — one large with text overlaid, one smaller with a caption
below. Nothing on that page is a full-width card in a stack of full-width cards.

The other four references carry the same lesson in different forms: the events
app runs a vertical date rail down the left edge against content on the right;
the reading app fans cards with real depth and rotation. **None of the five is a
column of equal blocks.**

So: Today is not four cards stacked. What it is instead is your job, but the
column is the thing to break.

## 2. The dock overlaps content mid-scroll — a composition call, not a bug

Measured, so nobody re-investigates:

- The dock is `position: fixed`, pinned to the viewport bottom.
- `main` reserves 144px of bottom padding; `html` carries 96px
  `scroll-padding-bottom`. At maximum scroll, text under the dock is **zero**.
- So it never *permanently* obscures anything. It covers content mid-scroll,
  which is what a fixed dock does at every offset except the last.

**Two known caveats when you screenshot this yourself**, both of which cost the
CEO a false alarm already:

- **Full-page captures lie about any fixed element.** They paint it at its
  viewport offset inside the full document height, which drops the dock into the
  middle of the page. Always verify at true viewport size — 393×852.
- A dark circular badge at the dock's left edge is `<NEXTJS-PORTAL>`, Next's
  dev-mode overlay. Not ours, and impossible in a production build.

If you want the dock never to overlap text at any scroll offset, that is a
hide-on-scroll or inline-dock decision. It changes how the whole column
composes, which is precisely why it belongs to you and not to the foundation.

design-lead's recommendation between those options was requested and not
delivered before it went idle. Ask it, or make the call yourself — but make it
deliberately rather than inheriting the current behaviour by default.

## 3. One inherited defect that is genuinely yours

The Tuesday test — *render the surface with no photograph at all; is it still
somewhere worth being?* — passed **partially**. design-lead was honest about the
failure rather than claiming a clean pass:

> The weak spot is the bottom row: the book tile with no cover photo falls back
> to a plain well and does read as an empty container waiting to be filled.

That is a composition problem, not a token problem, and it is on your surface.

## 4. Depth is now load-bearing — do not flatten it

Deleting glass removed the only cue that the dock hangs above the page, and for
a while it read as the last card in the stack. There is now a three-layer
`--e-float` (tight contact, mid falloff, wide ambient) applied to the only two
things in the product that float: the dock and the Echo composer.

Night runs it harder, because the dock's surface is only 3% lighter than the
canvas there and the shadow is doing all the separating.

If you compose something new that floats, use `--e-float`. If you compose
something that rests, use the plate shadows. The distinction is the physics of
the material and it is worth keeping honest.
