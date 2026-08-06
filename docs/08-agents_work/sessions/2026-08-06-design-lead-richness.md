---
date: 2026-08-06
role: design-lead
task: richness — unused assets, friendliness, the top band
qa_verdict: N/A (dispatch packet, no code written)
---

- Counted assets from source, not from the brief: **27 of 44 never render in the product**, not 22. `app/dev/materials/page.tsx` `notFound()`s in production, so every asset whose only reference is the bench is unrendered — including **the rose and Eva's sunflower**. **Zero stickers of any kind have ever appeared on a page.**
- **The flower rule: a material earns its place by doing a job or by being placed by a hand — "the page looked empty" is never a job.** Fasteners (tape, pins, ties) may be app-placed; ornaments may not, ever. So no pressed flower ships before hand-composition — but **floral washi does**, because a flower printed on a fastener is a flower nobody had to fake placing. `TapeVariant` already declares `floral-pressed`/`floral-blue`; only the plates are missing. That is Eva's sunflower on the table this week, at the cost of two assets and no law change.
- Dispositions: 3 place · 6 source (keyed masters and grade steps — retiring them destroys re-crop) · 10 retire · 8 hold for the drawer. Three sunflower renders are an unconcluded generator bakeoff; `-v3` won.
- **Trap: widening the tape pick list re-rolls every existing item's tape** (`seededPick` uses `floor(seed × length)`). Free today because the archive is fixtures. Not free after the first real photograph.
- **The top band is not paper and not tape — the clocks are DECO by the law's own allocation table.** It is the night above the table: `--night-sky` with the current screen's paper torn down from it, `Seam.tsx` rotated 180° (not flipped — a mirrored meander twins Today's lower tear). 56px + safe area. Contents identical on every route; I disagree with "contents varying" and say why.
- §0 becomes: nothing above the item may be *about* the item. One exception, invariant, never empty, **never a skeleton** — `DualClocks.tsx` renders shimmer in a `.well` and is the component a future agent will reach for.
- Five dead components still carry the retired v7 idiom. Deleting them is part of the band brief, not a separate cleanup.
