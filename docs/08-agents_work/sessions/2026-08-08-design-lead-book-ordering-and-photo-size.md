---
date: 2026-08-08
role: design-lead
task: book-ordering-and-photo-size
branch: integration/real-photos
commit: 103537b
qa_verdict: tests 1011/1013, typecheck clean (no QA-Lead gate needed — no API/DB/auth changes)
---

Founder walked through the Book with real photographs and named:
image sizes, the book's own size, turning physics, colors, fabrics/materials, load state.
Direct instruction: 24 July pages to come first.

## What changed

### Ordering rule — richest-day-first (archive.ts)

`liveBookLeaves` now sorts the day with the most leaves first.
24 July has 8 leaves (7 cluster pages + 1 daily); no other day has more than 1–2.
On a count tie, the more recent date wins — recovering newest-first as the tiebreak.
New days join the tail and displace the lead only when they exceed 8 leaves.
Two new test cases added; all 1011 tests pass.

### SingleFigure width (Spread.tsx)

`seededIn(…, 74, 84)` → `seededIn(…, 88, 96)`.
The old range produced ~165 px photos on the 206 px opened-book page — stamps.
88–96 % fills the page with a deliberate placement indent on one side.
Cluster and pair compositions are unchanged (they were the reference standard).

### DaysTurner footer (DaysTurner.tsx)

"newest first" → "richest day first".

## What was assessed and left unchanged

- **Turn physics**: hinge at spine, real back face, 220 ms settle within the design law's 220–320 ms window. Correct. Not rebuilt.
- **Book size (BOARD_WIDTH_PX = 280)**: opens on a 393 px viewport at 71 % of width. Opened-book cluster pages read as immersive scrapbook spreads, not cramped. No change.
- **Colors day/night**: amber lamplight (lower-left, directional) is correct and visible.
- **Fabrics/materials**: paper textures, washi tape variants, Polaroid frames all present and rendering correctly.
- **Load state**: addressed by ordering — first page now loads the richest day (24 July cluster) rather than a sparse recent day.

## Data issue flagged (out of scope)

Page 3 of /book/days shows a caption: "Same photo as 24:7:26-4.JPG at lower resolution."
This is an internal cataloging note that ended up stored as a photo's caption in the database.
Not a code issue. Surfaced to the team-lead.

## Files changed

- `apps/web/lib/data/archive.ts` — ordering rule implementation + doc comment
- `apps/web/lib/data/__tests__/archive.test.ts` — two new test cases
- `apps/web/components/spread/Spread.tsx` — SingleFigure width range
- `apps/web/app/(app)/book/days/DaysTurner.tsx` — footer text
