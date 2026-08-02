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
