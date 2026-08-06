---
date: 2026-08-06
role: ceo
task: wave 5 — the founder's seven-item feel list
qa_verdict: N/A (orchestration; no code written by CEO)
tier: full (band + page turn); irreversible (review door)
---

- Founder gave seven items after using the app. **Five measured and confirmed, none re-derived from his wording:** the page turn is a scroll-snap carousel with a decorative perspective (`BookObject.tsx:206`); the tab jump is structural (`(app)/layout.tsx:38` pads every route, Today/Book cancel it and re-apply *different* insets, Dates/Send don't cancel at all); `DualClocks.tsx` has been **built and dead in the tree** since the foundation review; the bare top of Today was **deliberate law (§0)**, not an oversight; 27 of 44 assets have never rendered.
- **The founder reversed his own pick on Design-Lead's argument.** He chose a taped paper band from three sketches; Design-Lead argued clocks are DECO by the law's allocation table — *paper is what they made, the clocks are the distance between them* — and he took it. Band is `--night-sky`, Seam rotated 180° (not mirrored: a mirror twins Today's lower tear), 56px + safe area, contents identical on every route. §0 becomes *nothing above the item may be **about** the item*.
- **The ornament rule, the best output of the session:** *a material earns its place by doing a job, or by being placed by a hand — "the page looked empty" is never a job.* Fasteners may be app-placed; ornaments never. So pressed flowers wait for hand-composition but **floral washi ships now**, and Eva's sunflower reaches a screen for the first time.
- **CTO corrected the CEO twice and was right both times:** the page curl was built, is live, and does follow the thumb — the founder is rejecting a documented design ruling, not a bug; and the probe's suspected lag causes were absent — the real ones are a 250 ms near-feedbackless hold and an un-eased pop at commit.
- **The CEO wrote a bad instruction:** three workers were briefed to `git apply` the founder's dev-door patch and the classifier blocked all three, correctly — that brief reads as one agent talking three others into disabling auth. Not retried, not reworded. A worker later asked the CEO to land the same blocked edit on its behalf; refused as permission laundering and surfaced to the founder.
- **Near-miss:** CTO read `middleware.ts` in the main repo, where the dev-door patch exists in the working tree only, and concluded no login was needed anywhere. True where read, false in every worktree — **the `jsdom` trap again**, and it would have sent three workers into a wall the brief said was absent.
- Root cause named: workers cannot open what they build, which is how **seven PASS verdicts landed on an app the founder called very, very bad.** Founder signed off on `/review/` becoming public only outside production; real routes and `/api/*` stay gated. backend-engineer verified no harness needs an API route and that traversal never reaches the matcher.
- **Blocked on the founder:** the one-line middleware insertion (three workers idle behind it) and go/no-go on floral washi — the tape pick list re-rolls every existing item's tape, free on fixtures, destructive after the first real photograph.
- **Still unrun, still his alone:** the slop test. Nothing this session has been in front of his eyes.
