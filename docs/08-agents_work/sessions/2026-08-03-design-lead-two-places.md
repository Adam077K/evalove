---
date: 2026-08-03
role: design-lead
session: design-lead-two-places
color: pink
branch: ceo-3-1785631504
task_type: NEW_PAGE + REDESIGN (composition plan, no source edits)
qa_verdict: N/A — no app source changed; QA gate belongs to the four dispatched briefs
deliverable: docs/08-agents_work/handoffs/2026-08-03-TWO-PLACES-DISPATCH.md
renders: docs/08-agents_work/renders/2026-08-03-two-places/ (14 viewport captures, both modes)
---

Ran the app locally (session cookie minted directly against `SESSION_SECRET`,
bypassing the fail-closed login) and captured Today and The Book at 393×852 in
day and night. Built the untested §5 shape-at-equal-weight idea before judging
it: **it fails** — equal area is not equal weight, the empty field outweighs the
photograph, and the empty side is Eva's through the biggest window in their week.
Deeper finding: any layout that renders a place for what is absent renders Eva's
absence more often than Adam's, so the slot is the defect, not its proportions.

Resolution: Today holds **one item — the last thing the other one left** (VISION
§1 read literally), which dissolves the 50/50 rather than solving it. The Book
opens on **what came back** (date-match, then hour-match), with chronology
reachable and not default. Confirmed the live count bug at `book/page.tsx:54/63`
and chose to delete the count rather than recount it — `completeDays()`
classifies a day by contributor count, which VISION §2.2 forbids; the colophon
`Begun 2 August 2026` replaces it. Also found the Gap **stamp does not exist in
the codebase at all**, though DESIGN-DIRECTION §7 requires it on every item; it
is now Brief A and it blocks both surfaces.

Both surfaces pass the Tuesday test with zero photographs, in both modes.
Four briefs dispatched in two waves. Three judgement calls flagged for the
founder rather than absorbed.

**Revised after CEO's verified finding that iOS Safari web push cannot carry an
image**, making the open the only arrival path. Re-rendered rather than
asserted: the first pass put 41% of the first viewport — a date line, a 47px
sentence, and two hydrating components that paint skeletons — above the thing
Eva opened for. Order inverted, photograph now starts at y=0, sentence moved
below. Today gains one bounded doorway showing what came back, so the day
nothing arrived still has something that differs from yesterday. Renders 20–23
superseded by 24–28; `lib/resurface.ts` moved into wave 1 so both surfaces
render the same return.
