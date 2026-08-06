# Architecture & Strategy Decisions
*Append-only. 50-entry cap — archive to `DECISIONS_ARCHIVE.md` when full.*

> Empty template. Every C-suite agent appends one entry per significant decision
> using the format below. Workers do not write here.

---

## Format

```markdown
## YYYY-MM-DD — [Decision title]

**Context:** Why this came up.
**Options considered:** A / B / C with one-line trade-offs.
**Decision:** What we chose.
**Rationale:** Why this option won.
**Reversibility:** reversible | hard-to-reverse | irreversible
**Owner:** [agent name]
**Affects:** [list of agents / domains downstream]
```

---

<!-- Entries below this line, most-recent first. -->

## 2026-08-06 — QA-Lead PASS on integration/wave4 (three-places + today-margins + book-proportion)

**Context:** Full-tier gate (21 files, +1106/-199 — auto-Full on LOC alone) on the merge of `feat/three-places`, `feat/today-margins`, `feat/book-proportion` into `integration/wave4` ahead of `main`. No API/DB/auth/billing/migration touched. `code-reviewer`, `security-engineer`, `adversary-engineer` all returned PASS/zero-blocking; QA-Lead independently reproduced `tsc` clean, the exact `vitest` count (34 files/492 tests/1 pre-existing failure/489 passed/2 skipped), `middleware.ts` gating (`/echo` absent from `PUBLIC_PATHS`/`PUBLIC_PREFIXES`, so the new redirect creates no unauthenticated path), and the `BOARD_HEIGHT_PX` arithmetic (364.4, ratio 0.76839, within spec tolerance).
**Decision:** PASS. Zero P0/P1. One P2 (`lib/session` tampered-token test flakes ~11%, reproduced independently over 18 isolated runs — confirmed pre-existing on `main`, confirmed absent from this diff, routed to a separate security-engineer follow-up per team-lead, not blocking). Two informational P3s (stale jsdom comment; internal-API test dependency, both tech-debt). One process finding, not a code defect: `design-critic` attempted to symlink `.env.local` into its worktree to reach a live server ("without reading its credentials") — stopped before execution, verified no file was left behind. This is the same class of workaround-seeking as the auth-bypass and token-minting attempts refused earlier in the project; recorded per the standing rule that a denied permission has no appeal to a peer.
**Rationale:** Behavioural-law gates this branch exists to fix (board ratio invariance across all leaf counts, no-photo-filter both modes, no-prepared-place on the removed Echo door, Eva-name-first in `midSentence()`, `lib/shared-day/` untouched) are confirmed either by QA-Lead's own hands or by specific reproducible trunk-level numbers from team-lead — not inherited on trust. NOT ASSESSED and declared honestly rather than folded in: the 11pm test, the logo test, the slop test, the e2e suite (pre-existing `TEST_ENV` dual-sourcing failure, flagged for CTO), and design-critic's own craft/taste read (its run was interrupted before landing a verdict).
**Reversibility:** reversible (merge can be reverted; no schema/migration involved)
**Owner:** qa-lead
**Affects:** CTO (route the `lib/session` flake to a dedicated security-engineer review, per team-lead's plan; file the two P3s and the `package-lock.json`/`pnpm-lock.yaml` hygiene advisory as tech-debt tickets); any future QA-Lead cycle on this project (the 11pm/logo/slop tests and a completed design-critic craft pass are still owed — they belong to the broader design-audit effort already tracked separately, not to this narrowly-scoped geometry fix).

## 2026-08-03 — Canonical workflow file ownership: archive-export-mirror OWNS nightly-archive.yml

Decision-maker: CTO. Tier: irreversible (workflow ownership determines rebase order).

**Decision:** `feat/archive-export-mirror` is the authoritative branch for
`.github/workflows/nightly-archive.yml`. apps/web here uses npm
(package-lock.json); only tools/ uses pnpm (pnpm-lock.yaml). The
pnpm/action-setup step therefore caches only `tools/pnpm-lock.yaml`.

**Merge order enforced:** archive-export-mirror merges first.
`feat/ci-floor` rebases onto archive-export-mirror's tip. ci-floor's
workflow patch carries the apps/web pnpm migration (flipping `npm ci` to
`pnpm install` there and extending cache-dependency-path with
`apps/web/pnpm-lock.yaml`) — that migration is exclusively ci-floor's scope.

**Reversibility:** irreversible (rebase ordering once established)
**Owner:** CTO, recorded by devops-engineer `devops-archive-pnpm-visibility`
**Affects:** feat/ci-floor (must rebase onto this tip before merge)

### 2026-08-03 — Fail-loud on missing keep-alive secret (delta on 837efd3)

Decision-maker: CTO (routed by CEO delta finding). Tier: irreversible (workflow).

The nightly keep-alive step's missing-secret branch was fail-open — exit 0
on "did nothing." Now exits 1. Under continue-on-error: true this renders
amber in Actions UI (archive still runs), aligning with the 5xx path which
already exit-1'd. Direct application of the DECISIONS.md rule: "A check
whose absence means 'all clear' is fail-open — require a positive artifact."

This is the sixth incidence of the fail-open class today; the previous five
are the entries above. Fixing it inside the very step built to fix the
fourth is why CEO caught it in the delta review.

## 2026-08-03 — Lockfile ownership + independent keep-alive design

**Context:** CTO brief 2026-08-03. The merge of feat/export-invocation-fix into feat/archive-export-mirror establishes tools/pnpm-lock.yaml as the canonical lockfile for the tools/ CLI. Separately, the export step's dual role as keep-alive was identified as a single point of failure: any export failure (broken invocation, empty schema, mid-refactor) silently armed the 7-day Supabase free-tier pause timer.
**Options considered:**
- A) Keep the export step as the only keep-alive (current state, brittle)
- B) Add a separate keep-alive step using the service-role key (rejected: bypasses RLS, reads every photograph, doubly pointless with empty schema)
- C) Add a separate keep-alive step using the anon key via PostgREST /rest/v1/ introspection (chosen)
**Decision (1 — lockfile):** feat/archive-export-mirror post-merge owns tools/pnpm-lock.yaml canonically. feat/ci-floor and feat/vault-encrypted-copy must rebase onto this tip before merging.
**Decision (2 — keep-alive):** The independent keep-alive step: (a) uses SUPABASE_ANON_KEY only, (b) curls /rest/v1/ to trigger PostgREST schema introspection (SQL executes on Postgres), (c) treats 2xx/4xx as activity registered, (d) logs a warning on 5xx/timeout without failing the workflow, (e) runs with if: always() positioned after the export step, (f) has continue-on-error: true.
**Open question (surfaced to founder):** Does a 5xx or timeout response to /rest/v1/ still register as activity in Supabase's internal metrics? The docs do not specify. We have not measured it. If the anon-key step returns 5xx/timeout, the activity status is UNKNOWN — the workflow logs the outcome for founder review.
**Reversibility:** irreversible (lockfile rename affects dependents; keep-alive step is additive and reversible)
**Owner:** CTO
**Affects:** feat/ci-floor (must rebase), feat/vault-encrypted-copy (must rebase), GitHub Actions (SUPABASE_ANON_KEY must be added to repo secrets)

## 2026-08-03 — Founder: nothing is ever permanently deleted, and the vault is in the automatic copy

**Context:** CTO's archive-survival packet routed two decisions to the founder rather than absorbing them: whether the private vault belongs in the nightly automatic copy to Eva's storage, and how to resolve a direct conflict between `PRODUCT-VISION-V2.md` §6 item 5 (a copy lands in storage Eva owns) and `LDR-APP-ARCHITECTURE.md` §5.7 (a permanent delete propagates everywhere within 24 hours). A copy in an account Adam does not control cannot receive his purges.
**Options considered:** For the conflict — A) survivability wins, drop the propagation promise / B) keep the promise, copy stays in Adam's account / C) both, which would ship a false UI claim.
**Decision — both founder-set:**
1. **The vault IS included in the automatic nightly copy.** CEO recommended excluding it; the founder chose inclusion. The recommendation and its risk are recorded below rather than relitigated.
2. **Nothing is ever permanently deleted. Everything stays in storage.** Founder verbatim: *"no deleting photos. keep all in storage."* This dissolves the conflict rather than trading it off — if no photograph is ever destroyed, ARCH §5.7's propagation promise has nothing to propagate and the copy in Eva's account can never fall out of sync on a delete.
**Rationale:** The founder's resolution is better than any of the three options offered. All three assumed permanent deletion existed and argued about its blast radius; removing permanent deletion removes the conflict at its root. It is also consistent with the product's own physics — vision §4.4 already says nothing is ever consumed, marked read, cleared or archived-on-open, and "the archive keeps everything" is the same rule extended to storage.
**Consequences, so the next reader does not have to derive them:**
- `purgePhoto` (`lib/data/photos.ts:527`) is never exposed by any route, and the 30-day sweep over soft-deleted rows is never wired. `original_location: 'purged'` becomes a state the system never reaches.
- B4 ships **soft delete only** — hidden from every view, fully recoverable, bytes always retained. Read as "remove from view," never "destroy." This still satisfies vision §6.4's autonomy property: either of them can take a thing out of sight without asking the other.
- The delete UI must not promise propagation, because there is no purge to propagate.
- B2's nightly job passes `--include-vault`, so B1's vault path becomes load-bearing rather than optional and must be tested as a primary path.
**The risk the founder accepted knowingly, stated once:** intimate vault content will sit in a synced third-party account, written nightly. Four independent privacy layers were built around keeping it separate — separate table, separate storage prefix, no thumbnail ever generated (migration 04), a storage trigger enforcing the split (migration 11), a second independent secret (ARCH §6.4). The nightly copy is now the one path that crosses all four. **CTO should specify the safest mechanism that still delivers what was asked** — a complete, automatic copy — rather than treating inclusion as a reason to relax handling.
**Reversibility:** decision 1 is hard-to-reverse once copies exist in a third-party account; decision 2 is reversible and cheap to hold
**Owner:** founder (both), routed by ceo, surfaced by cto
**Affects:** be-unilateral-remove (soft delete only, never destroys bytes — no behaviour change from its brief, but the rule is now permanent rather than a scope boundary), B1 export engine (vault path is primary, not optional), B2 mirror (passes `--include-vault`; specify safe handling), cto (mechanism), qa-lead (any diff exposing `purgePhoto` or wiring a sweep is an automatic BLOCK), cpo (delete UI copy must not promise propagation).

## 2026-08-03 — Ambient arrival is not available to this product. The price of "no app store" is now known, not estimated

