---
date: 2026-08-04
agent: design-lead
task: Write the new design law for the fourth direction (scrapbook day / deco night)
branch: ceo-4-1785631505
status: COMPLETE
qa_verdict: n/a (document, not code)
files_changed:
  - docs/08-agents_work/handoffs/2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md
  - docs/08-agents_work/sessions/2026-08-04-design-lead-design-law.md
supersedes: docs/08-agents_work/handoffs/2026-08-02-DESIGN-DIRECTION.md
---

# Session — Design Law: Scrapbook & Deco

## What was done

Read all required source material: the founder plan, the superseded law, the v7 globals.css on feat/design-foundation, USER-INSIGHTS.md, P4's adversary persona. Viewed all 12 scrapbook reference images and all 9 deco reference images directly.

Wrote `2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md` — a 7-section design law governing the fourth direction.

## Key decisions encoded in the law

1. §0 supersession notice makes explicit what dies (chromatic/material law) and what survives (all 13 behavioural rules). Written to be unmissable for any agent who reads the old file.
2. Night palette resolved with exact hex values grounded in the Batman:TAS references. Night sky `#0D1220` — a blue-black, not warm-off-black.
3. Photograph-at-night solved structurally: the mount carries the burden (polaroid border, lit window in illustration, lit surface). No filter touches the `<img>`.
4. Handwriting faces named: Caveat (Eva) / Patrick Hand (Adam) — both Google Fonts SIL OFL, both legible at 15px, visually distinguishable at a glance.
5. Stamp is typeset in Outfit, never handwritten — rule stated and justified.
6. Rotation widened to ±8° for photographs (brief said ±3°) — flagged as a disagreement, reasoning stated.
7. Mass hierarchy named. Composition law extended with rotation + overlap + mass as first-class variables.
8. All motion constants from the brief carried exactly.
9. Disagreements documented in §8: Book-at-night resolution, one reference misclassified, rotation range.

## Files not touched

- `apps/web/app/globals.css` — token rewrite is Phase 0 work; this document specifies the values, a separate task implements them.
- Any `lib/` code.
- `feat/design-foundation` branch — not modified.

## What next

Phase 0 (token rewrite): implement the night palette and paper stock tokens from §1 into globals.css on a new worktree off main.
Phase 0b: style bible + asset generation (product-designer).
Phase 1: the material library primitives (frontend-engineer ×2).
