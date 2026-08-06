---
date: 2026-08-06
role: ceo
task: trunk-verification-wave4
session: ceo-4
branch_verified: integration/wave4 (merge of three branches into main @ 860d2c7)
method: DECISIONS 313fdc0 — trunk-level browser verification, performed by CEO
qa_verdict: PENDING — qa-lead-wave4 gating; CEO cannot override a BLOCK
---

# Trunk verification — Wave 4

The first trunk-level verification performed under the rule the founder set today.
Workers cannot reach a browser from a worktree; they report `NOT DONE` honestly and
this step satisfies that dimension. **No credential moved and nothing was added to the
auth path** — the main repo was checked out detached at the trunk commit so its
pre-existing uncommitted dev bypass carried over unchanged, then restored to `main`
@ `860d2c7` with all three uncommitted entries intact.

## What was assembled

`feat/three-places` (10 commits) · `feat/today-margins` (2) · `feat/book-proportion` (6).
All three merged into `integration/wave4` **with no conflicts**. 21 files, ~1106
insertions, ~199 deletions. Deliberately **not** merged to `main` — the QA gate forbids
that without a PASS and founder confirmation.

## Static

| | Files | Tests | Failed | Passed | Skipped |
|---|---|---|---|---|---|
| Baseline (`main`) | 29 | 462 | 1 | 459 | 2 |
| **Trunk** | **34** | **492** | **1** | **489** | **2** |

Typecheck **clean**. **+30 passing tests, zero regressions.** The single failure is the
documented pre-existing `tools/export/__tests__/cli-smoke.test.ts` (`ERR_MODULE_NOT_FOUND`
— `tools/` has never had `pnpm install`). *"Four green branches can merge into a red
trunk"* did not happen this time; it was checked, not assumed.

## Browser gates — 393×852, hydration verified, viewport captures only

**PASS**

- **Board 280 × 364, ratio 0.7692, left edge 29.** Spec §5.1 wants 280 / 364±1 /
  0.768±0.005 / left 29±3. Fore-edge carries the visual right edge to ≈345.
- **Ratio invariance (§5.2 — the gate the old build failed).** The `book-states`
  harness renders **four boards, every one exactly 280 × 364**. The old build drifted
  **0.765 → 0.554** as the archive thickened, because board width was a flex remainder
  the fore-edge ate into.
- **Today (§5.4).** Torn mount left **34.2** (gate 34±4); photo right **424.6** (gate
  ≥415 — the bleed survives, as ruled); `img.photo` computes `filter: none`.
- **Blind stamp (§5.6).** Stroke interiors isolated below the cloth's own p5 of 82:
  EVA & ADAM median **67.0** sd **12.08**; colophon median **69.0** sd **9.93**. Gate:
  ≤74 and sd within [5,14]. Texture survives inside the letterform — a crushed
  impression, not flat print. The colophon is legible for the first time.
- **The object still works (§5.7).** Opens on tap; Escape closes; focus enters
  `.book-contents` and returns to the cover button; no horizontal scroll. Seven coupled
  bleed sites were rewritten and the animation survived.
- **Mode invariance.** Board holds 280 × 364 at left 29 in dark.
- **Dock.** hrefs exactly `/today, /book, /send, /dates`; no "Echo" text anywhere.
- **Overflow.** One element, `sr-only` at `clientWidth === 1` — which Design-Lead
  pre-identified as a false alarm, not a defect.

**NOT ASSESSED — declared, not folded into a pass**

- **§5.5, washi tape left edge ≥ 8.** The sealed note does not render in the current
  fixture state, so the element was absent. This is not a pass.
- The **Tuesday test** (every surface with no photograph) and the **11pm test**.
- The **e2e suite**. Beyond the auth gate, `e2e/playwright.config.ts` injects `TEST_ENV`
  and the dual-sourcing failure is structural: process-env alone boots, `.env.local`
  alone boots, **both together fail "malformed"**. Unfixed, flagged for CTO.
- Stamp numbers come from a **1× CSS-pixel capture**; the spec's were taken at **3×**.

## Found while cross-checking workers against each other

**`lib/session/__tests__/session.test.ts` is flaky — 1 failure in 13 consecutive runs
(~8%).** Pre-existing, not a regression: absent from the `main` baseline, absent from the
first trunk run, but independently reported by the `book-proportion` worker in a different
checkout. This repo carries a dormant `feat/session-test-flake` branch, so it was hit
before and never closed.

It surfaced **only because two workers' numbers disagreed and the discrepancy was chased
rather than reconciled away.** Handed to QA-Lead with an explicit warning about the
second-order risk: a known flake is the most dangerous line on a QA report, because it
becomes a blanket excuse and the next real failure in that file gets waved through wearing
its costume. That is the shape of the two standing exemptions this project voided on
2026-08-04.

## Four CEO findings corrected during this cycle

Recorded because the correction rate is the useful signal, not the finding rate.

1. A dark strip on `/today`'s right edge — **the scrollbar thumb**, 852×(852/1553)=467px
   at track bottom.
2. *"Day and night look identical"* — **wrong, by eye.** Pixels show paper dims to 0.765
   while the photograph holds at 1.000. The host browser follows the OS scheme, so the
   first "day" capture was already dark.
3. **Wrong element and wrong material** on Today's top-right, and a correct composition
   called a defect. Caught by Design-Lead.
4. A merge test reporting the design spec would be **deleted** — the harness was broken
   (`git worktree add` silently refused because `main` was already checked out), so it
   inspected a directory that never existed. Same shape as handoff §7.2: *a test that did
   not run is indistinguishable from a test that found a problem.*

A fifth was caught inside this verification: the first blind-stamp measurement returned
PASS while sampling **bands containing both strokes and background**, which tests nothing.
Isolating stroke interiors produced the real number. **A measurement that passes for the
wrong reason is worse than one that fails.**

## Restoration

Main repo returned to `main` @ `860d2c7`, uncommitted set unchanged
(`M apps/web/middleware.ts` at 18 insertions, `?? .claude/worktrees/`, `?? pnpm-lock.yaml`),
`.env.local` present. Verified against the pre-switch record field by field.
