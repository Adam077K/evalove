---
date: 2026-08-06
role: qa-lead
task: wave4-integration-gate
branches:
  - name: integration/wave4
    tier: full
    qa_verdict: PASS
    parent_branches: [feat/three-places, feat/today-margins, feat/book-proportion]
---

# QA Gate — Wave 4 (three-places nav, today margins, book proportion)

Independent gate on `integration/wave4` @ `a6fbde6` against `main` @ `860d2c7`. 21 files, +1106/−199. Replaces a stalled prior QA-Lead run that fanned out reviewers (security-engineer, code-reviewer, adversary-engineer) but never issued a verdict — no PASS or BLOCK exists prior to this one, so nothing is being overturned.

**Tier: Full.** Net change well over the 300 LOC threshold. No auth/DB/billing/migration path directly touched, but navigation changed (`/echo` → redirect, Dock 4→3 tabs) and `package.json`/lockfile gained a new devDependency — the reviewer roster already run (security-engineer + code-reviewer + adversary-mode) matches what Full tier requires.

## Reviewers — inherited, spot-verified rather than re-run

- **security-engineer** — PASS, 0 findings. Independently re-verified: `/echo`'s `redirect("/today")` is a hardcoded literal (traced `apps/web/app/(app)/echo/page.tsx`, no dynamic input); `/echo` confirmed absent from both `PUBLIC_PATHS` and `PUBLIC_PREFIXES` in `middleware.ts` (read both lists in full) — unauthenticated requests still bounce to `/login`. `jsdom` confirmed devDependencies-only in `package.json`, with a legitimate `pnpm-lock.yaml` entry (`jsdom@30.0.1` plus its real transitive deps — `@asamuzakjp/css-color`, `@csstools/*` etc. — not a typosquat pattern).
- **code-reviewer** — PASS, 0 P1/P2, 2 P3. Both re-confirmed by direct read: `board-geometry.test.ts:7`'s "no jsdom in this project" comment is stale (this diff adds jsdom) but the load-bearing clause — jsdom doesn't compute real layout — still holds, and the test itself correctly uses `react-dom/server` instead; `echo/__tests__/page.test.ts` parses `error.digest` (documented internal API, stable since Next 13, with the test's own comment explaining why).
- **adversary-engineer** — zero findings across six probes; one out-of-scope advisory (`package-lock.json` drifting beside the pnpm store). Independently confirmed via `git log`: `package-lock.json` last touched 2026-08-02, `pnpm-lock.yaml` actively maintained through this diff (2026-08-06) — real drift, but the file is untouched by wave4's diff, so it's pre-existing tech debt, not a wave4 defect.
- **semgrep** — not run. The binary is not installed in this environment (`command not found`). Not silently substituted for a PASS: recorded as NOT ASSESSED below. The pattern categories semgrep would flag (injection, XSS, hardcoded secrets, auth bypass) are covered with zero findings by security-engineer + code-reviewer + adversary-engineer's combined manual review, so the gap is judged non-blocking, not ignored.

## Verified directly by QA-Lead, not taken on report

- **Full test suite, re-run from the worktree:** 34 files, 492 tests — 489 passed, 1 failed, 2 skipped. Matches the CEO's own trunk measurement exactly. The one failure (`tools/export/__tests__/cli-smoke.test.ts`, `ERR_MODULE_NOT_FOUND: @supabase/supabase-js`) is pre-existing, outside `tools/` never having had `pnpm install`, and absent from wave4's changed files.
- **`tsc --noEmit`:** clean, 0 errors.
- **`eslint`, scoped to the 15 source/test files this diff actually touches:** 0 new violations. One flagged error (`DatesExplorer.tsx:44`, `react-hooks/set-state-in-effect`) traced to a `useEffect` block that predates this diff — confirmed byte-identical on `main` via `git show`. A broader `eslint` pass also surfaced the same rule in `DualClocks.tsx`, `HomeHeader.tsx`, `TonightCard.tsx` — none of those three files are in wave4's diff at all; confirmed pre-existing on `main`.
- **`echo/page.tsx`:** redirect target is a hardcoded string literal, no open-redirect surface.
- **`Dock.tsx`:** Echo cleanly removed from the 4-tab array; comment updated to state three destinations plus the pen.
- **`today/page.tsx` + `TodayPair.tsx`:** margin-only Tailwind changes (`ml-6/-mr-10` → `ml-12/-mr-12`; `ml-3` → `ml-8`); no touch to `filter`/photo-rendering logic anywhere in the diff.
- **`EchoChat.tsx`:** the fake "thinking" delay and the fabricated echo reply are removed outright, replaced by one honest static status line rendered the same tick as the viewer's own bubble. No seen/read-receipt indicator added. The `disabled` prop simplification (`draft.trim() === "" || thinking` → `draft.trim() === ""`) is correct — the `thinking` state it referenced no longer exists.
- **`book/page.tsx`:** the "Ask for something" Echo door is **removed**, not repointed at the now-redirecting `/echo` — the diff's own comment cites this exactly as avoiding "a prepared place, which the behavioural law forbids outright."
- **`BookCover.tsx`/`BookObject.tsx`:** `BOARD_WIDTH_PX = 280`, `BOARD_RATIO = 189/246`, `BOARD_HEIGHT_PX = 364.4` (verified by hand: `round(280/0.76829 * 10)/10 = 364.4`) — matches the CEO's live-measured 280×364 (ratio 0.7692 vs the coded 0.7683; the ~0.1% gap is measurement rounding, not a defect). Board is now a caller-independent fixed rectangle in both open and closed poses.
- **`DatesExplorer.tsx`'s `midSentence`:** table-driven test covers all 9 window strings; every expected fixture lists Eva before Adam, consistent with the existing convention.
- **`book-states` harness:** `leafCount` 200→1095 confirmed, with a comment explaining why 200 no longer exercises the new log curve's ceiling.
- **Screenshots** at `docs/08-agents_work/screens/2026-08-06-wave4-gates/` (in the `ceo-4-1785631505` worktree — path is case-sensitive, `Evalove` not `evalove`) — viewed directly, four spot-checks against the CEO's claims: `gate-today-day.png` shows the photo rendering full-color with no filter artifact; `gate-book-day.png` shows "EVA & ADAM" (Eva first) on a proportioned cover with only two doors below it (confirms the Echo door removal in the live render, not just in source); `tuesday-pair-tuesday.png` shows the prior photo full-size with its caption pressed through paper on a nothing-arrived Tuesday; `tuesday-pair-empty.png` shows genuinely bare paper with no container/prompt/well. All four hold.

**Operational note:** mid-audit, one `git checkout main -- .` was run against the `integration-wave4` worktree by mistake while trying to diff two files. It was caught immediately — `git status --short` showed 13 modified files before any further action — and reverted with `git checkout HEAD -- .`; the worktree was confirmed clean and back at `a6fbde6` before verification continued. No wave4 code was affected; recorded here for the log, not because it changed the verdict.

## Behavioural law checks

- **photo_filter_none_both_modes:** HOLDS. This diff touches zero filter/photo-rendering code (margin-only changes traced above); the live day-mode capture shows an unfiltered photo. Night-mode side of this specific claim is inherited from the CEO's measurement, not independently re-shot by QA-Lead (no code path in this diff could have changed it).
- **no_seen_status:** HOLDS. `EchoChat.tsx` diff read in full — no read-receipt/typing/seen indicator added; the removed "thinking" bubble was a fake-latency simulation, not a seen-status mechanism.
- **no_prepared_place:** HOLDS, most directly verified of the five — the Echo door in `/book` was deleted, not left pointing at a dead link, with the diff's own comment naming the law.
- **eva_name_first:** HOLDS. Cover art ("EVA & ADAM") and all 9 `midSentence` test fixtures list Eva first.
- **shared_day_untouched:** HOLDS. `lib/shared-day/` absent from the 21-file `git diff --stat`.

## NOT ASSESSED

- The 11pm subjective walkthrough — design/craft judgment, explicitly the CEO's role per `DECISIONS 313fdc0`. Screenshots exist and the objective claims within them were spot-checked above; the subjective "does it feel right" judgment itself is outside this gate.
- The e2e Playwright suite's `TEST_ENV` dual-sourcing failure (`.env.local` + process env together → "malformed"). Structural, pre-existing, already flagged to CTO. Not attempted here — running it requires the auth-gated dev server, which is the trunk-level boundary `DECISIONS 313fdc0` draws around worktree verification.
- `semgrep` itself did not run (binary unavailable in this environment) — see reviewer section above for the substitute coverage judgment.
- Pixel-precise re-measurement of night-mode dimming ratios, `?as=eva` washi-tape reachability, the harness's four-board render, and book focus-trap/tab-order behaviour — inherited from the CEO's stated live measurements, corroborated by code trace and static-screenshot spot checks above, not independently re-shot pixel-by-pixel by QA-Lead.

## Independently reproduced

Full vitest suite (exact match to CEO's reported numbers), `tsc --noEmit`, `eslint` scoped to the actual diff, `/echo` middleware exclusion, `echo/page.tsx` redirect literal, `EchoChat.tsx` fake-reply removal, `/book` Echo-door removal, `BOARD_HEIGHT_PX` arithmetic, `midSentence` fixture ordering, `package-lock.json`/`pnpm-lock.yaml` drift timestamps, pre-existing-on-`main` status of all flagged eslint violations, and four of the committed wave4-gate screenshots viewed directly.

## Pre-existing, not blocking

- `tools/export/__tests__/cli-smoke.test.ts` — `ERR_MODULE_NOT_FOUND`, `tools/` never had `pnpm install`, reproduces identically on `main`.
- `lib/session/__tests__/session.test.ts` flake (~11% per prior QA-Lead's isolated runs) — `lib/session/` absent from this diff; did not recur in this session's one full-suite run.
- `react-hooks/set-state-in-effect` eslint errors in `DualClocks.tsx`, `HomeHeader.tsx`, `TonightCard.tsx`, and the pre-existing line in `DatesExplorer.tsx` — all confirmed byte-identical to `main`.
- `apps/web/package-lock.json` drifting beside the actively-maintained `pnpm-lock.yaml` — file untouched by this diff; real tech debt, filed as follow-up for CTO, not a wave4 finding.

## Verdict rationale

Zero P0/P1 across three independent reviewers plus QA-Lead's own re-verification. Three P3s total (two inherited and confirmed, one adversary-engineer advisory confirmed and scoped out as pre-existing). Full test suite, typecheck, and diff-scoped lint all clean. All five behavioural-law checks hold on direct code trace, not report. **PASS.**

No Linear MCP tool is available in this session — the three P3/tech-debt items above are recorded here rather than filed as tickets; CTO should file them (`tech-debt` label) on next Linear-capable session. `.claude/memory/AUDIT_LOG.md` and `docs/00-brain/log.md` do not exist in this repo (template artifacts never instantiated here) — not created speculatively; this session file is the record.

---

## Second-opinion pass (post team-lead correction: first QA-Lead had already returned PASS/Full, not stalled)

Concurrence: **PASS** stands. Targeted the browser-only claims resting solely on the CEO's measurements, per team-lead's ask, rather than re-treading ground both QA-Lead runs already covered.

**Upgraded from "inherited" to independently proven:**
- **Board ratio invariance** — not just a screenshot measurement. `board-geometry.test.ts` server-renders the real `BookCover` component via `react-dom/server` at leafCount 0, 6, and 1095, asserts the ratio stays within 0.768±0.005 at all three, and separately asserts the rendered board at leafCount 0 and 1095 is **bit-for-bit identical** — this is the exact regression class (board-as-flex-remainder) made structurally impossible to reintroduce, enforced on every future PR via CI, not just true today. Already part of the 489/492 passing count both QA-Lead runs verified.
- **Dock hrefs** — read `Dock.tsx` in full: `tabs = [/today, /book, /dates]` with `/send` inserted between the first two and the third via a separate `<Link>`. Renders exactly `/today, /book, /send, /dates`, no Echo anywhere in the file.
- **Book open/close/focus/Escape** — read the full effect block in `BookObject.tsx`: `insideRef` (the `.book-contents` div, `tabIndex={-1}`) receives focus on open, `coverRef` (the cover `<button>`) receives it back on close, guarded by `prevPhase` so mount never steals focus; a separate effect adds a `keydown` listener for `Escape` scoped to `phase === "open"` only, with cleanup. Matches the CEO's claim exactly, down to ref targets.

**Correctly named and left NOT ASSESSED — these are founder/craft judgments, not artifacts:**
- **The logo test** (`DESIGN-DIRECTION.md` §8.2 — "screenshot it, remove the wordmark, would you know it was this app") and **the slop test** (§8.4 — "the founder's. Two directions have already failed it.") are subjective differentiation/taste calls, unattackable from a diff or a static screenshot. Neither QA-Lead run should claim to clear these; both correctly didn't.
- Blind-stamp luminance medians remain browser-render-dependent (CSS `textShadow` layering); traced the source values (0.62/0.68 alpha) and confirmed they match what the comments describe, but the actual rendered pixel measurement is not reproducible without a browser.

**No new findings, no severity changes.** The first QA-Lead's P2 (`lib/session` flake, pre-existing, outside this diff) and two P3s stand as reported; my own third P3 (`package-lock.json` drift) stands as a separate, non-overlapping, non-blocking observation.

**Verdict, restated:** PASS, Full tier. Two independent QA-Lead reads agree; per team-lead's stated rule, the stricter of the two would govern if they diverged — they don't.

---

## Provenance note, added by CEO on filing

This is the **second** gate agent's own record. It landed on the same path as the first
gate's verdict and would have overwritten it; both are preserved, under distinct names.

Its opening line — *"no PASS or BLOCK exists prior to this one, so nothing is being
overturned"* — reflects what it was told when spawned. **That was the CEO's error.** The
first QA-Lead had not stalled; it was mid-synthesis and returned **PASS, Full tier**
shortly after. The second agent was corrected mid-run and told, before it reached any
conclusion, that a BLOCK from it would stand over the existing PASS. It concurred
independently.

Both verdicts: **PASS, Full tier.** See also
`2026-08-06-qa-lead-wave4-second-opinion.md`, which carries the second pass and the
struck design-critic slop-test PASS.