**Context:** `PRODUCT-VISION-V2.md` §9 named one open technical question — whether iOS Safari web push can carry an **image** — and §4.5 called it "the one unverified lever worth a single check." It decides whether an arriving photograph reaches the lock screen, or whether the app can only announce that something exists and withhold it. Neither CPO nor R4 could verify it. CTO could not either (no WebSearch in its toolset), predicted "no" from model knowledge, and correctly flagged rather than asserted.
**Options considered:** A) Design arrival around a hoped-for yes / B) Verify against primary sources first / C) Leave it open and design defensively forever.
**Decision:** B, and the answer is **NO**, HIGH confidence. WebKit has never implemented `NotificationOptions.image` (caniuse: no support, Safari iOS 3.2–26.5). The Declarative Web Push payload schema carries only `web_push`, `title`, `lang`, `dir`, `body`, `navigate`, `silent`, `app_badge` — no image, no per-notification icon. APNs `attachment` is native-only and unreachable from web push. The distinction matters and was checked: the small icon that does appear is the manifest icon, not a per-notification one.
**Rationale:** Primary sources (WebKit blog for 18.4/18.5/26.0, the WebKit explainer, caniuse, the Notifications spec) all agree, and the direction of travel across five releases shows no movement. This is a hard WebKit constraint, not a workaround-shaped one. CTO's prediction was confirmed rather than assumed — worth recording, because the cheap path here was to accept the prediction and skip the check.
**Consequence, stated plainly:** P4's FATAL 1 is now **confirmed unmitigable within the PWA constraint**. Locket's mechanic — the one with proven multi-year two-person retention at n=2 — is unavailable. Every arrival costs a decision. Vision §4.5 asked that "no app store" be "priced out loud rather than absorbed silently"; this is the price, and it is no longer speculative. **The immovable is not being relitigated here** — that is the founder's call and nobody has asked to move it. What changes is that the compensation in §4.2 (open lands directly on the newest thing, full bleed, zero navigation) is now the *entire* mitigation rather than one of two, and must be built as such.
**Reversibility:** irreversible as a fact; the design response is reversible
**Owner:** ceo (routed), researcher `researcher-ios-push-image` (verified), cto (predicted)
**Affects:** design-lead (the open is the only arrival — Today must pay off instantly, zero navigation, no interstitial), cto (do not design lock-screen image delivery; the text-only dot stands, and vision §6.7 availability work matters more now that the tap is the only path in), cpo (§4.5's four listed losses are all confirmed, not three of four), founder (the priced cost of `no app store`).

## 2026-08-03 — The research outranks the build brief, on five named points

**Context:** Founder directed the build of Today and The Book against `2026-08-03-BUILD-THE-TWO-PLACES.md`, with the standing instruction to start from the research the brief points at rather than the brief itself, and to say so where they disagree. Five disagreements were found and verified against the code.
**Options considered:** A) Build the brief as written, log the gaps for later / B) Treat the research as authority on the disagreements and adjust scope now / C) Hold the wave until every gap is closed.
**Decision:** B. (1) Export + unilateral delete are a build-order rule (`PRODUCT-VISION-V2.md` §6.1), not a backlog item — they run as a parallel CTO track this wave; The Book composes against fixtures and no real photograph is imported until a tested export exists. (2) Eva needs her own credential — verified that `apps/web/app/api/session/route.ts:148` validates one shared `APP_PASSWORD_HASH` and the door deliberately cannot tell them apart, so she cannot run an export alone. (3) The Book's default view must **not** be reverse-chronological — P4's withdrawal condition requires resurfacing by association so absences are not addressable positions; the current snap rail is the exact shape named. (4) A live rule violation ships today: `book/page.tsx:54` counts `completeDays()` (both-posted) and renders "N days, kept" at `:63` while the rail below shows every day *either* posted — the page displays more leaves than it counts, which is the counter removed and the ledger kept. (5) The ~300-photo backlog import and the iOS web-push image check were dropped by the brief; both are cheap and both change what The Book is on day one.
**Rationale:** The brief is an accurate compression on everything else — the two-places cut, Gap-as-stamp, Saturday cut, the five composition moves, the four hard-won rules, the three tests, night-as-primary all check out against vision §3, DESIGN-DIRECTION §7 and the design-lead note. The five gaps are omissions, not contradictions, and four of the five are cheap now and expensive later. Option C was rejected because composition is what the founder asked for today and none of the gaps block it.
**Reversibility:** reversible (scope decision; no code or schema committed by this entry)
**Owner:** ceo
**Affects:** design-lead (Book default view + the `kept` count fix are in the composition packet), cto (owns the export/credential/delete/availability track and its risk tiering), qa-lead (auth + migration work is `risk:irreversible` — Full + 2-of-3 multi-judge + founder sign-off), cpo (any Eva answer that contradicts the vision routes here for an argued revision, not a silent edit).

## 2026-08-03 — Build in parallel with Eva's five questions outstanding, rather than holding for them

**Context:** P4's FATAL 3 states that zero Eva-sourced inputs exist in the entire repo — every persona, including the five that argued with each other, is downstream of one person's account of what the other one feels. Its withdrawal condition is five questions answered in her own words, verbatim, in the repo, *before another surface is designed*.
**Options considered:** A) Hold the wave until she answers / B) Write the questions into the repo as an open item and build in parallel / C) Proceed without tracking it.
**Decision:** B, founder-approved. Questions written to `docs/08-agents_work/research/2026-08-03-EVA-FIVE-QUESTIONS.md`, each annotated with the assumption it can falsify. Build proceeds.
**Rationale:** The research is right that this is the cheapest of the three fatal flaws to fix, but holding an entire wave on a founder action of unknown latency trades a certain cost for an uncertain one. Building in parallel means her answers **revise rather than rebuild** — which is only true while the surfaces are young, so the value of this file decays and it should not sit open long. C was rejected outright: an untracked gap here is how the product ends up fitted to one member of a two-person user base.
**Reversibility:** reversible, with a decaying window — cheap to absorb now, expensive once the surfaces harden
**Owner:** ceo
**Affects:** founder (only he can run it), cpo (owns contradictions), cmo + cpo (sole authorised writers of `USER-INSIGHTS.md`, where her rows belong), design-lead (anything her answers contradict gets revised, so prefer decisions that are cheap to reverse).

## 2026-08-02 — Scope expands: from a photo book to a long-distance companion app. AI-partner non-goal reversed

**Context:** Founder, immediately after rejecting the first build — *"it should be like an app that we, as long distance, can do things … the dates and the book and the daily interactions and send small images and pictures of each other … a place where we can go and look at pictures of us together or see cute stuff or get date ideas or talk to an AI that represents the other partner. Think big."*
**Decision:** The product is a **multi-surface companion app**, not a book with extras. Seven surfaces: **Home** (both clocks, what the other is doing, what's waiting) · **The Book** (photos of them together, page-turning — retained) · **Today** (the daily photo pair — retained) · **Quick send** (lightweight images and notes, *new* — deliberately lighter than the daily ritual) · **Dates** (hosted dates plus the 98-entry idea library, finally surfaced) · **Partner AI** (*new*) · **The pocket** (private, unchanged).
**The reversal, stated plainly:** PRD §10 non-goal — *"Never an AI companion. Nothing generates affection, writes their messages, or produces prompts a human didn't write. The library is 98 researched activities with 179 sources; that is the content, and it's finite on purpose"* — is **overruled by the founder.** CPO must update the PRD; it is no longer accurate.
**Rationale and the risk being accepted:** the original non-goal was defensible and the reason it existed does not disappear just because the feature is now wanted. An AI that speaks *as* Adam to Eva sits close to two documented findings in this project's own research: Stafford & Merolla (2007) found long-distance couples over-idealise each other and that idealisation predicts trouble at reunion — a partner-simulacrum is an idealisation engine by construction; and the product's own thesis is that *the gap is the delivery mechanism*, which a simulated partner fills in rather than uses. So the feature ships **specced, not improvised**: it must be unmistakably the app and never impersonate a real message from the real person, it must never manufacture affection attributed to the partner, and the honest framings (a companion that knows their shared context, a "what would they say" that is labelled as a guess) are the ones to design toward. Flagged to the founder, decision theirs, work proceeds.
**Reversibility:** the surface is reversible; anything that trains on or stores their private content is not.
**Owner:** founder, recorded by ceo
**Affects:** cpo (PRD §10 and the roadmap are stale), ai-engineer (new workstream), the designer (seven surfaces, not one), cto (Claude API enters the stack).

## 2026-08-02 — Rev 5 is retired. Rich and modern replaces it, and the dependency ban is lifted

**Context:** The founder reviewed the first built screen and rejected it outright — *"really bad… looks terrible… no functionality… not the app we are looking for… we're looking for something bigger, perfect grade quality."* This reverses the CEO's own earlier ruling (see "Design authority: rev 5 is the frame, not the specimen") and the architecture's deliberate dependency exclusions.
**Options considered:** A) Keep rev 5's restraint and execute it with far more craft / B) Retire rev 5's visual thesis, keep the book *interaction*, rebuild the visual register rich and modern / C) Discard everything and design only from the founder's five reference images.
**Decision:** **B**, chosen by the founder. **Retired:** *"the interface never expresses emotion, only the content does"* · the two-muted-ink system as the only colour · all-serif austerity · 2px radius discipline · no-colour-in-chrome · the near-total ban on motion. **Kept:** the page-turning book, one photo each paired on a spread, and the clock that knows both cities. **Lifted:** the §10.0 dependency ban — a real motion library, richer component and image layers are now approved. **Unchanged and still law:** every founder decision from the PRD (D1–D12) and the AC-24→AC-32 security gate. Those are product and safety decisions, not taste.
**Rationale:** The earlier ruling was wrong and the evidence was already in hand when it was made. The founder supplied five references; four were rich, saturated, layered consumer apps. The CEO treated a prior agent's document as the frame and those four as a loose collection — overriding the founder's demonstrated taste with an inherited artefact. Rev 5 was never founder-authored; the founder asked for *"cute and professional"* and *"a book you can move the pages and see the images."* Restraint was a designer's invention on top of that. The built result was exactly what the thesis prescribes — flat, sparse, no depth, no motion — which means the execution was faithful and the direction was wrong. Second compounding error: the CEO praised the screenshot as "reads as a book" while measuring against rev 5's spec rather than against whether it looked like something worth opening.
**Consequence:** `high-end-visual-design`, `minimalist-ui` and `redesign-existing-projects` were **deliberately withheld** from the designer under the previous ruling on the grounds that rev 5 §16 rejected premium-agency defaults by name. Premium is now the target, so `high-end-visual-design` moves into required reading. The daily-spread work already merged is superseded; it cost one dispatch and its component structure may survive, its styling will not.
**Reversibility:** reversible, but expensive — it invalidates the design system, the font choice and one built screen.
**Owner:** founder, executed by ceo
**Affects:** the designer (new v6 direction), frontend-engineer, CTO (dependency manifest), QA-Lead (the design gate is now the founder's eye, not rev 5's rule list).

## 2026-08-02 — Functionality before more screens: one working vertical slice, on a local Supabase stack

