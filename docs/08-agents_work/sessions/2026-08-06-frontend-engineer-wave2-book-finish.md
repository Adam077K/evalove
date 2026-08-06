---
agent: frontend-engineer
task: wave2-book-finish (ribbon swap, page turn, verification)
branch: feat/the-book
qa_verdict: PENDING
tier: full
---

- Burgundy ribbon ships as `book-ribbon.webp` (name can no longer lie); judged in situ vs brass and teal, day + lamp-dimmed — brass merges with the lamplit room the way teal merged with the cloth. Losers archived in assets under colour names.
- Ribbon keying generalised in `book_standins.clean_ribbon`: grey scallop outlines separate from silk by SATURATION, not value; colour kills must precede the blob drop; shipped pixels reproduce from source through the tool.
- Page turn on /book/days: rigid scroll-driven leaf (`animation-timeline: view(inline)`, globals §8b) — verified with a HELD CDP touch: tilt/sheen/shadow track the finger while it is down; snap settles flat on release; reduced-motion is full removal (probed: animation none at a mid-drag offset). Slots w-full so the open page rests flat (88% held a permanent −3.7°).
- Tuesday test PASS (text-only opening reads as a made page); logo test PASS (emboss hidden, the object still identifies the product). Captures in `screens/2026-08-06-wave2/`.
- Pre-existing on branch, untouched: 7 lint errors (react-hooks/set-state-in-effect etc.) — identical with my changes stashed.
- Dev-boot landmine: `apps/web/.env.local` (untracked) uses `\$`-escaped scrypt hashes; Turbopack's env parser does not unescape and overrides the process env → every `next dev` boot fails env validation. Moved aside for captures, restored after. Durable fix: single-quote the values.
