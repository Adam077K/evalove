---
date: 2026-08-06
role: design-lead
task: the making metaphor — composing a Book page by hand, on a phone
type: SPEC (no .ts/.tsx written)
qa_verdict: N/A — spec only, no code to gate
measured_on: integration/wave4 @ a6fbde6, localhost:3000, 393×852, day + night
---

Measured, not assumed: page 303×518 at y 48–566; free table 633–783; tray 290px at x 52.
The page's head sits ~131–142 mm from the thumb pivot — beyond any thumb. Drag-to-the-top is impossible one-handed, so the BOOK slides to the hand, never the hand to the book.
Discovery: press and hold anything in the book — a photograph or the bare paper — and it comes up. No affordance is drawn; the object was always loose.
Tray gains two children (tape, stickers) via the existing `layoutId="dock-active"`; scissors are refused — nothing here is ever cut.
Scale/pinch cut from the interaction set: a print is the size it is.
Undo is per-gesture and total; the archive is never touched, so nothing is ever consumed.
Six product collisions named for CPO; the largest is that composition today is DERIVED, not stored.
Full spec returned as JSON to team-lead.
