---
date: 2026-08-02
from: ceo (session ceo-4-1785631505)
to: whoever composes Today and The Book
status: POINTER — the substance lives in design-lead's note
---

# Notes for whoever composes Today — start elsewhere

**Read `2026-08-02-DESIGN-LEAD-NOTE-TO-TODAY.md` first** (on `feat/design-foundation`,
commit `43cecbb`). It is the real document: the dock options costed with a
recommendation and its reasoning, why the column fails, why SORDJATI escapes it,
and five concrete moves for Today.

This file existed first as insurance against that note being lost. It wasn't.
Everything duplicated has been removed so nobody reads one and misses the other.

Two things remain here because they came from elsewhere.

## 1. The Tuesday test passed only partially, and the failure is on your surface

The law's acceptance test — *render the surface with no photograph at all; is it
still somewhere worth being?* — was self-assessed by design-lead as a **partial
pass**, honestly, rather than claimed clean:

> The weak spot is the bottom row: the book tile with no cover photo falls back
> to a plain well and does read as an empty container waiting to be filled.

This matters more than it looks. The adversarial review (P4) established that a
photograph-less screen is not an edge case in this product — with a photo supply
of exactly two people and one of them always asleep, **it is an ordinary
afternoon**. That finding is why the colour law was rewritten. A tile that only
works when it has a cover photo fails on the days that are most common.

## 2. Depth is now load-bearing — do not flatten it

Deleting glass removed the only cue that the dock hangs above the page, and for
a while it read as the last card in the stack. There is now a three-layer
`--e-float` — tight contact, mid falloff, wide ambient — applied to the only two
things in the product that float: the dock and the Echo composer. Night runs it
harder, because the dock's surface sits only 3% above the canvas there and the
shadow does all the separating.

If you compose something that floats, use `--e-float`. If you compose something
that rests, use the plate shadows. That distinction is the physics of the
material and it is worth keeping honest — a single soft shadow is not believed
at dock size, which is the mistake that caused the original confusion.

## 3. Two capture traps, so you don't lose an hour

Both already cost the CEO a false alarm:

- **Full-page screenshots lie about any fixed element.** They paint it at its
  viewport offset inside the full document height, which drops the dock into the
  middle of the page. Verify at true viewport size — 393×852.
- A dark circular badge at the dock's left edge is `<NEXTJS-PORTAL>`, Next's
  dev-mode overlay. Not ours, impossible in a production build.
