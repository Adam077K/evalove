---
date: 2026-08-06
role: frontend-engineer
task: shell-band
tier: full
visual_verification: PENDING
---

# Shared shell + DECO band (feat/shared-route-shell)

Edge-to-edge shell (`Column` opt-in for Dates/Send); `Band` (fixed masthead, reused DualClocks logic, LiveLocalTime hydration pattern) + `Seam rotated` (verified via asset alpha channel, not assumed) shared once in `app/(app)/layout.tsx`; 5 dead v7 files deleted, `lib/viewer` not orphaned.

`tsc` clean, 502 passed/1 pre-existing failure/2 skipped (baseline 489 + 13 new). Never opened the app — behind login wall, did not attempt. Needs founder eyes: band height/clock legibility at 393×852, both modes, and whether zero top-gap (content flush against the seam) reads right on Dates/Send.
