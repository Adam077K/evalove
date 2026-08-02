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
