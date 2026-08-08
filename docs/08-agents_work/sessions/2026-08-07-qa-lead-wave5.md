---
role: qa-lead
task: wave5-gate
branch: integration/wave5
commit: aab02e8
tier: irreversible
qa_verdict: PASS
prior_verdict: BLOCK at f23be64
date: 2026-08-07
---

- PASS at aab02e8. The BLOCK at f23be64 stands as correctly issued; all three P1s are fixed and each fix was verified against the old code, not taken on report.
- TRAP-VERIFIED (reverted implementation to f23be64, ran the new guard, restored): turn tests 5 failed / 24 passed incl. the origin-return wedge; route-classification 2 failed / 7 passed; copy-law tree walk 1 failed / 3 passed with the NEW detector against the OLD breaches. All three are traps, not decoration. Working tree restored clean each time.
- BROWSER-VERIFIED at 393x852 — the check I missed last round was progress, not liveness: Next advances leaf 0 then leaf 1 to rotateY(172deg), Prev reverses, an origin-return drag leaves the pose untouched, and Next AFTER that drag still fires. Zero page errors. Next correctly disables at the end of a 2-leaf fixture.
- Test-evidence sweep, whole diff: the six fabricated sites are gone — `transitionEnd` now fires on the flip element that actually transforms. One residue: `BookTurnStage.test.tsx:189` still fires `propertyName:"filter"` on an element whose transition is transform-only; a browser cannot emit it. It is now a defensive guard (line 193 immediately fires the real transform event and asserts resolution), so P3, not a block. No other test in the wave manufactures its signal: no getComputedStyle against unloaded stylesheet CSS, no vi.mock of a unit under test.
- Suite run here: 776 tests, 775 passed, 1 failed — the pre-existing `tools/export` env gap. Matches the reported figure.
- RULINGS: review-harness gutter exclusion UPHELD (stripped from production, double-gated, full-bleed serves inspection). `OUT_OF_MARGIN` "done for today" UPHELD — capacity, not a timestamp; allowlist is exact (file,text) pairs so it cannot mask a neighbour. `photos.ts` "in 24 hours" UPHELD — a policy duration in a server DataError. EchoChat stays OPEN — correctly in OPEN_FINDINGS, which warns every run rather than silently allowlisting.
- NOT ASSESSED, unchanged: band non-remount in a browser; `/today` `/book` `/dates` `/send` (gated, project law); the slop test and the band proportion (founder only). `pnpm lint` still red on 4 errors, all pre-existing on origin/main.
