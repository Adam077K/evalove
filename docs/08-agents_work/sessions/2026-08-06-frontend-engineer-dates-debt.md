---
date: 2026-08-06
role: frontend-engineer
task: dates-debt
qa_verdict: PENDING
tier: lite
---

# Fix 1 & 2: wrong regression test + today breach

Fixed: the uncommitted regression test's empty-window claim (w2/w5/w6/w9 → correct w2/w5/w6/w7, verified against fork point 860d2c7 windowFit counts w1:2 w3:1 w4:2 w8:1 w9:1); all 10 other assertions independently re-derived as true against the 33-entry fixture and kept; two latent type bugs in the test (`noUncheckedIndexedAccess`, `expect(v).matcher(x, msg)` — vitest wants `expect(v, msg).matcher(x)`) fixed so `tsc --noEmit` is clean. Removed relative-time "today" from `b1-mirrored-errand` description (58→52 chars, cap respected). Grepped fixture for other relative-time words: one false positive ("imago" contains "ago"), four ambiguous category/procedural hits in `HOW_IT_WORKS`/`SHELVES` ("tonight" ×2, "now" ×1, "right now" ×1) left unchanged, flagged for CMO per brief. `tsc --noEmit` clean; vitest 500 passed (489 baseline + 11 new)/1 pre-existing failure (`tools/export`)/2 skipped. `visual_verification: PENDING` — routes are behind the login wall.
