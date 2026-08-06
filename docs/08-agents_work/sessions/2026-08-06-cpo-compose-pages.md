---
date: 2026-08-06
agent: cpo (session cpo-compose-pages)
status: COMPLETE — spec only, no code
spec_file: docs/04-features/specs/hand-composed-book-pages.md
qa_verdict: not yet run — this is a spec hand-off, not a build
---

# CPO session — hand-composed Book pages

## Task

Write the product spec for hand-composed Book pages, per the founder's decision that the Book becomes something you make: pick photographs from the archive, place them, tape them, write on them. Auto-composed pages stay the default; any page can be opened and reworked.

## What I read first

`PRODUCT-VISION-V2.md` §4–§7, `2026-08-04-DESIGN-LAW-SCRAPBOOK-DECO.md` §0 + behavioural law, `2026-08-06-HANDOFF-USE-THE-APP.md`, the last ~30 entries of `DECISIONS.md` (most recent-first, so effectively today's and the last few days'), `USER-INSIGHTS.md`, `apps/web/components/spread/Spread.tsx`, `apps/web/components/chrome/Dock.tsx`, `apps/web/components/book/compose.ts`, and the `feat/unilateral-remove` branch (the founder-cited precedent for unilateral action — soft-delete scoped to authorship) plus the `book_entries` migration to check the current schema's assumptions against what composition needs.

## What the spec decides and flags

- **Who may compose:** recommended either partner, full page, non-destructive — flagged as an open question for the founder anyway, per the brief's explicit instruction not to decide it quietly.
- **Archive immutability:** composition is a presentation-layer override on top of the existing pure, seeded auto-compose function in `compose.ts`; nothing about a photograph's record, its home day, or the export is touched. "Reset to automatic" is the absence of an override record, not a separate feature.
- **Change visibility:** a quiet, factual "arranged by [name], [date]" line, typeset in Outfit (the app's own voice), visible only on the page itself — no push, badge, or dock/cover indicator. Flagged as open (too little vs. too much are both real risks).
- **Discovery:** a permanent, unlabeled affordance at the Dock's already-anticipated Stage-2 tool slot — identical whether or not a page has ever been composed. No tour, no badge, no "New!" copy.
- **Unit of composition:** a page can pull photographs from anywhere in the archive, referenced not moved — this directly answers Adam's stated ask ("more than 1 image in the page") which a same-day-only reading would not have solved.
- **Argument against, run seriously:** composing adds an obligation shape to the one surface designed to have none, and risks the composed-by stamp itself becoming a visible-effort tally between two people — a new register of the exact asymmetry-as-signal problem the project has banned everywhere else. Recorded, not overridden — founder already chose the biggest of four options with this cost visible.
- **Tech flag for CTO:** the existing `book_entries` migration enforces "a photo appears in the book at most once," which conflicts with cross-day referencing; CTO must confirm whether that table is even live/relevant versus the current `photos` + `shared_day` architecture Spread.tsx actually reads from.

## Completeness gate

All six items pass: customer-language problem statement (with the "this is Adam's voice, not Eva's" gap named explicitly rather than hidden), measurable time-bound-ish success framing embedded in the DoD, 8 Given/When/Then acceptance criteria, Out of Scope section, RICE (labeled, with an honest note that reach=2 is a formality per this project's own prior convention in `PRODUCT-VISION-V2.md` §0), and Tech notes for CTO flagging the schema conflict and the Irreversible-tier migration.

## Handoff

Spec is ready for CTO. Recommend CTO read the three open questions before scoping work — Q1 (who may compose) and Q3 (rendered export snapshot) both change effort estimates materially.