**Context:** *"There is no functionality."* Correct, and it is a sequencing failure by the CEO — eleven fixture-driven screens were queued ahead of any working flow, so nothing could be felt as a product. The founder chose **photo in → book out** as the first flow that must genuinely work.
**Options considered:** A) Keep building screens against fixtures / B) Build the vertical slice against a cloud Supabase project / C) Build it against a **local** Supabase stack.
**Decision:** **C.** Stand up Supabase locally, apply the ten authored migrations there, and build login → who's this → pick photos → upload → the book fills → turn pages → post today's photo, against real Postgres and real object storage.
**Rationale:** B blocks immediately — no project is provisioned and no credentials exist — and it would also spend the §0.7 irreversible gate before the schema has ever been exercised. C needs nothing from the founder, applies the migrations somewhere they can genuinely be tested, and turns §0.7 from a leap of faith into a signature on SQL that has already been proven to run. Production becomes a deploy step rather than a prerequisite. A was the failing strategy and is abandoned.
**Reversibility:** fully reversible — local only, nothing production touched
**Owner:** ceo
**Affects:** devops-engineer (stand up the stack), database-engineer (migration 11, the bucket), backend-engineer (T3 auth, T5 photo API), frontend-engineer (T4 upload pipeline).

## 2026-08-02 — maxTurns raised across the roster; per-milestone commits are now mandatory in every brief

**Context:** The first dispatch wave lost three of three agents to turn ceilings, all in the same way: T1 spent 33 calls against a cap of 20 and shipped nothing (worktree auto-reclaimed, total loss); T0 stopped at 19 against 15 with a finished 931-line probe uncommitted; the Fable designer stopped at 54 against 30 with 295k tokens of design system, fixtures and primitives uncommitted. Two were rescued by hand from worktrees due for reclamation. The caps were written for small focused tasks and this build's tasks are not small.
**Options considered:** A) Keep the caps and split every task into cap-sized dispatches / B) Raise the caps / C) Both, plus make partial work survivable.
**Decision:** **C.** Builders that write substantial code → **40** (backend, database, devops, frontend, ai, data, product-designer, test, qa, security, supabase-cleaner, researcher, technical-writer). Read-only reviewers → **25** (code-reviewer, adversary-engineer, design-critic) — they analyse, they do not build. Orchestrators → **40** (CTO, CPO, CMO, CBO, CCO, Research-Lead), **50** (QA-Lead), **60** (Design-Lead). CEO stays at 30. And independently of the caps: **every brief from now on states a per-milestone commit instruction and requires `status: PARTIAL` with committed work rather than a silent stop.**
**Rationale:** Raising caps alone would have been the wrong lesson. The T1 retry is the proof: same agent, same 20-turn cap, same cutoff point — but attempt one lost everything and attempt two lost only its last two files, because the brief told it to commit after each milestone. **The cap determines how much gets done; the commit discipline determines how much survives.** The second is worth more and costs nothing. Brief shape matters as much: attempt one was sent to read 228 KB of documentation before writing a line, which *was* the whole budget. Inline what a worker needs; never make it read a 107 KB architecture document to scaffold a Next app.
**Reversibility:** reversible (frontmatter values; prior values recorded here — builders were 15–20, design-lead 30, qa-lead 25)
**Owner:** ceo, on the founder's explicit delegation ("you are autonomous, do it")
**Affects:** every agent definition in `.claude/agents/`. This is an **Irreversible-tier** file class under CLAUDE.md and was taken only on that delegation. Note for whoever reads this next: `design-polisher` was already at 50 and was left alone.

## 2026-08-02 — T2 authors the migration but does not apply it

**Context:** §0.7 makes the storage migration a founder sign-off gate. The founder delegated autonomy broadly ("build it") without addressing that gate specifically, and T2 blocks T3, T5 and everything downstream.
**Options considered:** A) Treat the delegation as covering the sign-off and let T2 apply / B) Hold T2 entirely until an explicit signature / C) Split the task at the point where irreversibility actually begins.
**Decision:** **C.** T2 authors `supabase/migrations/*` plus a written down-migration and stops. It does not run anything against a database.
**Rationale:** Writing SQL to disk is reversible and reviewable; executing it against a live project is the irreversible act the gate exists to protect, and it is also the only part that genuinely needs a signature. The split costs nothing — no Supabase project is provisioned and no credentials exist, so applying was not available in this session regardless. B would have stalled the critical path over a formality; A would have spent a gate the founder never explicitly handed over. The migration files become the artifact the founder actually signs, which is a better gate than signing a description of them.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** database-engineer (T2 scope), backend-engineer (T3, T5 remain blocked on application, not authoring).

## 2026-08-02 — Design authority: rev 5 is the frame, not the specimen; Fable owns visual execution

**Context:** The founder supplied five `.webp` references (`~/Downloads/Eva & Adam -app deisgn inspo`, mtime 09:03–09:10 the same morning). Four are gradient consumer-app concepts that contradict Design-Lead rev 5's locked direction (*"the interface never expresses emotion, only the content does"*); one — the SORDJATI furniture site — matches it exactly. CEO-1 correctly refused to pick a side unilaterally. The founder then delegated the decision and instructed that a Fable-class model design the interface with **freedom plus references, not prescription**.
**Options considered:** A) Reopen rev 5 and re-pitch against the references / B) Rev 5 stands verbatim, references mined for ideas only / C) Split rev 5 into *product law* (non-negotiable) and *taste* (open), hand both plus all references to the designer with explicit authority to re-pitch anything in the second category.
**Decision:** **C.** Fourteen constraints are law and cannot be re-argued (founder decisions D1–D12, the security gate AC-24→AC-32, no counters, no calendar, silence on a missed day, Eva-before-Adam, no Eden imagery, English only, page-turn as primary navigation, private items never in the ordinary flow). Everything else in rev 5 — palette hexes, Fraunces/Literata, the dial, the computed sky, ribbon navigation, corner mounts, the fore-edge-as-streak — is **taste, explicitly reopenable with a stated reason.**
**Rationale:** Both A and B answer a question the founder didn't ask. The references cannot be *obeyed* — four of them violate founder-locked product decisions (a progress bar is a counter; a calendar grid is banned by D3), so "reopen against these" would license breaking D2/D3. But rev 5 is also not sacred: it was written **without ever seeing its own references** — §11 records that refero MCP and Playwright were unavailable to Design-Lead, so the Apple Books / Paper / Day One / Family capture specs were specified and never executed. A direction argued from recall should not outrank a stronger direction argued from evidence. Splitting law from taste is the only cut that keeps the founder's locked decisions intact while giving the strong model something real to do. Corollary: `high-end-visual-design`, `minimalist-ui` and `redesign-existing-projects` are deliberately **not** in the designer's required reading — each prescribes a specific look (premium-agency defaults; bento grids and muted pastels), and rev 5 §16 already rejects that exact cluster by name. They remain available on request.
**Reversibility:** reversible (no code exists; the law list is upstream of it and unchanged)
**Owner:** ceo
**Affects:** design-lead / the Fable designer (owns visual execution), frontend-engineer (builds against whatever system lands), cpo (rev 5 taste changes do not reopen the PRD), qa-lead (the law list is the design gate).

## 2026-08-02 — Five architecture open questions closed so §0.7 is a clean signature

**Context:** The handoff and architecture §0.7 both called the storage-migration sign-off "the only remaining blocker of any kind." True of blockers, misleading in effect: architecture §11 carried five unanswered CPO questions, and **Q3 states in CTO's own words that it is "cheaper to decide before T2 ships."** T2 is Irreversible tier. Signing §0.7 with Q3 open risks a second irreversible migration days after the first.
**Options considered:** A) Sign §0.7 now, absorb any follow-up migration / B) Route all five to CPO and wait / C) CEO rules on all five directly, since four are already answered elsewhere in the corpus and only one is a genuine product choice.
**Decision:** **C.** (§11-Q2) The tally filters on `purged_at`, not `deleted_at` — **confirmed as specced**; D3 says the count never decrements, and `deleted_at` would let ordinary tidying erase a day they both showed up for. (§11-Q3) **No daily prompt in Phase 1** — `v_shared_days` stays a view, T2 unchanged. (§11-Q4) Reveal-on-post gating — **yes**, already specced in PRD §5 and asserted by AC-10, including the day-ended fallback; not actually open. (§11-Q5) The day-count is **not displayed as a number** anywhere except the colophon, spelled in words, per design §9; the fore-edge is the streak. (design §14-Q1) An open date **is already a page in the book**, sitting near today and settling into date position when it finishes.
**Rationale:** Q3 was the only real decision and it decides itself: Phase 1 already ships the paired question (date #3), which is a prompt-shaped daily thing, and PRD §3A.4 warns explicitly against creating a second daily obligation. C27 "one question a day" is Phase 2 in the RICE table. Adding a prompt surface now would duplicate a mechanic and convert a view into a table on an irreversible migration. Q4 and Q5 were not open at all — both are answered in documents CTO's §11 predates or didn't cross-check, which is why routing them to CPO would have cost a round trip to be told what the corpus already says. Design §14-Q1 is adopted because any "record surface" for open dates is a list of things awaiting you, and PRD §3A.4's hardest rule is that open dates must never accumulate into a task list.
**Reversibility:** reversible except Q3, which is hard-to-reverse once T2 runs (view→table is a migration)
**Owner:** ceo
**Affects:** database-engineer (T2 ships as specced, no schema change), backend-engineer (T5, T10, T14a), the Fable designer (§14-Q1 removes a surface from scope), cpo (PRD §11 divergence list can be closed).

## 2026-08-02 — The anchor/slip split is adopted; PRD §3A.4 "one slot, two producers" is superseded

**Context:** PRD §3A.4 specifies that "left for you" and a date turn awaiting you **share one slot, two producers**. Design-Lead §5.3 split them — anchor = today's page, slip = the date turn — and flagged it *"for CPO to accept or reject."* Design §14 then listed the same item under **Closed: "the anchor/slip split (adopted)."* The document both defers the decision and takes it; CPO never ruled; the PRD still says one slot. It changes T10 and T14b.
**Options considered:** A) Honour the PRD — one slot, priority date turn → unseen photo → empty frame / B) Adopt Design-Lead's split.
**Decision:** **B.** The anchor is today's page and its one tap goes to the photo picker. The slip carries either the suggestion or the date turn awaiting you.
**Rationale:** Design-Lead had a platform fact CPO did not: **Safari supports neither Web Share Target nor manifest `shortcuts`**, so there is no OS-level path from the camera roll into the book — every photograph enters by opening the app and reaching the picker. That makes one-tap-to-picker the single most load-bearing affordance in the product, and time-sharing its slot with a date turn breaks it on the one platform where it already costs the most. PRD §3A.4 was written before that constraint surfaced; it is superseded on evidence, not on preference. The internal contradiction in the design doc is resolved in favour of §5.3's reasoning over §14's bookkeeping.
**Reversibility:** reversible (a slot-priority rule, no schema)
**Owner:** ceo
**Affects:** cpo (update PRD §3A.4), backend-engineer T10/T14a, frontend-engineer T14b, the Fable designer (both slots are in scope and their jobs are now disjoint).

