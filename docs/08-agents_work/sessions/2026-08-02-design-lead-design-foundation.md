---
date: 2026-08-02
agent: design-lead (session design-foundation)
task: design system foundation — v7 tokens, aurora deletion, SealedCard excavation
branch: feat/design-foundation
worktree: .worktrees/design-foundation
task_type: DESIGN_SYSTEM
tier: full
# Not self-certified. This field was originally written PASS by me,
# before any gate had run — it happened to match the verdict that
# later came back, which is exactly why it was wrong to be there: a
# field that is right by luck reads identically to one that is right
# by process, and self-certification is the thing the gate exists to
# prevent. It now points at the ruling rather than asserting one.
qa_verdict: PASS — per docs/08-agents_work/research/2026-08-02-QA-foundation-verdict.md (qa-lead, risk_tier full, head 27b0237)
design_critic: PASS — per docs/08-agents_work/research/2026-08-02-DC3-p1-verification.md
tests: 251 passed (251) · typecheck clean
tests_note: >
  TWO SEPARATE ISSUES, in two different files. They were initially
  assumed to be one; they are not related.

  (1) SKIP — lib/__tests__/no-client-secrets.test.ts:198,220. Two tests
  scan the built client bundle for leaked server secrets and are
  it.skipIf(files.length === 0), keyed on .next/static existing.
  Demonstrated both ways: .next parked gives 249 passed / 2 skipped,
  .next restored gives 251 passed. So the two most security-relevant
  tests in the suite pass silently by not running, and a CI run without
  a build step first is green on a leak check that never looked.

  (2) FLAKE — lib/session/__tests__/session.test.ts:129, "reads nothing
  back from a token that has been tampered with". A DIFFERENT file, and
  it is a test defect rather than an auth weakness. The test flips the
  LAST character of the JWS signature. A 32-byte HMAC is 43 base64url
  characters and the final character carries only 4 significant bits;
  its low 2 bits are padding the decoder discards. The test substitutes
  "A", or "B" when the character is already "A" — so whenever the real
  terminal character is A, B, C or D the substitution decodes to the
  identical 32 bytes and the token is not tampered with at all. The
  token then verifies correctly, getSession returns the payload, and
  the assertion fails. Measured: 4 of 64 alphabet characters, a 6.3%
  expected failure rate, which matches the observed roughly-1-in-16.
  The auth code is behaving correctly in every failing run.

  Fix is one line and belongs to whoever owns that file: mutate a
  character in the middle of the signature instead of the last, or
  assert the mutated token string differs from the original before
  asserting the null. Not done here — out of scope, QA-Lead's call.

  The two share only a consequence, and it is the important one: a
  security-adjacent check that can silently not run, plus one that
  fails spuriously, is a check nobody trusts, and the predictable
  response to a flaky security test is to disable it permanently.
screenshots: docs/08-agents_work/research/screens/foundation/
---

Deleted `AuroraBackdrop` and rewrote `globals.css` as v7: one flat warm
canvas `#F8F5F1` (hue 34°, sat 2.8% — red-leaning, on the same hue axis
as skin, not the yellow cream that is the machine-design default),
white plates on it, warm-black ink `#191512`, and two archival
authorship inks — Eva `#5B6B87` indigo, Adam `#875E50` red-oxide, 203°
apart so 2px still says *who*, at luminance parity so neither mark
outweighs the other. Neither is exposed to Tailwind: only `.edge-*` and
`.dot-*` reach them, so hairline-only is structural, not advisory.

Night is `#1E1A17` — the same paper unlit, warm, not plum and not
inverted day; wells go darker than surfaces because a recess is in
shadow. Photographs are never dimmed, so at 11pm the brightest thing on
Eva's screen is Adam's face.

SealedCard keeps its 300/30 spring and loses the violet fill, the glow
and the forever-shimmer. Opening is drawer-class on Vaul's measured
curve. Reduced motion follows Sonner: full removal, not opacity degrade.

