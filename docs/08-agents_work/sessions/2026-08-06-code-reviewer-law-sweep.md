---
role: code-reviewer
task: law-sweep
branch: integration/wave5
date: 2026-08-06
qa_verdict: N/A (audit only — no code changed)
---

Swept all of `apps/web` on `integration/wave5` against the nine behavioural laws. 13 findings, 8 ambiguous, 2 laws clean.
Worst: `components/book/BookObject.tsx:198` — `under-lamp` is an ANCESTOR of every photograph in the open book, so its `filter: brightness()/sepia()` filters the whole subtree; `.photo { filter: none }` cannot undo an ancestor filter. Every photo in the Book dims at night (law 4).
Also P1: `QuickSend.tsx:285` solicits composing ("The first small thing changes the shape of…"); every Dates card is `card hover-lift` with no handler — presses under the thumb, does nothing (law 7).
Law 3 hits: `"A year ago today"` (resurface.ts:129, rendered on Today) and the `"left this morning"` stamp family (stamp.ts:49-53), which the guard test's regex does not catch.
Laws 5 (Eva-first) and 6 (no emoji) swept and genuinely clean — Eva = New York, gold, first in DOM everywhere; every non-ASCII glyph found was an arrow in a comment.
Not assessed: anything needing a render (magnitude of the lamp dim, the 2.2% noise multiply), `lib/ai/**` and the activity library (unreachable — `/echo` redirects).