## 2026-08-02 — Model assignment: Fable designs, Opus engineers

**Context:** Founder instruction — a Fable-class model owns the interface and user experience "because we want the best output," with Opus on the backend and the rest of the build.
**Options considered:** A) One model tier throughout / B) Fable on the three signature surfaces only, Opus on everything else / C) **Fable on the entire interface, Opus on everything behind it.**
**Decision:** **C**, on the founder's correction — *"Fable in to design all the UI UX for all, no backend with Fable. Opus for the backend and wiring."* Fable owns the design system and **every screen and every state**: login, the cover, the whole book, the turn and the riffle, the daily spread in all three of its states, dates, browse, seeding, the outbox, the pocket, install onboarding, and the empty/loading/error/asleep state of each. Opus owns API routes, `lib/data/*`, `lib/session/*`, the photo-pipeline internals, the shared-day module, migrations, the service worker, jobs — and the wiring that feeds Fable's components real data. Sonnet is not used on this build.
**Rationale:** B put a security engineer in charge of designing the vault grid and a backend engineer in charge of the dates UI, purely because architecture §10.0 assigns ownership by *directory* — one task per path, UI and logic together. That vertical seam is wrong for this product, where the interface is the deliverable and the rest is plumbing to a written spec. The horizontal seam is also what makes the design track genuinely unblocked: Fable builds against `lib/types.ts` with its own fixtures, so the database, the APIs and the auth can all land afterwards without changing a line of it. AC-37 (four designed states on every screen) becomes one agent's coherent problem instead of six agents' inconsistent one.
**Consequence:** architecture §10.0's directory-ownership contract is re-cut. T9, T10, T14b and T16 stop being build tasks and become wiring tasks. T13 splits: Fable designs the pocket, security-engineer enforces the boundary (separate table, storage prefix, SW path rule, no thumbnail derivative ever).
**Reversibility:** reversible
**Owner:** ceo
**Affects:** every dispatch brief; the full seam and skill matrix are in `docs/08-agents_work/handoffs/2026-08-02-ceo-2-dispatch-pack.md`.

## 2026-08-02 — Shared-day assignment: the poster's own local date (CEO ruling, closed)

**Context:** CPO and CTO independently designed the same concept and then swapped models twice, each deferring to the other. Three rounds, no convergence. CTO later *measured* the divergence: the two models disagree on **44.1% of Adam's posts and 15.2% of Eva's, every day of the year** — structural, not a DST edge case. Had both survived into one codebase, ~1/3 of posts would be silently mislabelled with no error raised.
**Options considered:** A) CPO's rule — each post carries its author's own local date / B) CTO's 08:00 UTC anchor — uniform 24h buckets, DST-immune arithmetic, no shared session ever split.
**Decision:** **A.** Dailies stamp by the poster's own local date. B recorded as a rejected alternative with its derivation and confirmed DST-immunity intact, so nobody re-derives it and wonders why we passed.
**Rationale:** One test decides it — *can a photo ever land on a shared day that is already complete?* Under A, never. Under B, every morning of Adam's life, because the anchor lands at IL 10:00–11:00 and his W1 window is 05:00–09:00 — unless he remembers a toggle at 5am. **A correctness property that depends on a person remembering a toggle is not a correctness property.** CPO had withdrawn A on a flaw it doesn't have: it conflated span-length variance (a display artifact) with stamping fragility, when the rule never references span. The property that matters — each person has exactly one local date at any instant — holds on fall-back when an hour repeats and on spring-forward when an hour vanishes.
**Reversibility:** hard-to-reverse (schema-level; every daily and every date artifact depends on it)
**Owner:** ceo
**Affects:** cto, cpo, design-lead. Enforced by AC-13d (replays any post history incl. DST transitions, asserts no photo lands on a complete day) and AC-13c (every stamping AC must still pass with the day toggle disabled — if the toggle is ever load-bearing, the model beneath it is wrong). §3.5 bans numeric offsets; a stray `-8` in date arithmetic is the specific regression that resurrects the rejected model.

## 2026-08-02 — Activities are hosted in-app, and they are called dates

**Context:** Founder decided the app should host the activities rather than point at them, then reframed the vocabulary: *"Don't call it minigames. Call it dates."*
**Options considered:** A) Suggestion cards only — the app points, you go and do it / B) Host everything playable / C) Host a small number chosen to share one interaction shape.
**Decision:** **C** — three dates in Phase 1 (the story, twenty questions, the paired question), sharing one shape: alternating short-text turns, no timer, resumable indefinitely, ends by writing a page into the book. Vocabulary is systemic — *activity*, *game*, *minigame* retired product-wide including component names and code identifiers, enforced by a CI grep.
**Rationale:** Dates **redefine** Pillar 1 rather than extending it — a card that points at rules and a card that starts something are different products with different data models — so deferring means building Pillar 1 twice. The reframe also does real work: an async turn-based thing reads as a stalled game but as *a date that lasted all day*, and **you don't score a date**, which locks the no-gamification rule in at the metaphor rather than as a rule to remember. Two permanent criteria fell out: **"is a single turn worth waiting seven hours for?"** (turn-based ≠ async-friendly; this cut Ghost, Contact, Minister's Cat, Picnic, Just a Minute) and **the T5 protocols are never hosted async** — they are contraindicated *by truncation*, so hosting them converts their mechanic into their documented failure mode.
**Reversibility:** hard-to-reverse (schema + the shape of Pillar 1)
**Owner:** ceo + cpo
**Affects:** cto (T14a/b, T15, T16 — 4.5 worker-days, one extra wave), design-lead (§5A, §6.4). Order of sacrifice if it doesn't fit: cut date #2, then #1, **never cut the subsystem to keep three thin dates.**

## 2026-08-02 — Separate vault passphrase, and physical separation of private content

**Context:** Founder chose a single shared password over real accounts, then confirmed the product will hold intimate content. CPO derived that private items must be structurally separate because the product's own window model says Eva may be turning pages at a desk in an open office. CTO then proposed a second secret.
**Options considered:** A) One password for everything / B) `sensitivity` boolean column on `photos` / C) Physically separate table, storage prefix and routes, plus an independent vault passphrase.
**Decision:** **C.** `vault_items` is its own table with its own storage prefix and routes; **`photos` has no sensitivity column at all**, so there is no boolean anyone can forget. A second passphrase, independent of the app password, gates the vault.
**Rationale:** `WHERE NOT private` that someone forgets once is exactly the bug the requirement exists to prevent. Three independent guards: no thumbnail derivative is ever generated (the artifact doesn't exist, so it cannot leak into a grid, share sheet or notification preview — thumbnails leak *more* than originals, being equally identifiable and automatically prefetched); a foreign key means the database itself refuses to place a vault item in the book; the service-worker rule is path-based so a header regression cannot defeat it. The separate passphrase materially changes the honest disclosure — a stolen app password now reaches the ordinary photos and **not** the private ones.
**Reversibility:** irreversible in practice (retrofitting a privacy boundary onto existing rows is the migration nobody wants — which is why it ships in Phase 1)
**Owner:** ceo + cto + cpo
**Affects:** cto (T13, off the critical path), design-lead (§10 rear pocket — a plain quiet grid, deliberately **not** a second page-turning book: the page-turn is for what they show each other). Backups must be a **mirror, not append-only**, or a permanent deletion is silently undone on restore.

## 2026-08-02 — LDR App cost model v2: backlog confirmed, prices verified, keep-alive ranked as top risk

**Context:** Follow-up to the same-day cost model below. Infra decisions locked (Supabase `eu-central-1`, R2 as an automated mirror, platform encryption-at-rest not E2E, no native wrapper in Phase 1); founder confirmed the backlog import at ~300 curated photos; a hosted "dates" feature (turn-based shared activities, possibly Supabase Realtime) was added to scope; and CEO required every price to carry a live source URL rather than memory.
**Options considered:** A) Present v1's recalled prices as final vs. B) get them verified — the explicit new instruction made A a rule violation, not a style choice.
**Decision:** Spawned `researcher` once (bounded to 5 vendor pricing pages) despite v1's "no subagents" constraint, since the new citation requirement was otherwise unsatisfiable without either fabricating sources or leaving the requirement unmet — flagged this specific call back to CEO rather than deciding it silently. Updated the model: backlog resolves the v1 $0-vs-$600 uncertainty to **$0 confirmed** (crossing pushed to ~month 38); corrected R2's growth math to include the mirrored derivatives, not just tiered originals, which was a real gap in v1's model, not a new assumption; verified hosted "dates" costs $0 (Supabase Realtime free tier: 200 connections/2M messages vs. two people's turn-based traffic); added Supabase's 7-day free-project pause as the new top-ranked risk — an availability failure, not a cost one, shaped precisely wrong for a couple's app (goes quiet exactly when life gets hard) — and confirmed its existing free mitigation (CTO's nightly GHA keep-alive) over paying $300/yr for Pro to remove it.
**Rationale:** Every number in this pass that could be sourced now is, including the one genuinely load-bearing claim (R2's zero-egress-fee policy, quoted verbatim) that the entire backup-cost recommendation depends on. The mirror-math correction and the pause-risk ranking are both cases where verifying rather than assuming surfaced something the recall-based v1 pass had gotten wrong or hadn't ranked correctly — the exercise paid for itself.
**Reversibility:** easy — no new vendor commitment; the only change in posture is which free-tier risk is ranked first and when the Pro-tier budget line is expected to land.
**Owner:** cbo
**Affects:** cto (P1-T11 runbook should carry the §6.1 keep-alive warning verbatim, and the R2 bucket must be provisioned as Standard class, not Infrequent Access, per §4's citation), cpo (hosted-dates cost question closed — no cost constraint on the feature cut).

## 2026-08-02 — LDR App: cheapest credible run-cost configuration, no PITR, no native wrapper

**Context:** Founder asked "how do we do it without paying too much" for the private two-person PWA. CBO pressure-tested CTO's §5.4/§5.5 storage/cost/backup model and produced the full running-cost model at `docs/04-features/LDR-APP-COST-MODEL.md`.
**Options considered:** A) Supabase PITR add-on for tighter recovery granularity vs. the existing $0 nightly-R2-dump backup / B) Build a Capacitor native wrapper now to get iOS haptics (Design-Lead found Safari has no Vibration API) vs. stay PWA-only / C) Engineer around the Supabase 1 GB free-tier cliff (lower photo quality, trim backlog import) vs. budget for the $25/mo Pro step.
**Decision:** Stack stays Vercel Hobby + Supabase Free (budgeted escape hatch to Pro, $25/mo) + Cloudflare R2 Free + GitHub Actions Free, $0–1/month at launch. No PITR purchase. No native wrapper unless a stated trigger fires (Safari ships Vibration API, or ≥1 month of real use produces a repeated non-speculative complaint). No quality/backlog engineering to dodge the Supabase cliff — pay the $25/mo when it comes.
**Rationale:** At this data scale (two people, two photos/day), the free nightly R2 dump already delivers a ≤24h RPO for $0 — PITR would pay to duplicate protection that's already free. The native wrapper costs ~$99/yr plus a hard Mac/Xcode dependency to fix one missing sensory channel nobody has complained about yet; cost isn't the real gate, evidence of need is. Degrading photo quality or the backlog import to avoid $300/yr would make the one deliverable this product exists for (a book of their actual photos) worse to save an amount that's trivial against the product's overall near-zero run cost.
**Reversibility:** easy — every component is a tier/config choice, reversible within a billing cycle; no vendor commitment or data-loss risk created by this decision.
**Owner:** cbo
**Affects:** cto (already built to this budget posture), cpo/founder (PRD open-question-4, backlog size, is the single biggest lever on *when* the Supabase Pro step lands — flagged, not resolved, by this decision).

