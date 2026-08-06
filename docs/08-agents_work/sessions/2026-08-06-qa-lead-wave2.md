---
date: 2026-08-06
role: qa-lead
task: wave2-qa-gate
branches:
  - name: feat/the-book
    tier: full
    qa_verdict: PASS
---

# QA Gate — Wave 2 (The Book)

## feat/the-book — PASS

Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/the-book`, 9 commits ahead of `main` (rebased, carries the Wave 1 hydration/build fix). Tier: Full.

**Reviewers:** code-reviewer (PASS, 0 P1, 2 P2 — review-harness isolation and the days rail, 4 P3 — minor). QA-Lead did extensive independent, hands-on verification of the branch's own three self-reported risk areas rather than accepting the worker's report, per the standing rule on this project that a fix verified only by the agent that wrote it is the weakest link.

**The worker's own report (`docs/08-agents_work/sessions/2026-08-06-frontend-engineer-wave2-book-finish.md`) is unusually honest** — it volunteers its own scope limits (the turn is a rigid CSS leaf with hinge shading, not a mesh curl; captures were taken mid-drag, not held) rather than overclaiming. QA-Lead closed those gaps directly:

### 1. The page turn — verified with a live held-touch test, not screenshots

Started the dev server, minted a real session cookie (reusing `e2e/test-session.ts`'s `mintSessionCookie`/`TEST_ENV`), and drove a genuine held CDP touch sequence against `/book/days` — `touchStart` → `touchMove` (past Chromium's touch-slop) → **read live computed style while still held, no `touchEnd` dispatched** → `touchMove` further → read again → only then `touchEnd`.

Results: resting transform `matrix(1,0,0,1,0,0)` (identity) → mid-hold `matrix3d(0.984, 0, -0.178, ...)` (~10.2° rotateY) at `scrollLeft: 135` → further-held `matrix3d(0.971, 0, -0.238, ...)` (~13.7°) at `scrollLeft: 195` → post-release settle near the 24° cap. The `.leaf-sheen` opacity read `0.45` mid-hold — a value strictly between its keyframe endpoints, confirming it tracks scroll position simultaneously with the leaf tilt. This is the mechanism actually working, live, while a touch is down and not released — a stronger confirmation than the worker's own mid-drag screenshots, and it directly answers the brief's "verify with a held touch, finger down and not lifted."

Confirmed in source: `animation-timeline: view(inline)` (globals.css §8b) is pure CSS, no JS pointer handler, no rAF loop — consistent with architecture §8.1 ("scroll IS the gesture"). `prefers-reduced-motion` removes it via the pre-existing universal `*, *::before, *::after { animation: none !important }` rule (confirmed present, and applies to `.leaf-turn`/`.leaf-sheen` since neither is excluded). Also confirmed: the standard Playwright e2e suite runs with `contextOptions: { reducedMotion: "reduce" }`, so it structurally cannot and does not exercise this animation at all — the worker's manual CDP verification (and QA-Lead's held-touch reproduction) is the *only* verification this behavior has ever received.

### 2. `days_rail_slot_width` (`w-[88%]` → `w-full`) — confirmed a real law fix, not a regression

Read the diff and the reasoning directly: an 88% slot inside `px-5` snap-centering can never land at true center, producing a permanent −3.7° resting tilt on the open page — violates "paper at rest lies flat." `w-full` fixes it at the cost of the next leaf no longer peeking at rest (it waits just offscreen instead). Judged: the trade is correct — a permanently crooked open book is a worse defect than a peek that was never load-bearing to begin with.

### 3. Ribbon reproducibility — verified by actually regenerating the shipped asset from source, not by trusting the tool's docstring

The concern: `book_standins.py`'s `clean_shipped_ribbon()` reads from `docs/08-agents_work/screens/2026-08-04-assets/keyed/book-ribbon-burgundy.png`, which is **gitignored** (`.gitignore:39`, `docs/08-agents_work/screens/*/keyed/`) — a shipped asset regenerable only from a tracked-but-intermediate path would be exactly the landmine the brief warned about. Traced the full chain: the true raw source, `docs/08-agents_work/screens/2026-08-04-assets/book-ribbon-burgundy.png`, **is** tracked in git (confirmed via `git ls-files`); the gitignored `keyed/` directory is a regenerable intermediate, which is the correct pattern.

Reproduced it directly: deleted the existing keyed intermediate, re-ran `key_assets.py` against the tracked raw source (deterministic — pure numpy/PIL/scipy thresholding and connected-components, no randomness), re-ran `clean_shipped_ribbon()` against the fresh output, and diffed the regenerated `apps/web/public/materials/book-ribbon.webp` against a backup of the originally-shipped file pixel-by-pixel: **max abs diff 0 across all channels — bit-for-bit identical.** Also confirmed `clean_ribbon`'s three-rule order (band-crop → saturation-based white/grey kill → blob-drop) is genuinely colour-kills-before-blob-drop, matching the documented rationale (blob-dropping first would miss junk the semi-opaque cloud still bridges to the strip). Cleanup: restored the one tracked file my test run incidentally modified (`keying-report.json`, via `git checkout`); worktree left clean.

### Non-negotiables — verified explicitly, each traced or measured, not asserted

- **The Book is always PAPER, never the city sky, never a dark flat canvas at night.** `BookCover.tsx`, `BookSheet.tsx`, `book/page.tsx` use only the pre-existing PAPER-world lamp tokens (`--lamp-dim`, `--lamp-brightness-drop`, `--lamp-sepia-saturation`, `.under-lamp`) — no `--night-sky`, no deco/city tokens anywhere in this diff. Quantitatively confirmed via pixel sampling on `states-day-s-cover-now.png` vs `states-night-s-cover-now.png`: cloth cover RGB (136.6,132.1,90.4) → (105.6,100.0,70.7), background RGB (247.3,244.3,240.3) → (185.4,176.3,161.3) — both genuine ~23-25% warm dims consistent with the established §9.3 lamp system, and both stay firmly warm (R>G>B) with no shift toward the cool navy of `--night-sky` (#0D1220). PASS.
- **Photographs never dimmed, tinted or washed, including mid-turn.** `.leaf-sheen` is a sibling painted *before* the content wrapper in DOM order inside `BookSheet` (both positioned, neither z-indexed — DOM order determines paint order), so it sits below every mounted photograph, never over it — confirmed by tracing the component, not assumed from the comment. Curl-drag screenshots (`curl-held-3-dx210.png`, `curl-night-drag.png`) show polaroid photographs at full, undimmed strength in both day and night mid-turn captures. PASS.
- **No day-count anywhere.** Explicit in-code assertion (`book/page.tsx`: "No count on this page — nothing calls completeDays() or renders a number of days") — this directly closes a violation recorded in `.claude/memory/DECISIONS.md` (2026-08-03 entry, "book/page.tsx:54 counts completeDays()... renders 'N days, kept'"). `leafCount()` feeds only the fore-edge's pixel width, never rendered as text. PASS.
- **No "seen" status anywhere.** Grep swept `book/page.tsx`, `book/days/page.tsx`, and every `components/book/*.tsx` / `Spread.tsx` for seen/read/delivered-status patterns — none found. PASS.
- **`whatCameBack` still wired.** `book/page.tsx` imports it from `lib/resurface` and calls it live: `const returned = whatCameBack(new Date())`. PASS.
- **`lib/shared-day/` untouched.** Absent from the 48-file diff (confirmed via `git diff --stat`). PASS.
- **Book photos ±8°, Today's ±5°, not unified.** Confirmed in the (unmodified) `Mounted.tsx` primitive: `ROTATION_RANGE = { "today-hero": [-5,5], "book-photo": [-8,8], note: [-5,5], tape: [-5,5], ... }`. Both `ResurfacedItem.tsx` and `Spread.tsx` pass `context="book-photo"` to every `<Mounted>` photograph. PASS.
- **`<Mounted>` seeds from stable id.** `<Mounted id={photo.id} context="book-photo" ...>` in both `ResurfacedItem.tsx` and `Spread.tsx`'s `MountedFigure`; the primitive's rotation `useMemo` deps are `[id, context]`. PASS.

**Bonus finding, not requested but worth recording:** `Spread.tsx`'s previously-existing "prepared place" (an empty plate with a live clock, waiting for the other person to post) has been **removed** in this diff — the old `live` half-day state now renders identically to a closed single-photo day. This is a genuine fix, not a regression: a waiting-shaped empty state is exactly what design law §0 ("no slot, no prepared place, no plus-in-a-well") prohibits, and this branch closes a gap that predates it rather than introducing one.

**Independently re-run:**
- `tsc --noEmit`: exit 0, zero errors (branch is rebased onto the toolchain fix).
- `vitest run`: 461 passed, 1 failed — the same pre-existing, unrelated `tools/export/__tests__/cli-smoke.test.ts` failure (`ERR_MODULE_NOT_FOUND: @supabase/supabase-js`) seen identically on `main` and every other branch gated this cycle.
- `eslint .`: **31 problems, 7 errors** — confirmed to match exactly the 7 files/lines the brief named (`react-hooks/set-state-in-effect` in `LoginForm.tsx:43`, `DatesExplorer.tsx:30`, `DualClocks.tsx:62`, `HomeHeader.tsx:24`, `TonightCard.tsx:20`, `viewer.ts:37`; `prefer-const` in `uploader.ts:118`) — none of these seven files appear anywhere in this branch's 48-file diff. Confirmed pre-existing and unrelated; not weighed against this verdict.

**Scope note carried forward, not re-litigated:** the founder has since found the Book cannot be opened at all in the live product. That is a real, separate gap being fixed on another branch — it is not a defect in this branch's code, and this verdict judges what this diff actually contains, not the surrounding product's current reachability.

**Verdict: PASS.** Zero P1/P2 blocking findings across code-reviewer and QA-Lead's own direct verification of every claim the worker itself flagged as its weakest points. Two P2s and four P3s from code-reviewer filed as follow-up tech-debt (exact text pending — code-reviewer sub-agent's full report was still resolving at write time; team-lead relayed the summary verdict and counts, which are recorded here faithfully as relayed, not independently re-read verbatim by QA-Lead).

---

## feat/deco-and-tray — PASS

Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/deco-tray`, 7 commits off `main`. Tier: Full (touches Today, the dock, `globals.css`, `layout.tsx`, the material library). QA-Lead did full direct verification of all four flagged risk areas — no sub-agent spawned, given the narrow, well-scoped nature of the four specific asks and time pressure; general diff reading covered the rest.

### 1. `--dock-offset` deletion — confirmed zero stragglers, repo-wide

Grepped the entire `apps/web` tree for `dock-offset` and `dock-footprint` together, not just the two files team-lead flagged. Every remaining `dock-offset` occurrence (`app/layout.tsx`, `components/chrome/Dock.tsx`) is inside a prose comment explicitly documenting its removal ("there is no `--dock-offset` any more") — zero live `var(--dock-offset)` references anywhere. Every actual consumer is correctly on `--dock-footprint`: `app/(app)/layout.tsx`, `today/page.tsx`, `review/book-states/page.tsx`, `book/page.tsx` (all three of its uses), `PocketGate.tsx`, `TodayDoorway.tsx`, `EchoChat.tsx` (both its layout and its sticky composer bar), and even `e2e/lock-resting.spec.ts`. `--dock-footprint` itself is now defined directly (`calc(3.75rem + max(0.5rem, env(safe-area-inset-bottom)))`) with no reference back to the deleted variable. PASS — no stragglers found.

### 2. `key_assets.py`'s ground-colour keying mode — confirmed backward-compatible, empirically, not just by reading the diff

Read the change first: `BG` defaults to `None` at module scope; when `None`, every code path (`near_white`, the `cov` unpremultiply target `gr`) takes the exact original white-luminance branch, unchanged. In `run()`, `BG`/`TOL`/`SOLID_D` reset to the module defaults from `base` on every asset iteration unless that asset's own `OVERRIDES` entry sets `bg`, so a ground-colour override on one deco asset cannot leak into the next asset processed in the same batch. Only three new entries (`deco-skyline-nyc`, `deco-skyline-tlv`, `deco-ornament-border`) carry a `bg` override; no pre-existing `OVERRIDES` entry was touched (pure insertion, confirmed in the diff).

Then verified it empirically rather than trusting the read: pulled `main`'s copy of `key_assets.py` and the branch's copy, ran both against two representative pre-existing raw sources — `sticker-ticket-cinema.png` (has a `white:` override, exercises the override path) and `polaroid-frame-chin.png` (default white-mode, no override) — and diffed the two tools' RGBA output pixel-by-pixel: **max absolute difference 0 on both**, byte-identical. §9.7's border-connected principle is preserved in the new mode by construction (`near_white = cdist <= TOL` still feeds the same `ndimage.label` + border-reachability logic as the white path — only the distance metric changed, not the connectivity rule). PASS.

### 3. Photographs unfiltered in the new Deco band

The four new plates (`deco-nyc-shore.webp`, `deco-tlv-shore.webp`, `deco-skyline-nyc.webp`/`deco-skyline-tlv.webp` referenced via the shore crops, `deco-ornament-border.webp`, `deco-window-interior.webp`) are illustration, not photographs — every one is rendered `aria-hidden="true"` with no `.photo` class and no `<img>` carrying user content. Confirmed the `today/page.tsx` diff touches nothing else: no hero-photograph markup, no filter/opacity/blend-mode change anywhere in the diff. Screenshots (`today-day-bottom.png`) show a real photograph inside the Book-doorway teaser card at full, undimmed strength alongside the new skyline. PASS.

### 4. §9.6 correction — confirmed superseded-in-place, not deleted; scope confirmed exact

`git show 7204996 --stat`: exactly 2 files, 16 insertions, 1 deletion — matches the claim precisely, and the commit message states outright "No other §9 finding touched." Read the actual doc diff: a new `> **SUPERSEDED 2026-08-06...**` block is inserted above the original text, and the original paragraph is kept verbatim under an explicit **"Original finding (superseded, kept legible)"** label — nothing removed, both readable, diff scope confined to §9.6 only (nothing before or after touched). Cross-checked the new numbers against the actual shipped CSS: `Seam.tsx`'s `FALLOFF` gradient stops are `47% → 0.6 @ 55% → 0.9 @ 63% → 0.97 @ 74% → --night-sky @ 93%`, exactly matching the doc's claimed shipped values. Visual confirmation: `today-day-seam.png` shows a materially crisper transition into solid navy than Wave 1's equivalent capture, consistent with the mid-band now committing fast instead of hazing. PASS.

### Bonus/incidental finding (not requested, worth recording as a P3)

Two untracked files sit in the worktree root, `apps/web/capture.local.mjs` and `apps/web/interact.local.mjs` — the worker's own local Playwright verification harnesses, each headed "Local-only... never committed." Neither is actually covered by `.gitignore`: the root pattern is `*.local` (matches a file literally *ending* in `.local`, e.g. `foo.local`), which does not match the `name.local.ext` convention these two files use. Not a functional defect and not blocking, but "never committed" is presently true only by discipline, not by tooling — a future `git add -A` would pick them up. Filed as tech-debt: extend the gitignore pattern to `*.local.*` (or similar) if this naming convention is going to recur.

### Independently re-run

- `tsc --noEmit`: exit 0, zero errors.
- `vitest run`: 459 passed, 2 skipped (`lib/__tests__/no-client-secrets.test.ts`, conditional on a `.next` build artifact — unrelated), 1 failed — the same pre-existing `tools/export/__tests__/cli-smoke.test.ts` failure seen on every branch gated this cycle.
- `eslint .`: **35 problems, 11 errors** — matches the claim exactly. Traced all 11: 4 `react/no-unescaped-entities` in `app/(app)/review/book-states/page.tsx` (lines 137, 145) + 6 `react-hooks/set-state-in-effect` (`LoginForm.tsx`, `DatesExplorer.tsx`, `DualClocks.tsx`, `HomeHeader.tsx`, `TonightCard.tsx`, `viewer.ts`) + 1 `prefer-const` (`uploader.ts`). None of these files appear in this branch's diff. Went one step further than "trust the claim": confirmed directly against `main` at its current tip (`7f3731c`) that `book-states/page.tsx` already carries the exact unescaped-quote lines — genuinely pre-existing, not merely asserted. Not weighed against this verdict.

**Verdict: PASS.** All four self-identified risk areas hold under direct, and where practical empirical, re-verification; no stragglers, no behavior change to the shared keying tool, no photograph touched by a filter, and the law correction is transparent and scoped exactly as described.

---

## feat/book-opens — PASS

Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/book-opens`, 4 commits off `feat/the-book` (not `main`). Tier: Full. This is the branch answering the founder's direct complaint that the closed Book had no way in — team-lead drove the headline claim independently before this reached QA-Lead (tap → HTTP 200 → DOM growth → a real open page). All five specifically-flagged risk areas were independently re-verified below, several live against a running server rather than by reading code or trusting screenshots.

### 1. `Paper.tsx`'s `h-full` change — confirmed inert everywhere except the one place it's needed

Read the CSS mechanic first: the inner wrapper's `height: 100%` resolves to `auto` when its containing block (the outer Paper wrapper) itself has no explicit height — the standard "percentage height in an auto-height container computes to auto" rule. Then checked every actual call site rather than trusting the abstract claim: grepped all 7 consumers of `<Paper>` in the codebase. Six of them (`today/page.tsx`, `book/page.tsx`'s cover context, `dev/materials/page.tsx`, and all four spreads in `review/today-pair/page.tsx`) pass a `className` with no height utility at all — `h-full` is provably inert for every one of them. The seventh, `BookSheet.tsx`, is the only one that passes `className="h-full ..."` — and that's exactly the component this branch's own bookmark-positioning fix targets. Then verified empirically: booted the dev server, minted a real session cookie, and screenshotted `/today` live — no regression, layout matches the established Wave 1/2 baseline. PASS.

### 2. Three ways to close, focus round-trip — verified live, not just in code

Drove it end-to-end with Playwright against the running server (not a static read): clicked `button[aria-label="Open the book"]`, waited for `data-phase="open"`, then read `document.activeElement` directly — it was the `role="region"` div with `aria-label="The book, open"` (`insideRef`), exactly as documented. Pressed `Escape`, waited for the cover button to reappear, read `document.activeElement` again — it was `button[aria-label="Open the book"]` (`coverRef`), exactly as documented. This is a genuine, observed round-trip, not an inference from the `useEffect` source. Did not separately drive the cloth-tap and caption-line close buttons (both call the same `close()` handler already exercised via Escape, so the state-machine path is identical), and did not test keyboard Tab-order beyond the two focus endpoints. PASS on the documented behavior.

### 3. `filter` deliberately absent from the swinging flap — confirmed real constraint, not an excuse

`.cover-flap` in `globals.css` carries `transform-style: preserve-3d` (required so the front `CoverBoard` and the back endpaper, each with `backface-visibility: hidden`, occupy distinct positions in the same 3D space rather than collapsing onto one plane). Confirmed no `filter` property appears anywhere on `.cover-flap` or in the `cover-open`/`cover-close` keyframes. The claimed mechanism — a `filter` on an element forces the browser to rasterize it, which breaks `transform-style: preserve-3d` for that element's children and would make both cover faces render simultaneously or flatten to 2D — is a real, known CSS/compositing interaction, not a fabricated constraint. PASS.

### 4. Emboss legibility in day mode — confirmed visually, not assumed from the fix description

Screenshotted the closed cover in day mode live. "EVA & ADAM" reads clearly at a glance at native size. The colophon ("Begun 29 July 2026") is small by design (13px per the earlier BookCover read) but legible on a 3x crop — the impression shows a clean single lit edge and single shaded edge per stroke, not the mushy double-shadow cancellation the fix describes as the old defect. PASS.

### 5. Night directional lighting — confirmed quantitatively, and confirmed paper never drifts toward night-sky navy

Screenshotted the open book in night mode and sampled all four corners of the open page: top-left (135,127,108, lum 127.2), top-right (135,126,109, lum 126.9), bottom-left (150,139,124, **lum 140.6**), bottom-right (139,129,112, lum 130.1). Bottom-left is measurably brighter than every other corner — a real, directional falloff, not a uniform dim, and it points exactly where the design law places the lamp (lower-left). Every sampled region across this branch's screenshots (this scan, plus the closed-cover day/night pair) stayed warm — R or G channel dominant, never B-dominant — meaning no drift toward `--night-sky`'s cool navy anywhere measured. Attempted a tighter §9.2-style object-vs-table comparison (a polaroid's chin border against the bare page beside it) but could not cleanly isolate the thin, rotated, text-overlaid chin band at this resolution without risking a false reading from mis-sampled pixels (documented the attempt and the coordinate difficulty rather than reporting a number I wasn't confident in). The two structural findings above — directional lamp confirmed, warm-never-navy confirmed across every sample taken — are treated as sufficient evidence for this non-negotiable; the specific micro-comparison is left unresolved rather than asserted.

### Told not to block on, verified rather than skipped blind

- **7 pre-existing lint errors**: confirmed via `eslint .` — 31 problems, 7 errors, matching this branch's actual base (`feat/the-book`, not `main` — `feat/deco-and-tray`, based on `main` directly, shows 11 because `main`'s independent edit history to `review/book-states/page.tsx` differs from `feat/the-book`'s rewrite of the same file; both baselines are internally consistent with their own ancestor, not a discrepancy). None of the 7 error files appear in this branch's diff.
- **Session-route timing-test flake**: confirmed this branch's diff touches zero files under `apps/web/app/api` or `apps/web/lib/session` (`git diff feat/the-book..HEAD --stat` on those paths returns nothing). The worker's claim that it touched no code on that path holds; not investigated further, per the brief.
- **`paper-bone-v2.png` mirror-seam**: noted as pre-existing Wave 0 material debt per the brief, not re-litigated, not weighed against this verdict.

### Independently re-run

- `tsc --noEmit`: exit 0.
- `vitest run` (twice, for consistency): 460 passed, 2 skipped (the same `no-client-secrets` conditional skip seen on every other branch), **0 failed** — notably, the `tools/export/__tests__/cli-smoke.test.ts` failure present on every other branch gated this cycle did not reproduce here on two consecutive runs. Reported as observed, not forced to match the pattern from other branches.
- `eslint .`: 31 problems, 7 errors, as above.

**Incidental note, not part of the verdict:** the worktree contains an uncommitted, explicitly self-labeled `apps/web/middleware.ts` change ("LOCAL DEV ONLY — UNCOMMITTED. DO NOT COMMIT.") bypassing auth outside production builds — not part of this branch's git history, not introduced by QA-Lead, and irrelevant to this review since every check above used a properly minted session cookie regardless. Left in place rather than reverted, since it isn't QA-Lead's to clean up and another agent may still be using it for manual driving.

**Verdict: PASS.** All five flagged risk areas hold under direct, and where practical live/empirical, re-verification — including the two strongest checks: a real focus round-trip observed through an actual open/close cycle, and a directional-lighting claim confirmed by measuring actual pixels rather than reading a comment.