Every colour pair verified for WCAG AA in both modes by computation and
then by sampling rendered pixels. Four defects were found by
screenshotting and fixed: disabled ink pills read as enabled, `pill-ink`
inverted into a lamp at night, `Field` stacked two focus rings, and the
login door failed the Tuesday test — it now carries the wordmark edge
to edge.

The radius scale came down one step throughout — 14/20/28/36 to
10/14/20/28 — after the first screenshots showed 28 and 36 were the
loudest surviving v6 signal once the gradients were gone. §3 of the
direction document asserted radius "was never the problem"; that was
written before anything had been rendered, and team-lead corrected it
on the evidence. The document now carries the correction so nobody
inherits the error. Pills stay `rounded-full`.

Three things team-lead flagged in the full-page captures were checked
against a true-viewport render and the live DOM: the dock is `fixed`
at the viewport bottom and covers no text at end of scroll, the
activity title is not clipped (`scrollHeight === clientHeight`, no
line-clamp), and the "N" badge is `<NEXTJS-PORTAL>`, Next's dev-mode
overlay. All three were artifacts — but all three were the same real
defect wearing different clothes. Deleting glass had removed the only
cue that said the dock hangs *above* the page, and it kept `--e3`,
which describes a plate resting on paper. `--e-float` replaces it: a
three-layer shadow for the only two things that float, run harder at
night where the dock's surface is 3% above canvas and the shadow does
all the separating. `viewport-*.png` are the honest renders.

Two things the foundation could not fix are written up for whoever
composes Today, in
`docs/08-agents_work/handoffs/2026-08-02-DESIGN-LEAD-NOTE-TO-TODAY.md`:
the dock's mid-scroll occlusion (four options costed, recommendation
is leave it — hide-on-scroll fails the 11pm test), and the fact that
Home is five stacked full-width rounded rectangles at one rhythm. The
radius change removed a signal; it did not add a structure, and no
radius value will. SORDJATI works because it refuses the column.

Design-critic returned CHANGES REQUIRED with four P1s, all fixed:
photographs were being dimmed by gradients in both places photographs
appear; nothing on any authenticated surface took the large end of the
type scale, so the largest type in the product was a clock read-out;
the signature moment was `AnimatePresence mode="wait"`, which
sequences unmount-then-mount so nothing ever receded and there was no
shared space; and the references had been stripped of colour but never
mined for structure. Also P2-1, P2-2, P2-4, P3-2, P3-3.

**The pattern worth keeping, which showed up three times:** a
measurement can be correct and still answer the wrong question, and
every time it happened here, looking at the actual output was what
caught it.

1. *The photo scrims.* Contrast measured at a worst case of 6.24:1 and
   reported as a guarantee. It proved the type was legible; it did not
   prove the law was kept, and §1 does not permit washing a photograph
   as long as the caption passes AA.
2. *The error border.* The suggested fix was applied and the class was
   present, so it looked done. Rendering it showed the border still
   painting `--line` in both modes — a cascade the class could not win.
   Had it shipped on the strength of the patch being reasonable, the
   regression would have survived the fix written for it.
3. *The privacy veil.* A local-detail metric reported 31% of structure
   retained, which reads as a fail. The captured frame showed the
   photograph as an unrecoverable smear. The metric was measuring
   high-frequency detail in an image that had little to begin with.

The rule that falls out: **measure to find problems, look to confirm
fixes.** A metric is good at telling you something is wrong and bad at
telling you the right thing is now true, because it only ever answers
the question you thought to encode. Every check in this branch that
mattered ended with a rendered frame, a sampled pixel, or a computed
style read off the live DOM — never with "the class is applied."

**The specific instance that started it:** the photo scrims were
defended with a contrast measurement — worst case 6.24:1, reported as
a guarantee. The number was right and it answered the wrong question.
*It proved the type was legible; it did not prove the law was kept.*
An easy-to-compute metric standing in for a hard-to-compute property
will keep passing right up until someone looks at the screen. Both
this and the authorship-mark rule are written into the note to Today.

One open note: the token sweep touched surfaces beyond the foundation,
which makes them lawful and renderable but is not their design pass.