## 2026-08-02 — Repurpose this repo as a personal LDR project hub

**Context:** The repo shipped as a startup template whose docs, agent definitions, and Project State describe an unrelated SEO/GEO scanning product. The founder's actual intent is a home for small, personal projects supporting a long-distance relationship (Israel ↔ NYC), starting with an activity library and later a website used live during video calls.
**Options considered:** A) Strip the template scaffolding first / B) Leave it and build alongside / C) Fork a clean repo.
**Decision:** B for now — build alongside, clean up before any website work begins.
**Rationale:** Cleaning mid-flight would have blocked seven running research threads for zero research benefit. The stale product docs cost nothing until an agent reads them as current context, which first happens when we build UI.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** cpo, cto, design-lead — all must treat `docs/01-foundation/` and `docs/02-competitive/` as stale template content, not project truth, until cleared.

## 2026-08-02 — Nine-window overlap clock as the library's primary index

**Context:** Generic LDR advice assumes a shared evening. A 7-hour gap plus offset work weeks (Israel Sun–Thu, US Mon–Fri) means this couple has no shared evening and only one shared day off. Activities had to be indexed by *when they are possible*, not by theme.
**Options considered:** A) Theme-first index (games / talk / watch) / B) Window-first index keyed to real overlap slots / C) Duration-first.
**Decision:** B — nine windows (W1–W9), each activity tagged with every window it genuinely suits, with a thin-window quota forcing coverage of the awkward slots.
**Rationale:** Theme-first reproduces the listicle problem: a rich Saturday shelf and nothing for a Tuesday lunch. Window-first made W4 (her lunch) the second-densest cell at 36 entries and gave W3 (her commute) 17 audio-only options — two slots a theme-first approach would have left empty. Ranking is applied *within* window × category × intimacy buckets to prevent the library collapsing into variants of one idea.
**Reversibility:** hard-to-reverse (the schema and all 98 records depend on it)
**Owner:** ceo + research-lead
**Affects:** cpo, design-lead, frontend-engineer — the site's primary navigation should be the shelves, phrased in the couple's own language, not window codes.

## 2026-08-02 — Verification tiering over silent inclusion

**Context:** reddit.com was blocked at the tool level for the entire session — confirmed independently by four threads — and the session WebSearch budget hit 200/200 before T7 made a single call. First-person community sourcing is absent library-wide.
**Options considered:** A) Drop all unsourceable entries / B) Include them silently / C) Include with an explicit `verification_tier`.
**Decision:** C — 89 `verified` / 9 `plausible-unverified`, segregated in `library.json` and never ranked alongside each other.
**Rationale:** Dropping them loses real value (the asymmetry-exploiting rituals are the best material and the least documented). Including them silently makes the library unfalsifiable later. Tiering keeps both the content and the honesty, and `source_date` on every record makes staleness detectable — several entries cover products that shut down frequently.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** any agent consuming `library.json` — never surface a `plausible-unverified` entry as equivalent to a verified one.

## 2026-08-02 — Ask before spending on inferred windows

**Context:** W2 was inferred from an ambiguous founder reply and cost roughly a tenth of round-1 budget before correction. Research-Lead then flagged that W3 and W4 were also never confirmed — with W4 carrying 36 entries by then.
**Options considered:** A) Proceed on inference / B) Confirm with the founder before round 2 spends.
**Decision:** B — asked; both confirmed real. Eight of nine windows are now validated against actual behaviour rather than inferred.
**Rationale:** A five-minute question protected the library's two most differentiated cells from being built on fiction. Second time this session that asking beat assuming.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** research-lead (round 2 scoping) — W3 promoted to top round-2 priority: confirmed real, thinnest verified coverage.

## 2026-08-04 — QA-Lead PASS on feat/wave-0-foundation (Wave 0 material foundation)

**Context:** Full-tier QA gate on Wave 0 — token scale rewrite, 5 material primitives, 29 image assets, 3 fonts. Night CSS block rewritten ~140 lines (dim-not-invert per D1). Blast radius: dock/login/echo/today render differently at night, unreviewed outside bench.
**Decision:** PASS. All 8 mandatory checklist items cleared. No P0/P1 findings. Accessibility verified (WCAG AA). TypeScript errors pre-existing on main.
**Rationale:** P2 blast radius is CEO-accepted (D1), documented in HAND-FORWARD. P3 Taped naming mismatch is functional placeholder. Private two-person app; new token model internally consistent and AA-compliant.
**Reversibility:** reversible (merge can be reverted; token model changes are CSS)
**Owner:** qa-lead
**Affects:** Wave 1 gate — must explicitly re-walk dock/login/echo/today in night mode before those surfaces merge.

## 2026-08-04 — QA-Lead PASS on feat/wave-0-foundation re-submission (HEAD a5e4f7f)

**Context:** Re-submission after BLOCK on Pinned.tsx lamp curve hardcoding. Fix: --lamp-brightness-drop and --lamp-sepia-saturation moved to :root; @utility under-lamp and Pinned.tsx inline filter both read from those tokens. /dev/materials now calls notFound() in production.
**Decision:** PASS. One BLOCK cycle completed. P1 resolved. P3 resolved. All 8 mandatory checks remain CLEAR.
**Rationale:** Values unchanged (0.27 / 0.22); definition now singular. Fallback asymmetry (Pinned with literals, utility bare) is correct for respective CSS/JSX contexts, not a sync risk.
**Reversibility:** reversible
**Owner:** qa-lead
**Affects:** Wave 1 gate — dock/login/echo/today must be re-walked at night before those screens merge. prefers-reduced-motion needs OS-level screenshot evidence in Wave 1 acceptance.

## 2026-08-04 — Correction: migration headers went stale and misled two agents into a false Irreversible-tier escalation

**Context:** The 2026-08-02 entry above ("T2 authors the migration but does not apply it") was correct when written — no Supabase project existed and the migrations genuinely had never run. Every file in `apps/web/supabase/migrations/*.sql` still asserted `NEVER APPLIED` in the present tense two days later. On 2026-08-04 the founder confirmed directly from the Supabase dashboard that the tables exist in project `oqiyzzpcsdlqqcjlpmix`. Two agents independently read the stale header plus the 08-02 entry, concluded the schema had never been applied, and triggered a false Irreversible-tier escalation to the founder.
**Fix:** Headers in all 11 migration files rewritten to state application status as unknown — not applied, not unapplied — and to require verification against the live schema before running anything. No SQL statement changed, no migration applied, no database touched.
**Lesson:** A document describing the state of the world goes stale in a way a document describing intent does not. This file records intent and stays true; a migration header's `NEVER APPLIED` claim recorded a fact about the world at write time and rotted the moment the world changed underneath it. When two documents disagree about a fact, the tie-break is looking at the world, not weighing documents against each other.
**Reversibility:** reversible (comment-only correction)
**Owner:** technical-writer, routed by ceo
**Affects:** every agent reading migration headers going forward — verify against the live schema, do not trust the comment alone.

## 2026-08-04 — QA-Lead Wave 1 gate: two PASS, one BLOCK→fixed→PASS, one PASS post-merge — and the standing environment exemptions are now void

