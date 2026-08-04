---
role: qa-lead
date: 2026-08-02
branch: feat/design-foundation
head: 27b0237
reviewed_commits: 3e002ef (full review) + 27b0237 (delta review)
base: ceo-4-1785631505
risk_tier: full
verdict: PASS
---

# QA Gate — feat/design-foundation

**Status: COMPLETE — PASS.** No P1. Two P2 and six P3 follow-ups below.
Three reviewers spawned, all three returned PASS.

**Two post-verdict corrections, neither reversing the PASS:** a false premise in
my P2 reasoning (the branch was never pushed — Section 5, P2 item 1), and a
standing repo-wide finding about silently-skipping security tests that I should
have caught before signing (Section 6).

## 1. Risk tier — FULL

- 1,165 lines of non-doc change across 24 files. CLAUDE.md sets Full at >= 300 LOC.
- `components/auth/LoginForm.tsx` and `app/login/page.tsx` are in the auth path.
- `.claude/qa-tier-floor.yml` floors `**/components/**` at `lite` and matches no
  `**/api/**` or `**/lib/auth/**` path, so the path map alone would say Lite. The
  LOC rule governs upward. Tier may be upgraded, never downgraded.

## 2. Claims verified independently

| Claim | Result |
|---|---|
| 251 tests, 249 passed / 2 skipped | **CONFIRMED at `3e002ef`** — 14 files, 249 passed, 2 skipped, 4.17s. At `27b0237` it is **251 passed, 0 skipped**. The two are the same suite: `lib/__tests__/no-client-secrets.test.ts:198,220` are `it.skipIf(files.length === 0)`, gated on `.next/static` existing. My `next build` created it, so they ran — and passed. That is a bonus result: the built client bundle was scanned for every server-only secret and none appears. |
| Typecheck clean | **CONFIRMED.** `tsc --noEmit` exit 0, no diagnostics. Also confirmed inside `next build`: "Finished TypeScript in 2.9s". |
| Tree clean | **CONFIRMED** for tracked source. Only `docs/.../DC-foundation-review.md` is modified (another agent's file, not code). |
| `npm run lint` already broken repo-wide | **CONFIRMED, and pre-existing.** eslint 9.39.5 dies with `TypeError: Converting circular structure to JSON` inside `@eslint/eslintrc/lib/shared/config-validator.js:308` during `_loadExtendedShareableConfig` — config load, before any file is read. The branch changes no lint, TS, Next, PostCSS or package config (verified: zero matches in the changed-file list), so this state is inherited from the base, not introduced. |
| No `.env.local` committed | **CONFIRMED.** No `.env`-family file exists in branch history; the only match is `apps/web/.env.example`. Covered by `apps/web/.gitignore:29 .env*.local`. |

**Build:** `next build` reaches "✓ Compiled successfully in 3.5s" then fails at
"Collecting page data" with `EnvironmentError` — five required env vars missing.
`apps/web/lib/env.ts` is **untouched** by this diff and throws at module
evaluation by design. This is an environment gap in the worktree, not a defect
in the branch. CSS and TSX both compile.

## 3. Presentation-only claim — evidence gathered

Structural facts, all verified:

- `apps/web/lib/**` — untouched (0 files).
- `apps/web/app/api/**` — untouched (0 files).
- `lib/shared-day/` — untouched. The 109 shared-day tests and four DST
  transitions are unaffected; the whole suite passes.
- All test files — untouched (0 files). No test was weakened to make this pass.
- All config files — untouched (0 files).
- `DualClocks.tsx`: the timezone call is byte-identical —
  `splitClock(p.localTime, member.homeTimezone, now)` is unchanged context in
  the diff. `MEMBERS.map` order preserved, so Eva stays first.
  `CITY[member.slug]` and `PRESENCE_COPY[p.presence]` preserved. Markup only.
- `LoginForm.tsx`: `disabled={password === "" || pending}` preserved verbatim.
  Only `ink="eva"` -> `variant="quiet"` and a dropped `disabled:opacity-50`
  class (now handled by `pill-ink`). No change to how the password is read.
- `PillButton`: public API changed `ink: MemberSlug` -> `variant?: "ink"|"quiet"`.
  `style` is no longer destructured but still reaches the element through
  `{...rest}`, so no prop is dropped. Any surviving `ink=` call site would be a
  type error, and tsc is clean — so the sweep is complete.
- **No orphaned design tokens.** 40 CSS custom properties were removed
  (`--glass*`, `--grad-*`, `--glow-*`, `--eva*`, `--adam*`, `--us*`,
  `--on-accent`, `--photo-dim`...). Cross-checking every `var(--x)` reference at
  HEAD across `globals.css` and all `.ts`/`.tsx` against every definition at
  HEAD leaves zero orphans. The only undefined references are
  `--dock-footprint` / `--dock-offset` (set in `app/layout.tsx:58`), `--i`
  (set inline in `home/page.tsx:34`), and `--foreground` / `--secondary`
  (pre-existing shadcn leftovers in `components/ui/button.tsx`, present
  identically in the base). Tailwind utilities for removed theme keys
  (`text-us-deep`, `bg-eva-soft`, `glass`, `shadow-glow-*`) have zero remaining
  call sites. This was the highest silent-failure risk in a token sweep and it
  is clean.
- No new `dangerouslySetInnerHTML`, `eval`, `new Function`, or dynamic
  `import()`. No new external URL, `@import`, or `url(http...)`.
- `?mode=day|night` -> `data-mode` is **pre-existing** (identical in the base at
  `app/layout.tsx:30-34`) and is allowlisted:
  `if (m === "night" || m === "day")` before assignment. Not an injection surface.

## 4. Reviewer findings

### security-engineer — PASS
- **P2** `apps/web/.shots.mjs` (deleted at tip, line 6): plaintext literal
  `const PASSWORD = "<redacted>";`. A working credential against the
  developer's local instance, permanently retrievable from branch history.

  > **RESOLVED after this verdict was written, and the reasoning that
  > downgraded it was wrong.** This was rated P2 partly because "the commit
  > is already pushed: blocking would not remove one bit of exposure."
  > `git ls-remote --heads origin` returns no `feat/design-foundation` — the
  > branch was never pushed, so the exposure was entirely local and entirely
  > removable. The blob has been purged from all 18 commits by
  > `filter-branch --index-filter`; `git log --full-history` for that path is
  > now empty and the final tree hash is unchanged.
  >
  > The literal is redacted *in this document* as well, by design-lead, and
  > flagged in the merge report: a finding that a credential was committed
  > should not itself commit the credential. Nothing else in this verdict was
  > altered — tier, verdicts and every other finding stand as written.
  Rated P2 not P1 because no hash, key or env file was ever committed, the repo
  is private, and the string is already pushed — blocking the merge does not
  mitigate it.
- **P3** 44 PNGs / ~44 MB permanent clone weight.
- Auth path confirmed cosmetic **line by line**: `disabled={password === "" || pending}`
  and `if (pending || password === "") return;` are byte-identical to base;
  `disabled` still reaches the DOM through `{...rest}`; disabled styling merely
  relocated into `pill-ink`/`pill-quiet` `&:disabled`; input keeps
  `type="password"` + `autoComplete="current-password"`; no new user-vs-password
  oracle; password still cleared on success and failure; no credential logging.
  `PocketGate` guard intact. The `next` open-redirect defence untouched.
- Screenshot PII cleared with a concrete basis: fixtures generate photos from
  `picsum.photos` stock seeds, members are synthetic, the session is an httpOnly
  cookie that never renders, and Playwright captures the page not browser chrome.

### adversary-engineer — PASS (3 × P3, no access-control change)
- **No sealed-content leak.** Confirms my own read: the opened branch only
  mounts after the click, so the `mode="wait"` -> `mode="popLayout"` change
  cannot expose the note pre-open.
- `?mode=` is exact-match allowlisted on a two-value set; not an injection surface.
- No CSS exfiltration primitive: the only `@import` is `"tailwindcss"`; zero
  `url()`, zero `content:`, zero `attr()`, no value-prefix attribute selector.
- No new overlay: the diff *deletes* a `position: fixed` layer (`.aurora-layer`);
  `.noise-layer` keeps `pointer-events: none`. No destructive action moved under
  a thumb.
- Focus rings survive because `:focus-visible` is declared **unlayered** in
  `globals.css:385` and so beats Tailwind's layered `outline-none`.
- Pre-existing, out of scope, flagged for a later pass: `?as=` at
  `lib/viewer.ts:32` switches which member the client believes is holding the
  phone; `FIXTURE_NOTE` is a client-bundle constant; no `referrerPolicy` on
  photos before real signed URLs land.

### code-reviewer — PASS (`presentation_only_confirmed: true`, `behaviour_changes_found: []`)
First run was cut off mid-work with no verdict and was re-run on a tighter
scope; the re-run completed. Reviewed the 11 mid-size components at -U6/-U8.
- **P3** `PocketGate.tsx:20` — `const { member } = useViewer();` is now dead;
  its only consumer was the removed `ink={member.slug}` prop. Inert subscription,
  but misleading and would trip `noUnusedLocals`.
- **P3** `Field.tsx:40` — `aria-invalid={error ? true : undefined}` is set
  *before* `{...inputProps}`, so a caller passing `aria-invalid` could silently
  suppress the red border while error text still renders. Latent; no current
  caller does it.
- Verified byte-identical: every `disabled={...}` expression (EchoChat
  `draft.trim() === "" || thinking`; QuickSend `note.trim() === "" && !photoUrl`;
  PocketGate `phrase.trim() === "" || checking`); every guard and early-return
  order (EchoChat, TonightCard + its `useEffect` and empty dep array,
  DatesExplorer, QuickSend `StateDot`, Spread's three-state model); every
  `type="submit"`, `role`, `aria-*` and list key; every data selector and
  argument order (`memberById`, `nextWriter`, `currentWindow`, `partnerOf`);
  `URL.revokeObjectURL` still fires before `setPhotoUrl(null)`.

### The adversary's Field.tsx finding was correct — and I initially got this wrong

I first called it a false alarm. That call was wrong: I read `globals.css` at
the working tree after the branch tip had moved under me, so I was looking at
the fix rather than at the code under review. Correcting the record:

**At `3e002ef` the adversary was right.** `Field.tsx:44` read
`error ? "border-danger" : ""`, and `git show 3e002ef:apps/web/app/globals.css`
contains **zero** occurrences of `aria-invalid`. So `border-danger` and `.well`
were both utilities-layer rules at equal specificity and the winner depended on
Tailwind's emission order. It ordered in `.well`'s favour. The implementer then
measured it: a wrong password computed `rgba(37,29,22,0.1)` — **no red at all,
in either mode**. Since `prefers-reduced-motion` strips `animation` outright and
takes the shake with it, a reduced-motion user got the error text and no other
signal. That is a real P2 regression in the auth path, and it was found by
adversary review rather than by tests, typecheck, or my own structural checks.

**Fixed at `27b0237`, and the fix is correct.** The rule moved to
`globals.css:591`: `input[aria-invalid="true"], textarea[aria-invalid="true"]
{ border-color: var(--danger) }`, at (0,1,1) against `.well`'s (0,1,0) — it wins
on specificity, with no `!important` and no dependence on build order. `--danger`
is defined in both modes (`#9e2f2b` day, `#ea9189` night at a documented 7.33:1).
`Field.tsx` drops the class in favour of the attribute. I verified the
implementer's claim rather than taking it: the rule is absent at `3e002ef` and
present at `27b0237`, and the specificity arithmetic holds.

### Delta review — `3e002ef..27b0237`

The tip moved while I was reviewing, so I reviewed the new commit rather than
assuming the fix was correct. It touches two code files: `globals.css` (+28, of
which 24 are comment) and `Field.tsx` (-1 / +6, a class replaced by a comment).
Both are the fix described above. Nothing else in the code changed. Re-ran at
the new tip: **251 passed (251), 0 skipped**, typecheck clean.

The commit also swept my own in-progress verdict file into the branch. Harmless
here, but the gate's working file is not the implementer's to commit.

## 5. Verdict — **PASS**

Presentation-only is **confirmed**, by four independent routes: my own
structural checks, code-reviewer's line-by-line pass on 11 components,
security-engineer's line-by-line pass on the auth path, and adversary's
attack-oriented read. `behaviour_changes_found` is empty. Nothing in
`lib/shared-day/` moved and the 109 shared-day tests are untouched and green.

### P2 — required follow-ups, neither blocks the merge

1. **Dev password in branch history — CLOSED.** `apps/web/.shots.mjs` line 6
   held a plaintext dev password. It has since been purged from all 18 commits
   (the branch was never pushed, so the exposure was wholly local); the value is
   redacted here rather than repeated. **Founder should still confirm the real
   `APP_PASSWORD_HASH` does not verify it** — design-lead generated it as a
   throwaway for a local stub and it was never a founder credential, but the
   check costs nothing. I could not check it myself — no `.env.local` exists
   anywhere on disk, which separately confirms the local env file was cleaned
   up as claimed. Add `*.shots.mjs` to `apps/web/.gitignore` and read the
   password from an env var.

   **CORRECTION — my original reason for not blocking was false.** I wrote that
   this "does not block the merge because the commit is already pushed: blocking
   would not remove one bit of exposure." **The branch was never pushed.** I
   asserted that without checking; nobody had checked. Verified now:
   `git ls-remote --heads origin feat/design-foundation` returns nothing, and
   the remote holds only `ceo-1-1785631504`, `ceo-2-1785631504` and `main`.
   The exposure is entirely local and therefore entirely removable, so the
   credential should be purged from history in the same `--index-filter` pass
   as the screenshots — not merely accepted. The verdict is unchanged (this was
   never a P1, and a history purge is not a merge blocker), but the reason is
   the opposite of what I gave, and the better reason produces a better outcome.
   Do not inherit "already pushed, cannot be helped" as a fact about this branch.
2. **Self-certified QA verdict.** `docs/08-agents_work/sessions/2026-08-02-design-lead-design-foundation.md`
   frontmatter declares `qa_verdict: PASS`, written before any QA gate ran. The
   value happens to match my verdict, but the field is the gate's to set, not
   the implementer's. Correct it to cite this file. Flagged because
   self-certification is precisely what the gate exists to prevent.

### P3 — file as tech-debt, none blocking

3. `PocketGate.tsx:20` — dead `useViewer()` destructure.
4. `Field.tsx:40` — move `aria-invalid` after the `{...inputProps}` spread.
   **The stakes rose with `27b0237`:** `aria-invalid` is now the *sole*
   mechanism painting the error border, so a caller passing `aria-invalid`
   through `inputProps` would suppress the red edge entirely. Still latent — no
   current caller does it — but worth closing now rather than later.
5. `DualClocks.tsx` — the member name went from `<h3>` to `<p>` (diff line 861).
   Eva's and Adam's names leave the heading outline; the `<section aria-label>`
   survives, so content is still announced, but a screen-reader user loses that
   navigation stop. All five `aria-label`s and the one `role` elsewhere in the
   diff are preserved verbatim.
6. 44 PNGs, ~42 MB — 51% of the repo tree, permanent in history. There is no
   `.vercelignore` at any level, so they ride along on every deployment. Decide
   before this lands on main; afterwards the only way out is a history rewrite.
   Verified NOT reachable over HTTP (`docs/` sits outside `apps/web`, no rewrite
   serves it) and verified to contain fixture data only, not real content.
7. `home/page.tsx:214` — `--photo-dim` and the caption/cover scrims are gone, so
   private photographs now render undimmed and roughly 5x larger on the surface
   that appears immediately after login, including in the OS app-switcher
   snapshot. This is the founder-approved direction and is **not mine to
   relitigate** — but it removes the product's only incidental
   shoulder-surfing mitigation, so it should be **accepted explicitly in
   DECISIONS.md rather than by omission**.
8. Founder-visible, not a defect: `type-micro` carries `text-transform:
   uppercase`, so display names render as "EVA" / "ADAM" in `Spread`
   `PreparedPlace` and in `DateChip`.

## 6. The suite's security tests skip silently — standing finding, not about this diff

Raised by design-lead after I signed. **It is my domain and I should have had it
before signing.** I did notice the 249-vs-251 discrepancy and diagnosed the
`skipIf` correctly — but I recorded it as a *bonus result* ("the tests ran and
passed") and missed the actual defect, which is that they can silently not run.
The mechanism I described was right; the conclusion I drew from it was the
comfortable one.

**The defect.** `apps/web/lib/__tests__/no-client-secrets.test.ts:198,220` are
`it.skipIf(files.length === 0)`, keyed on `.next/static` existing. Demonstrated
both ways:

```
.next parked   -> 249 passed | 2 skipped
.next restored -> 251 passed
```

The two most security-relevant tests in the suite — the scan of the built client
bundle for leaked server-only secrets — vanish from the run when no build is
present, and the run is still green. A leak check that passes by not looking is
indistinguishable in the output from one that looked and found nothing.

It is worse than a skipped test, because of what the second test is *for*. Its
own comment says it exists as a control: "a build that inlined nothing at all
would pass a leak test trivially, and this is the control." The control is gated
on the **same condition** as the thing it controls. So at exactly the moment the
leak test is vacuous, the control that would catch its vacuity is also gone.

### Answers to the three questions

**1. Does CI build before testing? There is no CI.** Sharper than the question
assumed. `.github/` does not exist in this repo — `git ls-files | grep '^\.github/'`
returns nothing. The only workflow files on disk are inside the un-wired
`new agents-skills-workflows-system/` bundle and inside `node_modules`. So these
two tests have never run in any automated context, and locally they run only if
a `.next/static` happens to be lying around from an earlier build. **In this very
session they skipped on the first run and executed only because I ran
`next build` for an unrelated reason.** That was luck, not coverage.

Note for whoever wires CI: the bundled `qa-lead-pass.yml` template would not fix
this. It checks for a QA-Lead PASS label and session file and runs no `npm test`
and no `npm run build` at all.

**2. Should the suite fail loudly rather than skip? Yes — agreed, and this is
the fix I would require.** A missing prerequisite is not a passing condition.
Two acceptable shapes: build the bundle as a test prerequisite (a `globalSetup`
that runs `next build` when `.next/static` is absent), or keep the tests cheap
and make the absent bundle an explicit failure with a message naming the cause,
rather than a skip. Either way, delete the `skipIf` on the **control** test
first — that one has no legitimate reason to be conditional. Whatever CI is
eventually wired must run the build before the suite, or these tests are
decoration.

**3. Does it change risk-tier reasoning downstream? Not for this diff** — it
touches no secrets, no env, and no client-bundle boundary, and I verified the
bundle scan actually executed and passed for the commit I signed. **But it
changes what "tests pass" is allowed to mean for every future PR.** Standing
rule for this repo, for me and any future QA gate: *a green suite is not
evidence of secret-leak safety unless a build preceded it.* On any diff touching
`lib/env.ts`, auth, `NEXT_PUBLIC_*`, or anything that could reach the client
bundle, the gate must confirm the run was `251 passed / 0 skipped` — a
`249 / 2 skipped` result on such a diff must be treated as **unverified, not
passing**, and the gate must run the build itself before certifying.

This is a repo-wide finding, not a property of `feat/design-foundation`, and it
does not reopen the merge. It belongs to whoever wires CI.

### Out of scope, pre-existing, worth a later pass

- `?as=` at `lib/viewer.ts:32` switches which member the client believes is
  holding the phone — the more interesting of the two URL overrides for an
  insider threat. Predates this diff.
- `FIXTURE_NOTE` is a module-level constant in a `"use client"` component, so
  the sealed note ships in the JS bundle. Fixture data; resolves when
  fetch-on-open replaces it.
- `SealedCard` has no re-seal path; `opened` stays true until unmount.
- No `referrerPolicy` on photo `<img>` before real signed URLs land.
- eslint is broken repo-wide at config load. Not this branch's doing, but it
  means no lint gate is running on any PR.

### What would have lifted a BLOCK

Nothing — no BLOCK was issued. Had the `.shots.mjs` string been the live app
password, or had any guard, timezone call or `disabled` condition differed from
base, this would have been a BLOCK.
