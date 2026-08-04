---
date: 2026-08-02
agent: ceo
session: ceo-4-1785631505
task: reimagine Eva & Adam — ground the concept before any build
qa_verdict: N/A (no code changed; docs and research only)
tier: n/a
agents_spawned: [R1-voices, R1b-reddit, R2-churn, R3-asynchrony, R4-motion, P1-11pm, P2-5am, P3-year-three, P4-deleter, P5-saturday, CPO-vision]
sources_gathered: ~105
founder_decisions: 5
---

# CEO session — reimagine grounding

**Problem.** Two design directions rejected as "AI slop." The brief's diagnosis:
every previous agent started from our own documents, so coherent documents
produced a coherent app nobody wants. The fix was to ground everything in real
sourced material before writing a line of vision.

**Method.** Three waves. Research (~105 sources, Reddit cracked via Playwright
after direct fetch 403'd), then a five-persona board reading that research —
each told it was a reasoning lens, not a source of evidence, and required to
cite or label every claim. Then CPO synthesis.

**What changed the product.**
- P1 (advocate) and P4 (adversary) independently designed the same thing: leave
  one unperformed thing that is already there when the other wakes. No "seen".
- The app is a vessel, not a source — three independent findings converge.
- Never let the *product* keep score; missed days do matter to real couples.
- R4 walked the running app: the machinery underneath works. This is a colour
  and surface pass, not a rebuild.
- P4 found the unmade point: every surface is load-bearing on the gap, so the
  product is obsolete when the relationship wins. CPO answered it.

**Founder decisions locked.** Warmth in the paper / restraint in the chrome
(reversing my own colour law, which described the empty state); "no app store"
immovable so the widget mechanic is out; two surfaces not three — Today + The
Book; Gap becomes a stamp; Saturday protected as a day, cut as a surface.

**Corrections I made.** Overstated an activity-library gap (P1 only had T2);
gave a wrong Saturday cadence figure (98 → really ~20-24 eligible, 22 months →
4.5); relayed a Saturday risk from a single uncorroborated source that R1b then
overturned.

**Open.** Refero subscription dead — R4's reference work is substituted and
labelled. Login rate limiter fails closed: a Supabase outage locks both users
out of their own archive.

---

# Build phase — design foundation

Founder said go. One worker, narrow scope, foundation before surfaces because
every surface reads the same tokens.

**Shipped on `feat/design-foundation`** (~12 commits, 251 tests green): aurora
deleted, warm-paper tokens with reasoning per value, night as a primary surface,
`SealedCard` rebuilt as a real opening, radius scale down one step, ~60 call
sites swept. Not merged.

**The gate worked.** A craft review returned FAIL on the Tuesday test and
PARTIALLY RE-COSTUMED on the escape question — both harsher than design-lead's
self-assessment — with four P1s. All fixed. The sharpest: photographs were being
dimmed by gradients, in a codebase whose own comment said the `photo` utility
existed "so nobody reintroduces `--photo-dim` by writing a one-off."

**Three durable rules came out, all recorded in the branch:**
- The authorship mark attaches to a thing that exists and that someone made —
  never to a turn, a state, an intention, or a slot.
- On any surface the large end belongs to what *changed*; supporting facts stay
  small however identifying they are. The two clocks are the most identifying
  thing in the product and still don't get to be the biggest.
- Before making a layout asymmetry track state, ask whether that state is
  independent of which person. If the seven-hour gap predicts it, it's a
  person-ranking wearing a state's clothes.

Plus the meta-lesson, from the scrim breach: an easy-to-compute metric standing
in for a hard-to-compute property keeps passing until someone looks at the screen.

**Honest state.** Materials right, one composition right (the clock rail), the
rest still a card stack. Two known weak points, both Today's job and both
documented with the failed attempts attached: the last 50/50, which the equality
rule forces, and the unfinished column.

**Process finding.** Three critic-shaped agents stalled — the first task from a
fresh agent lands, the second often doesn't. Mitigations that worked: require
the output file as the opening action, keep briefs short, re-spawn rather than
re-ping. Also: verification reads repeatedly raced in-flight commits, which
produced two false "not done" conclusions. Check `git log <branch>`, not a
worktree's working state.

**Corrections I made this phase.** Told the founder the signature moment already
existed and only needed excavating — it was a cross-fade; that was a build, not
an excavation. Asserted in the direction doc that the radius scale was never the
problem — untested, and wrong once rendered. Proposed a state-tracking asymmetry
to escape the 50/50 — it laundered a person-ranking through geography.