**Context:** Three Full/Lite-tier branches gated in one cycle: `feat/today-scrapbook-deco` (Today rebuild, UI only), `feat/photo-path` (photo upload/serving API + DB write), `fix/toolchain` (build/lint/dev-server fixes). All prior QA cycles today, including my own two Full-tier verdicts, had been carrying two standing exemptions as "environment facts, not defects": `next build` blocked by pre-existing `app/sw.ts` type errors, and `next dev` never completing hydration.
**Decisions:**
1. `feat/today-scrapbook-deco` — **PASS**. All behavioral non-negotiables (SealedCard fires only on genuine sleep, `.photo` never filtered — verified by pixel-identical luminance day/night, no counters/streaks, stable-ID seeding, `lib/shared-day/` untouched) verified by tracing code and measuring pixels, not by report. design-critic sub-agent died mid-run; that dimension is explicitly **NOT ASSESSED**, not folded into the PASS.
2. `feat/photo-path` — **BLOCK**, then **PASS** after a re-gate cycle. P1: `commitPhoto` wrote `exif_stripped: true` unconditionally with no server-side verification, because upload is direct-to-storage; an authenticated caller could commit raw GPS-laden bytes with a self-computed checksum and the system would falsely mark them clean, feeding the nightly R2 export. Escalated above the security-engineer's own self-rated (lower) severity. Fix: `verifyDerivativesAreClean` re-downloads and re-scans the committed objects server-side with the already-tested `findMetadataEvidence`, reject-outright (not quarantine) on failure. Red→green reproduced independently by disabling the guard and watching the new bypass test fail exactly as predicted, then restoring it.
3. `fix/toolchain` — **PASS**, verified post-merge (founder merged all four branches before this verdict returned, on informed knowledge that the second opinion was in flight — his call, recorded here for the log). The hydration-bug claim and the `allowedDevOrigins`-is-dev-only claim were each reproduced independently, not just read about — including deliberately reverting the fix and watching it fail with the exact predicted error.
**The consequence that outranks any individual verdict:** `pnpm build` now compiles clean and `next dev` now hydrates. **Both standing exemptions are void as of `main` `f5b6b21`.** No future QA verdict on this project may cite either as accepted environment noise. Sharper corollary: every browser-automated interaction check on this project runs through `e2e/playwright.config.ts`, whose `baseURL` is `127.0.0.1` — every historical "I clicked it and it worked" claim on this codebase was performed against a page that never hydrated and was never true. The project's back-catalogue of interaction verification is worth nothing; anything load-bearing needs re-checking, not inheriting.
**Post-merge finding, recorded because a per-branch gate structurally cannot catch it:** after all four merged, `tsc` failed on three font imports (`@fontsource-variable/caveat`, `@fontsource/patrick-hand`, `@fontsource/poiret-one`) — declared in `package.json` by Wave 1 but only installed inside its own worktree. Neither branch was broken alone; `pnpm install` fixed `main`. Four green branches still merged into a red trunk.
**Rationale:** Independent, adversarial re-verification (running the actual test suites, reproducing claims in both directions, measuring pixels instead of eyeballing screenshots) caught a real P1 that a sub-agent's own severity rating had underweighted, and confirmed a toolchain fix whose blast radius touches every prior verification on the project.
**Reversibility:** the merges are reversible in principle; the exemption-voiding is a standing process fact, not a code change, and should not be re-litigated without new evidence that the dev server or build have regressed.
**Owner:** qa-lead
**Affects:** every future QA-Lead cycle (do not cite dev-hydration or the sw.ts build blocker as accepted noise), any agent relying on a historical Playwright/e2e "it worked" claim (re-verify, don't inherit), CTO (post-merge dependency-install gap on `main`, now fixed).

## 2026-08-06 — The dock is a tray, `--dock-offset` is deleted, and the deco plates each have one home

**Context:** Founder-directed: real deco art in Today's DECO band, and the floating pill dock rebuilt as a physical tool tray (`feat/deco-and-tray`).
**Decisions:**
1. `--dock-offset` no longer exists. The tray sits flush to the bottom edge; `--dock-footprint` (declared in `app/layout.tsx`) is now `calc(3.75rem + max(0.5rem, env(safe-area-inset-bottom)))` and is the only dock geometry variable. Any branch reading `--dock-offset` (e.g. `feat/dock-footprint-flow-reserve`) must rebase onto the footprint alone.
2. `key_assets.py` gained a ground-colour mode: same border-connected flood fill as the white path (§9.7 — never luminance), keyed to a measured flat ground with the unpremultiply target swapped to that ground. Overrides carry the measured values; measure before trusting a tolerance.
3. Plate placement: the two skylines ship on Today as **two shores with the space between** (display crops from the keyed masters; interleaving the full panoramas inverts depth at phone width — tried twice, failed twice). The ornament border is reserved for the one-card date suggestion. The window interior is reserved for the Tape's playing scene ("dims the room, brings the city up") — cropped fragments of it read as pasted slivers and it must be used whole.
**Reversibility:** reversible
**Owner:** frontend-engineer (deco-tray)
**Affects:** any branch touching dock geometry or `--dock-offset`; any agent keying non-white-ground plates; whoever builds the date card or the Tape.

## 2026-08-06 — Law §9.6 corrected: the seam fog was in both modes; the acceptance had profiled only the endpoints

**Context:** The seam falloff still hazed after Wave 0/1. Luminance profiling on `feat/deco-and-tray` showed the fog in BOTH modes (day 129→18 over ~104 CSS px, night 97→18, same shape) — not the day-only mechanism §9.6 recorded. The mid-band held 0.55–0.8 opacity for ~45px; the CEO-approved acceptance measured the steep start and the deep end and assumed the middle.
**Decision:** §9.6 superseded in place, original kept legible (§1 precedent). Stops shipped in Seam.tsx: 0.6@55%, 0.9@63%, 0.97@74%, sky@93%. Re-measured: fog band 104→24 CSS px; night's slow deepening survives between luminance 40 and 18.
**Lesson:** A measurement can be as unexamined as a report — checking the ends of a curve is not checking the curve.
**Reversibility:** reversible
**Owner:** frontend-engineer (deco-tray), correcting a CEO-approved acceptance
**Affects:** every design agent loading the law as authoritative; anyone tuning the Seam falloff.

## 2026-08-06 — The app is three places, Echo stops being a destination, and the redesign is measured at 2 of 5 surfaces

**Context:** Founder verdict on 2026-08-06 was that the app is "very, very bad" to use and "looks like a three years old website design," after seven QA-Lead PASS verdicts. CEO measured law-era styling markers (`under-lamp`, `paper-`, `deco-`, `Taped`, `Mounted`, stock) against SaaS-era markers (`card`, `well`, `hover-lift`, `shimmer`) per surface. Result: Today 11/0, The Book 9/0, Dates 0/15, Echo 0/6, Send 3/13. **Waves 0-2 rebuilt two of the five dock destinations; Dates, Echo and Send are still the pre-redesign build.** Tapping the third tab leaves the scrapbook and lands in the old app. No per-branch QA gate could catch this — every branch was individually correct.
**Decisions:**
1. **The surface list is three places: Today · The Book · Dates.** Founder-chosen against PRODUCT-VISION-V2 §3.3, which argued for two. Dates survives as a place — not the gesture §2.3 wanted — because the 98-item library is the largest researched asset in the repo. Recorded as a deliberate divergence, not an oversight. Echo is deleted as a destination; the strictly-quoting search returns later inside The Book (Vision §2.4 always said "It lives inside The Book. It is not a tab."). Pocket stays a drawer inside the Book. Send folds into the pen and loses its page. Dock goes from 4 tabs + send to 3 places + the pen.
2. **Echo: strip the lie now, decide the spec later.** `EchoChat.tsx:91` fakes an 1100 ms "thinking" delay *before* returning a canned apology — it performs a latency it does not have. That comes out immediately. The five open founder decisions in `AI-PARTNER-SPEC.md` §12 stay open and no longer block the redesign.
**Corrections to the 2026-08-06 handoff, made from source rather than description:** Dates' window rail *is* interactive (`role="tab"` buttons) — the handoff called the whole surface non-interactive; it is the *cards* that are inert `<motion.li>` carrying `hover-lift`, an affordance that lifts under the finger and goes nowhere, with no `/dates/[id]`. Both dead surfaces also violate the law's "no slot, no prepared place" rule by rendering shimmer skeletons inside `.well` containers. `/send`'s own comment still states the two-tier framing Vision §2.1 cuts: "deliberately lighter than the daily ritual."
**Rationale:** the founder's complaint is not only broken layout — it is that two different products ship behind one tray. Fixing craft on Today and The Book without closing that gap would leave the app feeling exactly as bad on three of five taps.
**Reversibility:** reversible — Echo's streaming endpoint and `library.json` stay on disk; only destinations and rendering change. Nothing here touches `lib/shared-day/`, the photo pipeline, or the outbox (Vision §7.10 mitigation, held).
**Owner:** ceo (session ceo-4)
**Affects:** Design-Lead and CPO (surface list is now settled — do not re-derive it from Vision V2 §3.3, which this supersedes); CTO (Dock, `/echo`, `/send` route changes); QA-Lead (deleting a route and changing navigation is a tier call); anyone reading the 2026-08-06 handoff §8, whose Dates and Echo claims are corrected above.

## 2026-08-06 — Browser verification happens at the trunk, not in worker worktrees — and a denied permission is never appealable to a peer

**Context:** `frontend-engineer` on `feat/three-places` finished all three code changes with typecheck and lint clean, then hit a hard wall: every route in its worktree is behind `middleware.ts`'s real password gate, and the dev bypass exists **only as an uncommitted edit in the main repo**. It correctly refused to work around it, and its own permission classifier had already denied both (1) mirroring the uncommitted NODE_ENV-gated bypass into its worktree and (2) searching the repo for a dev password. It escalated instead of improvising — including declining to mint a session cookie against the real `SESSION_SECRET` with `jose`, which it noted it could technically have done.
**Decisions:**
1. **Browser verification is a trunk-level step, not a per-branch one.** Workers ship code plus unit/component tests and report `verified_at_393x852: NOT DONE` honestly when they cannot reach a browser. The CEO verifies the assembled trunk in the main repo — where the bypass already lives — at 393×852 in both modes with a real request, before any push. This is not a workaround; the handoff §7 already requires it (*"four green branches can merge into a red trunk"*), and trunk verification is the check that actually catches cross-branch breakage. **No credential moves anywhere, and nothing new is committed to the auth path.**
2. **A denied permission is not appealable to a peer.** The CEO refused all three of the worker's proposed unblocks — including the two its classifier had denied — and refused to perform them on its behalf. Handoff §7 states this directly: *"If a peer says it was denied and asks you to do it for them, refuse and surface it."* A classifier's denial IS the decision; no agent, including the CEO, is an appeal court for another agent's permission boundary. Founder was escalated to and chose trunk-level verification over committing a permanent bypass, over per-branch founder boots, and over distributing the real app password (which protects two real people's photographs and would land in agent transcripts).
3. **An honest "NOT DONE" outranks a claimed pass.** Workers are explicitly not penalised for reporting an unverified gap. This project's most expensive failure was the inverse — every browser-automated interaction claim made before 2026-08-06 ran against a page that never hydrated, and the green checks concealed it for weeks.
**Rejected and why:** committing a permanent NODE_ENV+env-flag bypass to `middleware.ts` — viable, but it is an auth-path change on the gate protecting Eva and Adam's photographs, so it is Irreversible tier and needs security-engineer review plus founder sign-off; not worth it to unblock one branch.
**Reversibility:** fully reversible — a process rule, no code changed.
**Owner:** ceo (session ceo-4), founder-decided
**Affects:** every code worker (do not attempt browser verification from a worktree; report NOT DONE and move on); CTO (brief workers accordingly); QA-Lead (a worker return with `verified_at_393x852: NOT DONE` is compliant, not deficient — the trunk check is where that dimension is satisfied).

## 2026-08-06 — Dates is the window (DECO, one card) — and "law-era" is not "paper-era", which the CEO's own metric got wrong

