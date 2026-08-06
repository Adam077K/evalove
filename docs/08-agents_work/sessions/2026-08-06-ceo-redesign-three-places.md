---
date: 2026-08-06
role: ceo
task: redesign-three-places
session: ceo-4
status: PLAN — no code dispatched this session
qa_verdict: N/A — planning only, no diff
supersedes: nothing; executes 2026-08-06-HANDOFF-USE-THE-APP.md
---

# Redesign plan — three places

## Founder decisions taken this session

1. **The surface list is three places: Today · The Book · Dates.**
   Echo stops being a destination. Vision V2 §3.3 argued for two; the founder
   kept Dates as a place because the 98-item library is the largest researched
   asset in the repo. Recorded as a deliberate divergence from Vision §2.3,
   which wanted Dates reduced to a gesture.
2. **Echo: stop the lie now, decide later.** The fake 1100 ms thinking delay
   and the canned apology come out immediately. The five open decisions in
   `AI-PARTNER-SPEC.md` §12 stay open and no longer block anything.

## Measured diagnosis — the redesign covered 2 of 5 destinations

Law-era markers (`under-lamp`, `paper-`, `deco-`, `Taped`, `Mounted`, stock)
vs SaaS-era markers (`card`, `well`, `hover-lift`, `shimmer`, `rounded-[`):

| Surface | law-era | SaaS-era |
|---|---|---|
| Today | 11 | 0 |
| The Book | 9 | 0 |
| Dates | 0 | 15 |
| Echo | 0 | 6 |
| Send | 3 | 13 |

Waves 0–2 rebuilt Today, The Book and the tray. **Dates, Echo and Send are the
pre-redesign build.** Tapping the third tab leaves the scrapbook and lands in
the old app. This is a structural cause of "using the app is very, very bad"
that no per-branch QA gate could have caught — every branch was correct.

## Corrections to the handoff, from source not description

- **Echo is worse than reported.** `EchoChat.tsx:91` fakes a 1100 ms "thinking"
  delay *before* the apology. It performs a latency it does not have.
- **Dates is half-wrong in the handoff.** The window rail *is* interactive
  (`role="tab"` buttons). The cards are non-interactive `<motion.li>` carrying
  `hover-lift` — an affordance that lifts under the finger and goes nowhere.
  There is no `/dates/[id]`.
- **Both dead surfaces violate the "no prepared place" rule** — `DatesExplorer`
  renders shimmer skeletons inside `.well` containers.
- **`/send` still carries the two-tier framing** its own comment states:
  *"deliberately lighter than the daily ritual."* Vision §2.1 cuts exactly this.

## The plan — four layers

### Layer 0 — Use it, then show pixels (Wave 4, never ran)
Audit at **393×852 only**, day and night, every route. Deliverable is a
**visual contact sheet with a screenshot per finding**, ranked — not a document.
Run the four tests (Tuesday, logo, 11pm, slop). Viewport captures only, never
full-page. Founder's two named defects to confirm first: the layout breaks, and
the Book's proportions are wrong on a phone.

### Layer 1 — Journeys (decided, above)
- **Arrive** → open lands on the last thing left. (Today)
- **Leave** → the pen, from anywhere, one act, no tiers.
- **Return** → The Book: archive, search inside it, pocket as a drawer.
- **Rescue** → Dates: one card correct for the moment, not a browsable shelf.

Surface migration:

| Now | Becomes | Authority |
|---|---|---|
| `/today` | kept — it is what the app *is* | Vision §3.3 |
| `/book`, `/book/days` | kept + search + pocket drawer | Vision §2.4, §3.3 |
| `/dates` | kept as a place; stops being a shelf | Founder, this session |
| `/echo` | **deleted as a destination**; de-lied now; returns as Book search | Founder, this session |
| `/send` | folded into the pen; tier language dies | Vision §2.1 |
| `/pocket` | drawer inside the Book | Vision §2.1, handoff §8 |

Dock: 4 tabs + send → **3 places + the pen**.

### Layer 2 — Components and pages
Audit-driven; cannot be finalised before Layer 0 returns. Known now:
Dates needs a full law-era rebuild plus a real interaction; Send loses its page
and its tiers; Echo's fake latency is stripped; Today and The Book get repair
per audit findings; the Dock loses a destination.

### Layer 3 — Design and style
The design-critic loop. Process per `design-orchestration`
(brainstorm → risk-classify → review gate). Acceptance per `ui-visual-validator`:
**the goal has NOT been achieved until proven by visual evidence** — which is the
direct counter to seven PASS verdicts on an app that is bad to use.

## Skills — which law out-ranks which (required by handoff §5)

Read this session: `design-orchestration`, `frontend-design`,
`redesign-existing-projects`, `ui-visual-validator`, `product-manager-toolkit`.

`redesign-existing-projects` is a **checklist only, never a direction** — its own
text recommends `picsum.photos` placeholders (line 43) and bans warm off-black
(line 33), both of which fight this project. DESIGN-LAW out-ranks it.

Rejected outright: `design-taste-frontend`, `high-end-visual-design`,
`minimalist-ui`, `react-ui-patterns`, `frontend-dev-guidelines`.

## Worktree housekeeping

Fast-forwarded to `afdd19f`. `2026-08-04-design-lead-wave0-packet.md` existed
only in this worktree's working tree — committed at `e4729a9`, per handoff §7.4.
Two root PNGs showed a rejected direction (plus-in-a-well, "A place is ready for
Eva") and were moved out of the repo, not deleted.
