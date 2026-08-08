---
date: 2026-08-08
role: qa-lead
task: wcag-gate-book-turn-scroll-paper-wrap
branch: integration/real-photos
worktree: /Users/adamks/VibeCoding/evalove/.worktrees/go-live
tier: lite
qa_verdict: PASS
---

Accessibility gate for Design Lead's same-day layout/layering fix pass.
Two changes reviewed: (1) BookTurnStage.tsx useEffect adding scrollIntoView on page turn; (2) Paper stock="coldpress" wrapper added to send, dates, and login pages.

PASS — no P0 or P1. One P2 filed: scrollIntoView after keyboard-triggered page turn may push focused Prev/Next button off-screen when book stage exceeds viewport height. VoiceOver iOS self-corrects; sighted keyboard users on desktop affected. Fix: guard the scroll when document.activeElement is not document.body.

Contrast verified: ink/canvas 16.7:1 day, 8.5:1 night. Mute/canvas 5.5:1 day, 4.63:1 night (explicit AA floor in globals.css). Paper aria-hidden background correct. No focus trap introduced.