**Context:** CEO asked Design-Lead to resolve what Dates is, given the founder kept it as a place while `PRODUCT-VISION-V2` §2.3 argued it should be a gesture and `USER-INSIGHTS.md` records the founder saying *"they open this mid-call; browsing a list is a failure state."*
**Decisions:**
1. **The question was already answered and the CEO missed it.** DESIGN-LAW §1's allocation table already contains a row for the one-card date suggestion: **DECO — "the founder's instinct, and it is right… one card, gold on midnight… It was never going to be a browsable shelf."** No third treatment, no §1 conflict. What changed since that row was written is only that Dates became a *place*, and a place in DECO is already provided for — the Night City is one.
2. **Dates is the window.** The three places are three directions of gaze in one room: The Book is *down, at your lap* (PAPER); Today is *the table with the window beyond it* (PAPER→DECO across the seam); Dates is *up and out, through the window* (DECO). **You do not browse a window — you look out of it.** That is how Dates is a place without being a list, and *arriving at the place is the gesture* §2.3 asked for. One card, already lit on arrival; one control (`not this one`); nothing else. No window rail — the window is a fact about two clocks, told to you, never offered.
3. **⚠️ "Law-era" is not "paper-era" — the CEO's coverage metric is a trap and must not be chased.** CEO measured redesign coverage by counting `under-lamp`, `paper-`, `Taped`, `Mounted` as law-era markers and `card`/`well`/`hover-lift`/`shimmer` as SaaS-era. That metric is correct for PAPER surfaces and **actively wrong for DECO ones**. A builder chasing it would paper-ify Dates and produce the worst output of the redesign. On a DECO surface the correct census is **zero** `Taped`, `Mounted`, `Torn`, zero paper stocks, and **`under-lamp` must not appear at all** — the lamp dims the paper table, and the window is not on the table. The right markers are the night palette, the keyed shore plates, and flat hard-edged illustration.
4. **The thin-window trigger is wrong at its root.** `DatesExplorer.tsx:118` fires the empty state on `entries.length === 0`. But `library.json` declares `thin` as a property of the **window** — w3, w4, w8, w9 — and **w4 is flagged thin while holding 36 activities, the second-most-populated window in the library**. Thinness is a fact about their life (a commute, a lunch break), not a count of the shelf. The founder's sentence was always describing the window. The fix removes the name interpolation entirely, which deletes the `.toLowerCase()` bug at its source rather than fixing its symptom.
5. **The IA fix is the accessibility fix.** The window rail holds **all 9 sub-44px touch targets and 14 of the 16 viewport overflows**. Removing it as a menu removes them as defects.
**Blockers recorded, not worked around:** `library.json`'s `name` (max 75 chars) and `one_liner` (max 346) are research fields, not interface copy; rendering them reproduces the truncation defect. A display-copy layer (`cardTitle` ≤34, `cardLine` ≤66, **derived from the record, never invented**) is CMO work and gates wiring the real library. Separately, the existing fixture covers only 5 of 9 windows, so **w2, w5, w6 and w7 render the thin-window state permanently** — including w7 (Saturday, the flagship, 40 real entries). That is a hole in the fixture, not a bug in the empty state, and is a real part of why Dates feels bad.
**Rejected:** P5's exhaustion arithmetic (24 both-alert items ≈ 4.5 months) was computed against a *weekly Saturday tab*; windows fire **daily**, 98 activities carry **214 window-fits**, and the both-alert constraint binds only on w7, which holds 40 — roughly nine months of Saturdays. Where repeats do occur, **a repeat is not a failure**: never mark a card seen, dim it, sort it last, or apologise for it. That would be a "seen" status, banned outright.
**Reversibility:** reversible — spec only, no code written yet. `HostedDates.tsx` and its fixture stay on disk, unrouted; its final home is a CPO call.
**Owner:** design-lead, accepted by ceo (session ceo-4)
**Affects:** anyone building Dates (read the spec, not the CEO's coverage metric); anyone applying that metric to any DECO surface; CMO (display-copy layer); CPO (where HostedDates lives).

## 2026-08-06 — Wave 4 passes two independent Full-tier gates — and semgrep did not run

**Context:** `integration/wave4` (21 files, +1106/−199) gated twice. The CEO spawned a second QA-Lead believing the first had stalled; it had not, and returned PASS mid-flight. On discovering that, the CEO told the second agent immediately and committed **before knowing its answer** that a BLOCK from it would stand over the existing PASS. It concurred independently.
**Decisions:**
1. **PASS at Full tier, twice, reached separately.** Findings across both: **0 P1, 1 P2, 3 P3.** The P2 is the pre-existing `lib/session` flake (~11%, reproduced 2/18, `lib/session/` absent from the diff). The P3s are a stale jsdom comment, an `error.digest` coupling to a Next.js internal, and `package-lock.json` drifting beside the maintained `pnpm-lock.yaml`. All five behavioural-law checks HOLD in both verdicts.
2. **⚠️ `semgrep` did not run — the binary is not installed.** This is a real gap against the project's own Lite-and-above pipeline, not a judgement call. Manual review by security-engineer, code-reviewer and adversary-engineer covered the same pattern categories with zero findings, but **that is compensation, not equivalence. Install semgrep before the next Full gate rather than letting substitution become precedent** — this project has already had to void two standing exemptions that began as reasonable accommodations.
3. **Two gate agents means the stricter verdict governs.** Recorded as process: a CEO who holds a PASS may not go looking for a second one, and must commit to honouring a BLOCK before hearing the answer.
**Incident, self-disclosed and independently verified:** the second agent accidentally ran `git checkout main -- .` inside the `integration-wave4` worktree, caught it via `git status`, and reverted. The CEO verified rather than accepted: HEAD `a6fbde6`, zero uncommitted, and the **working-tree hash identical to the merge commit's tree**, with all three fixes confirmed present. Trunk intact. Unprompted disclosure of a self-inflicted near-miss is the behaviour this project needs and is recorded as such.
**Outstanding structural problem, which outranks the verdict:** the auth gate was approached three times in one day by three agents along three routes (middleware bypass, token minting, `.env.local` symlink). None was bad faith. **Refusing each attempt is not a fix** — workers need to verify UI and have no legitimate path to a session. Likely answer is a dev-only session fixture that never touches the live credential: Irreversible tier, founder sign-off plus security-engineer, not briefable on CEO authority.
**Reversibility:** nothing merged. `main` untouched at `860d2c7`; all work sits on five branches.
**Owner:** ceo (session ceo-4), verdicts by qa-lead ×2
**Affects:** whoever merges Wave 4 (PASS ×2 in hand, founder confirmation still required); CTO (file the three P3s, install semgrep, close the e2e `TEST_ENV` dual-sourcing failure); anyone gating a Full-tier diff before semgrep is installed.

## 2026-08-06 — The Book becomes something you make: pages are composed by hand

**Context:** Founder opened the Wave 4 build on a phone and asked two things — *"I want the book layout to hold more than 1 image in the page"* and *"where is the edit book part?"* Investigation showed these were one question. **A page holds at most two photographs because a page IS a shared day** (`Spread.tsx`: `evaPhoto && adamPhoto ? pair : single`) and each of them leaves one thing a day — a data-model fact, not a layout limit. And **no edit surface exists anywhere in the app**; the only trace is a comment in `Dock.tsx` describing tools that were designed for and never built.
**Decision:** **Pages are composed by hand.** Pick photographs from the archive, place them, tape them, write on them. Auto-composed pages remain the default; any page can be opened and reworked. Hand-composition **is** the edit feature — the two founder questions have one answer.
**Rejected, with the founder seeing all four:** a page becoming a week/month span (fuller pages immediately, but the Book still makes itself and you never touch it); leaving more than one thing a day (weakens *leave one true unperformed thing*, which R1 identifies as the whole point — more posts per day is what turns leaving into performing); and spans-first-composition-later. **He chose the largest build and the one that changes the Book's nature.**
**Why it is coherent rather than scope creep:** the tray was built anticipating exactly this — *"scissors, tape and the pen when editing arrives… the editing tools arrive as additional `<TrayTool>` children when edit mode is found"* — and the material primitives (`Taped` with 12 washi patterns, `Mounted`, `Pinned`, `Torn`, `Polaroid`) already exist and are already law-compliant. `BookSheet` already clips nothing, so children may overhang a page the way a mounted photograph does. This is the second half of a design that was only ever half-built.
**The hard constraints it must satisfy, none of them negotiable:** **composing is never solicited and there is no prepared place** — so a page must reveal it can be reworked without a plus, an empty well, a dashed rectangle or a hint; placement must feel like placing an object using **one thumb at 393×852**, which is the central unsolved problem; **nothing is ever consumed**; no "seen" status may be smuggled in via change-visibility; and `PRODUCT-VISION-V2` §6 commits that either of them can carry the whole archive out of the building alone at any moment — **a composed layout must not compromise that export**.
**Routed:** CPO for the product spec (who may compose, archive immutability, change visibility, discovery, and the argument against building it at all); Design-Lead for the making metaphor (thumb placement, tray transition, whose hand writes, undo, motion). Both spec-only, both instructed to surface founder questions rather than decide them quietly.
**Sequencing:** `integration/wave4` (PASS ×2, unmerged) changes the Book's geometry and must land first — this work builds directly on it.
**Reversibility:** decision only; no code written. Likely Irreversible tier once built, since composed layouts are new persisted state.
**Owner:** ceo (session ceo-4), founder-decided
**Affects:** CPO, Design-Lead, CTO (new persistence + offline/outbox for edits + conflict handling across a seven-hour gap), QA-Lead (a diff that adds persisted user state is Irreversible tier).

## 2026-08-06 — Composing the Book: either partner, one quiet line, plain-data export

**Context:** Three open questions from the hand-composed-pages spec, all surfaced by CPO rather than decided quietly, all answered by the founder with CPO's recommendation.
**Decisions:**
1. **Either partner may compose the whole page**, including moving and re-mounting the other's photograph — not "your own half." Composing is non-destructive and always resettable, which is what separates it from the `feat/unilateral-remove` precedent (correctly scoped to authorship because it *destroys*). Material argument, and the decisive one: **washi tape exists to bridge two objects, so a two-person page is one shared object, not two glued halves.**
2. **Change visibility is exactly one line**: *"arranged by [name] · [absolute date]"*, typeset in **Outfit** (the app's voice for facts), **never handwritten**. **No push, no badge, no dock dot, no marking composed pages as different-in-kind while browsing.** It answers *what changed* without answering *have you looked* — the line between banned seen-status and permitted change-visibility. No second channel may be added.
3. **Export is plain data** — photographs plus a small human-readable record of the arrangement, **no rendered page snapshots**. VISION §6's promise is about what they made and said, not about recreating this app's paper-and-tape rendering outside it. Consequence for implementers: **the composition model must be expressible as readable data (positions, rotations, mounts, tape), never an opaque blob.**
**Still open, raised by the CEO because the above does not settle it:** whether a person may write a caption **in their own hand onto the other's photograph**. "Either partner, whole page" answers *placement*, not *authorship*, and the spec is explicit that composition never touches a photograph's record, caption or authorship. `font-eva` and `font-adam` are distinct hands precisely so authorship reads at a glance. Routed to Design-Lead to propose a treatment rather than assume.
**CPO's argument against its own spec, recorded because it is the strongest objection anyone has raised and the risk does not exist today:** an untouched auto-composed page currently means only *"nothing else was true of this day."* Once composing exists it can also mean *"nobody has bothered to make this day nice yet"* — **the verdict-on-a-day the project spent two design passes removing** (§2.2, *"you have removed the counter and kept the ledger"*). Secondarily, the composed-by stamp risks becoming a visible-effort tally if one partner composes more than the other, which §4.2 bans outright (*never record or display who left more*). Mitigations in the spec are believed sufficient but are mitigations against a risk this feature introduces. **The founder chose the largest option with these costs stated.**
**Reversibility:** decisions only, no code. Once built, Irreversible tier — composed layouts are new persisted user state.
**Owner:** ceo (session ceo-4), founder-decided, spec by cpo
**Affects:** Design-Lead (one shared object with two hands in it; one visibility channel only; state must be plain data); CTO (persistence, offline/outbox for edits, conflict handling across a seven-hour gap); QA-Lead (Irreversible tier); anyone touching the export path (§6 promise unchanged).

## 2026-08-06 — §0 is overridden by the founder: every screen gets a taped paper band, and it carries the two clocks
> ⚠️ **THE MATERIAL IN THIS ENTRY IS SUPERSEDED.** The band is DECO (night sky), not paper-and-tape — see *"The band is the night, not a piece of paper"* below. Everything else here (that §0 is overridden, that the clocks are its contents, that search and hamburger are refused, that one band also fixes the tab-switch jump) still stands.

**Context:** The founder used the app on a phone and said the top of the home screen is *"filled empty"* — it needs *"an access section that starts with an image, maybe the times, the clocks like we used to had, or a headline… something well designed."* And between screens, *"a header or a strip… something up there and not just continue the page, because it needs the structure, the layout."* Four of his other observations were measured and all four are true: the page turn is a scroll-snap carousel (`BookObject.tsx:206` — `snap-x snap-mandatory overflow-x-auto` with a decorative `perspective`), the tab-switch jump is structural (`(app)/layout.tsx:38` pads every route, then Today and Book each cancel it and re-apply *different* top padding while Dates and Send do not), 22 of 44 generated assets are never rendered, and the lay probe is laggy in his hand.

**The rule being overridden:** `today/page.tsx` carries *"No masthead, no greeting, nothing above the item (§0). The photograph is Today's masthead."* The bare top was **deliberate law, not an oversight.** The founder overrode it knowingly, having been told it was a rule.

**Decision:** **§0 becomes: nothing above the item except the band.** One physical object — a paper strip taped across the top with washi, torn lower edge — present on **every** route at a **constant height**, contents varying by place. It carries **both city times and the date**. It is explicitly **not** chrome: not a nav bar, not a toolbar, not a floating header.

**Two forms refused, and why they are refusals rather than preferences:**
- **A search bar** — the founder offered it as an option. Wave 4 *deleted* the Book's search control four days ago on the ruling that **a search control that does not search is a prepared place**, which the law bans outright. Re-adding one re-commits the violation we just paid to fix.
- **A hamburger ("three lines")** — the app is three places plus the pen, all already present in the dock. The menu would open onto nothing, which is the same violation wearing a different icon.

**Why the clocks, specifically:** `components/home/DualClocks.tsx` **is already built** — both cities, `type-masthead` live-measured at 58.95px, the largest type in the product — and **is imported by nothing.** It has been dead code in the tree since the foundation review. The founder asked for "the clocks like we used to had" without knowing they still exist. This also resolves the standing finding that nothing on any authenticated surface takes the large end of the type scale. The clock **displays**; it still does not **select** — the 2026-08-02 rule that the clock does not drive what is shown is untouched.

**The band is also the fix for the tab-switch jump.** A constant-height object present on every route forces the shared shell that does not currently exist. One structure answers two of the founder's complaints; they were never separate problems.

**Reversibility:** reversible — presentation only, no schema, no persisted state. Expected `risk:full` on LOC and cross-route blast radius, not on data.
**Owner:** ceo (session ceo-4), founder-decided from three options shown as sketches
**Affects:** Design-Lead (band material, height, per-route contents, what §0 becomes in the law text); CTO (shared shell, route transition, must host a fixed-height band); frontend-engineer (every route's top offset changes); QA-Lead (cross-route diff, and the band must not introduce a control that does nothing).

## 2026-08-06 — The review harnesses become dev-only public: the fifth stall on the auth wall is the last one

**Context:** Three Wave 5 workers were dispatched and **all three were blocked by the permission classifier**, correctly. The CEO had instructed each to `git apply` the founder's own uncommitted dev-door patch so it could see its work in a browser. Read from outside, "apply this auth-bypass patch" in an agent brief is indistinguishable from one agent talking three others into disabling authentication — the exact pattern stopped three times already this project. **The CEO did not retry it reworded, and should not have written it in the first place.**

**The root cause, stated plainly because it is the most expensive fact in this repo:** workers build UI in isolated worktrees and **cannot open the app to see their own work.** Every route, including the `/review/*` harnesses, is behind the login wall. So reviews verify that code is *correct* and never that the thing *works*. **Seven QA-Lead PASS verdicts were issued on an app the founder then called "very, very bad."** Every one of those reviews was competent and none of them could open a page. Five agents have now stalled here; three were stopped forcing it (middleware bypass, minting a token against the real `SESSION_SECRET`, symlinking `.env.local`).

**A near-miss worth recording separately:** CTO reported that dev middleware no-ops outside production and therefore `/review/*` needs no login. It read `middleware.ts` **in the main repo, where the founder's 18-line dev-door patch is applied in the working tree only.** That patch is not on `origin/main`. The claim was true where it was read and false in every worker's worktree. **This is the `jsdom` trap again — a fact true in one worktree, assumed global** — and it would have sent three workers into the wall with a brief telling them there was no wall.

**Decision (founder-signed-off, from three options with the trade-offs shown):** `/review/` becomes a **public prefix only when `NODE_ENV !== "production"`**. Real app routes (`/today`, `/book`, `/dates`, `/send`) and every `/api/*` except the already-public `/api/img/` stay gated in all environments. `next build` inlines `NODE_ENV` as the literal `"production"`, so the prefix must be provably absent from the production middleware bundle — demonstrated by command output, not asserted.

**Rejected:** (a) granting agents standing permission to apply the blanket dev-door patch — it opens the *whole* app rather than the harnesses, stays uncommitted so every worktree must redo it, and would keep tripping the classifier for good reason; (b) building blind this wave — zero new attack surface, but it is precisely the process that produced the seven PASS verdicts, and all three Wave 5 defects are visual by nature (cross-route consistency, a motion defect whose static frames already looked fine, and a frame-timing measurement). None can be honestly signed off from source.

**Explicitly NOT decided, and not to be decided quietly:** whether any `/api/*` route opens. If a harness turns out to need one, the implementer must return the finding rather than widen the allowlist. Opening an API route is a materially different decision from opening a static harness page.

**Reversibility:** Irreversible tier — middleware is the app's only real security boundary. Gate: backend-engineer implements → security-engineer audits → QA-Lead verdict → founder confirms merge. **CEO and CTO cannot override a BLOCK here.**
**Owner:** ceo (session ceo-4), founder-signed-off
**Affects:** every future worker (browser verification stops being a blocker); QA-Lead (may now require live verification as gate evidence rather than accepting source review); security-engineer (owns the audit); anyone tempted to widen `PUBLIC_PREFIXES` later — do not.

## 2026-08-06 — The band is the night, not a piece of paper

**Context:** The founder chose the top band from three sketches and picked *"the two clocks, as a taped paper band."* Design-Lead was briefed to design into that choice and **argued against it instead.** The founder heard the argument and ruled for Design-Lead, reversing his own earlier pick.

**The argument, which is the whole point:** **paper is what they MADE. The clocks are the distance BETWEEN them, which is DECO by the law's own allocation table.** A clock printed on paper claims the hours apart are something they made. They are not — the distance is the one thing in this product neither of them chose. Putting it on paper is a category error, not a style preference.

**Decision:** the band is `--night-sky` with the current screen's paper **torn down away from it** — the page hangs below the night rather than a strip sitting on the page. `Seam.tsx` **rotated 180°, not flipped**: a mirrored meander would twin Today's existing lower tear, and two identical tear profiles on one screen read as a repeat rather than as material. **No washi tape on the band at all — tape belongs to paper.** Height **56px + safe area**. **Contents identical on every route** — Design-Lead explicitly rejected the CEO's "contents varying by place"; one invariant object on Today, The Book, Dates and Send.

**§0 becomes:** *nothing above the item may be **about** the item.* The band is the single exception: invariant, never empty, **and never a skeleton.** `DualClocks.tsx` currently renders shimmer in a `.well` before hydrate — Design-Lead flags it as precisely the component a future agent will wrongly reach for. The band must never show a loading state; hydration-safety has to be solved another way.

**Unchanged from the superseded entry:** that §0 is overridden at all, that the clocks are the contents, that a search bar and a hamburger are refused, and that one constant-height band is simultaneously the fix for the tab-switch layout jump.

**Reversibility:** presentation only, no schema. Risk tier raised **lite → full** when folded into `feat/shared-route-shell`: it touches every authenticated route and adds always-on, founder-visible UI.
**Owner:** ceo (session ceo-4) · argued by design-lead · founder reversed his own pick on the argument
**Affects:** CTO + frontend-engineer (`Seam.tsx` reusability inverts — it hardcodes a `--night-sky` falloff that was a mismatch for a paper band and may now be a direct fit; re-verify rather than carrying forward the earlier "strip the gradient" instruction).

## 2026-08-06 — What earns a flower: a job, or a hand — never an empty-looking page

**Context:** The founder: *"in the book we generated a lot more stuff like the flowers and a lot more visuals that we can add to make it look prettier — think about how we actually do it correctly."* The CEO counted 22 unused assets by grepping for source references. **Design-Lead counted from behaviour instead and found 27 of 44** — `app/dev/materials/page.tsx` calls `notFound()` in production, so every asset whose only reference is that bench has never rendered in the product. **Zero stickers of any kind have ever appeared on a page, including the rose and Eva's sunflower.** Eva's motif — one of the only first-person facts that exists about her — has never been on screen.

**Decision — the rule, which governs every future ornament:** **a material earns its place by doing a job, or by being placed by a hand. "The page looked empty" is never a job.** Fasteners (tape, pins, ties) may be placed by the app, because fastening is a job. **Ornaments may never be app-placed, ever.**

**The consequence, and the elegant part:** no pressed flower can ship before hand-composition exists — **but floral washi tape can**, because a flower printed on a fastener is a flower nobody had to fake placing. `TapeVariant` already declares `floral-pressed` and `floral-blue`; only the image plates are missing. **Eva's sunflower reaches the table this week for the cost of two assets and no change to the law.**

**Dispositions:** 3 place · 6 keep as source (keyed masters and grade steps — retiring them destroys the ability to re-crop) · 10 retire · 8 hold for the drawer. The three sunflower renders are an unconcluded generator bakeoff; **`-v3` won.**

**⚠️ Trap for whoever adds the floral plates:** widening the tape pick list **re-rolls the tape on every item that already exists**, because `seededPick` uses `floor(seed × length)`. Free today because the archive is fixtures. **Not free after the first real photograph** — after that, changing the list silently rewrites history.

**Reversibility:** reversible. Retirements should move assets rather than delete them until the drawer set is settled.
**Owner:** ceo (session ceo-4), rule authored by design-lead
**Affects:** anyone adding ornament assets (the rule is now the gate); whoever builds hand-composition (pressed flowers unblock only there); anyone touching `seededPick` or `TapeVariant`.
