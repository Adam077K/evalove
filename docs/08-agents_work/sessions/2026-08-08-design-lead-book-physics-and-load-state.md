---
date: 2026-08-08
agent: design-lead
task: book-physics-and-load-state
branch: integration/real-photos
commit: c829207
qa_verdict: PASS (vitest 1011/0 failing, tsc clean)
tier: lite
---

## What changed

Three targeted fixes from network-throttled and frame-by-frame investigation.

### Load state — Paper.tsx

`Paper` had no fallback colour. Every leaf in `BookTurnStage` uses
`gridArea="1/1"` stacking. During slow network the bone texture PNG
hadn't loaded, leaving each `Paper` transparent. All leaves bled through
each other: overlapping captions, white photo holes, the spine visible
through the stack.

Fix: added per-stock `backgroundColor` to the `StockSpec` interface and
wired it onto the substrate div. Values are tuned to each stock's warm mean
tone (`#f0e8d8` bone, `#ede0c8` bone-laid, `#f2ece4` coldpress) so the flat
fill is invisible once texture arrives. Zero loading states — the fill is
what the paper looks like with no grain.

### Lift — turn.ts

`LIFT_PX` 8 → 12. At 8px the arc's midpoint displacement on a 393px phone
was sub-pixel for most of the turn. Real paper bows when you lift it. 12px
reads as physical resistance without reading as a cartoon bounce.

### Settle duration — useBookTurn.ts

`SETTLE_MS` 220 → 300. At 220ms the leaf felt like a UI toggle: fast,
symmetric, no mass. The smoothstep deceleration tail at landing is where
paper weight lives. 300ms gives that tail enough time to register.
Intentionally diverges from the 220ms `--dur-2` UI cadence — a page turn
carries more mass than a button state change.

## What was confirmed not broken

- Book size: board spans 335px = 85.3% of 393px screen. Content area 263px.
  Not a problem — a held book fills the hand.
- Day colours: warm paper + warm real photographs are harmonious.
- Night / lamp: amber lamp correct on /book. /book/days has no lamp — correct.
- Paper texture: no tiling seam at 4× device scale factor. Reads as handmade.

## Files changed

- `apps/web/components/materials/Paper.tsx` — per-stock backgroundColor fallback
- `apps/web/components/book/turn.ts` — LIFT_PX 8 → 12
- `apps/web/components/book/useBookTurn.ts` — SETTLE_MS 220 → 300
