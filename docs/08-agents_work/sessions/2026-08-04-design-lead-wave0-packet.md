---
date: 2026-08-04
agent: design-lead
task: Wave 0 dispatch packet for Fable worker
branch: ceo-4-1785631505 (packet only; worker creates own worktree)
qa_verdict: N/A — packet delivery, no code
---

Read DESIGN-LAW, STYLE-BIBLE, HANDOFF, globals.css, SealedCard.tsx, Dock.tsx.
Confirmed: type-eyebrow has zero usages outside its own definition — safe to delete.
Assets on disk: 15 PNGs at docs/08-agents_work/screens/2026-08-04-assets/ (no web/ subfolder, no WebPs — path in brief is aspirational).
Fonts: layout.tsx loads from @fontsource-variable/*; public/fonts/ has 4 orphan woff2 files (Fraunces, Literata) — do not touch.
Motion constants confirmed in Dock.tsx:33 (420/34) and SealedCard.tsx:72+76 (300/30, ease [0.32,0.72,0,1]).
Packet composed. Session complete.
