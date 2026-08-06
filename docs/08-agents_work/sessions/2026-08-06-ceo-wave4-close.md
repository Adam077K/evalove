---
date: 2026-08-06
role: ceo
task: wave4-close
session: ceo-4
qa_verdict: PASS (qa-lead-wave4, Full tier) — second opinion in flight
merged: NO — main untouched at 860d2c7, awaiting founder confirmation
---

# Wave 4 — the design audit, the repair, and the gate

The founder's brief was two sentences: *"using the app, it's very, very bad"* and
*"it looks like a three years old website design!"* Both are now located, fixed, and
verified in a browser. Nothing has merged.

## Founder decisions taken this session

1. **The app is three places** — Today · The Book · Dates. Echo stops being a
   destination. (`36fdba9`)
2. **Echo's lie comes out now**, spec decisions deferred. (`36fdba9`)
3. **Browser verification is trunk-level**, performed by the CEO; workers report
   `NOT DONE` honestly. A denied permission has no appeal to a peer. (`313fdc0`)
4. **Dates is a place, not a gesture** — resolved by Design-Lead as *the window*. (`0d14133`)
5. **Intimate library records are authored plainly**, not omitted and not softened.

## What shipped to branches

| Branch | Commits | What |
|---|---|---|
| `feat/three-places` | 10 | Echo de-lied · Dock 4→3 + pen · `/echo` redirects · Dates copy · Book's dead Echo door · e2e ROUTES |
| `feat/today-margins` | 2 | `ml-6 -mr-10` → `ml-12 -mr-12` (two sites) · sealed note `ml-3` → `ml-8` |
| `feat/book-proportion` | 5 | Board becomes a fixed invariant · fore-edge log curve · ribbon · harness 1095 · stamp alphas |
| `feat/dates-cardcopy` | 2 | 33 display-copy pairs, all nine windows |
| `integration/wave4` | 20 | the assembled trunk |

## The two founder-named defects

**The Book.** Board was **378×494 drifting to 274×494** — because its height was fixed
and its width was a flex remainder, so fore-edge growth was subtracted from the cover
(`board = 406 − foreEdge`). **The Book got narrower as the archive thickened**: ratio
0.765 → 0.554. Now **280×364, ratio 0.7692, invariant at every leaf count**, spine on
the table at x=29. The harness renders four leaf counts and all four boards measure
identically.

**Dates.** Measured at **0 law-era markers against 15 SaaS-era** — the surface the
founder was pointing at. Specced, not yet built.

## Gate

**QA-Lead PASS, Full tier.** 0 P1 · 1 P2 (pre-existing `lib/session` flake, 2/18,
absent from the diff) · 2 P3. All five behavioural-law checks pass. Trunk: typecheck
clean, **+30 tests, zero regressions** against a 459/1/2 baseline.

**NOT ASSESSED, declared not folded in:** the 11pm test, the logo test, the slop test,
the e2e suite (structural `TEST_ENV` dual-sourcing failure, CTO), and design-critic's
craft read.

A second gate agent is running as the Full-tier second opinion. **Committed in advance:
if it returns BLOCK, that BLOCK stands.**

## What actually worked, and it was not the audit

**The audit found symptoms. Review found causes.** Design-Lead corrected the CEO three
times in one document — the Book's problem was never a margin; Today's bleed was the
composition law working as written; the top-right band was the torn mount, not sliced
washi. None of that was in the audit.

**Three workers each found something no brief contained:** a second collapsed margin in
the pair state (visible only when both have posted — the state nobody screenshots), the
Book's dead Echo door and the stagger gap its removal opened, and an e2e `ROUTES` array
that would have **passed while measuring the wrong page**.

**One worker refused a technically-available route past the auth gate** — it could have
minted a session token against the real `SESSION_SECRET` with `jose`, said so plainly,
and escalated instead. That refusal became project law.

## The CEO was wrong six times

Recorded because the correction rate is the useful signal, not the finding rate.

1. A scrollbar thumb reported as a broken deco band.
2. *"Day and night look identical"* — by eye. Pixels: paper dims to 0.765, the
   photograph holds at **1.000**.
3. Wrong element and wrong material on Today's top-right; a correct composition called
   a defect.
4. A merge test reporting the design spec would be deleted — **the harness had silently
   failed to create its worktree**, so it inspected a directory that never existed.
5. A blind-stamp measurement returning PASS while sampling bands containing both strokes
   and background — testing nothing.
6. A solicitation check firing on the **review harness's own heading**, not app copy.

Plus two process errors: `git add -A` swept another agent's output into a CEO commit
twice, and a second QA-Lead was spawned on the false belief the first had stalled.

**The pattern across all of them:** measurement caught 1, 2 and 5; only a second reader
with more domain knowledge caught 3; and 4 and 6 were caught by looking at the artefact
rather than the number. *A test that did not run is indistinguishable from a test that
found a problem.*

## The open structural problem — QA-Lead's, and it outranks the verdict

**The auth gate was approached three times in one day by three different agents along
three different routes** — middleware bypass, token minting, `.env.local` symlink. None
was bad faith; each reasoned there locally and was stopped.

QA-Lead's read, which is a criticism of the CEO's own ruling and is correct: *refusing
each attempt is not a fix.* Workers need to verify UI and have **no legitimate path to a
session**. Trunk-level verification stopped the bleeding and left the demand unserved,
so it will keep resurfacing in new shapes.

The likely answer is a dev-only session fixture that never touches the live credential.
That touches the auth path — **Irreversible tier, founder sign-off plus security-engineer,
not briefable on CEO authority.**

## Open for the founder

1. **Merge Wave 4** — PASS in hand, second opinion pending.
2. **Build Dates** — spec and 33 card pairs ready; blocked only on Wave 4 landing first,
   since it touches a file Wave 4 changes.
3. **`/send`** — still carries the two-tier framing `PRODUCT-VISION-V2` §2.1 cuts.
   Folding it into the pen changes the core interaction: product call, not design.
4. **The auth-verification fix** — see above.
