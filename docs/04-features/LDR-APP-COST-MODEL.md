# The LDR App — Running-Cost Model

**Author:** CBO · **Date:** 2026-08-02 (v2 — updated against locked infra decisions, verified live pricing, and the confirmed backlog answer) · **Status:** Complete
**Scope:** What does "Eva & Adam" cost to run, forever, for exactly two people — and where does that number silently escalate.
**Companion docs:** `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.4 (storage/cost), §5.5 (backup), §9 (risks); `docs/04-features/LDR-APP-PRD.md`.

**Reversibility of this document's recommendations:** **easy** throughout — every recommendation here is a config/tier choice, reversible within a billing cycle, with one exception: the Supabase region (`eu-central-1`) is locked and irreversible, but that was CTO's decision, not a cost decision, and this document treats it as fixed.

**v2 changelog, so it's clear what moved and why:**
- Infra decisions locked (region, backup shape, encryption posture, no native wrapper in Phase 1) — modeled against those specifically rather than compared as options.
- **Backlog confirmed at ~300 photos.** The light scenario in v1 is now the actual base case, not a bracket edge. The v1 "$0 vs. $600 over 24 months" swing resolves to **$0**.
- **All vendor prices below were fetched live on 2026-08-02** and are labeled `(fact)` with source and access date, replacing v1's `(recall)` labels.
- **R2 backup math corrected.** "Automated mirror" (this update's framing) means R2 holds the tiered originals *and* a synced copy of the display/thumb derivatives — not just the originals I priced in v1. That's a real increase in R2's growth rate; it pulls R2's free-tier crossing point in by about a year versus my original estimate.
- **New top-ranked risk added:** Supabase free-tier project pause after 7 days of inactivity, which is an availability risk, not a cost risk, and is shaped precisely wrong for this product (§6, was §5 in v1).
- **New section:** hosted "dates" (interactive shared activities) realtime/turn-taking cost shape, verified against Supabase's actual Realtime free-tier limits (§3).

---

## 0. Sourcing

Every price below was fetched live on **2026-08-02**. Where a claim couldn't be fully confirmed, it's labeled `MEDIUM` or `LOW` confidence rather than presented as settled — absence of a published differential is evidence of likely parity, not proof of it.

| Line item | Value | Source | Confidence |
|---|---|---|---|
| Vercel Hobby | Free. 100 GB Fast Data Transfer, 1M function invocations, 4h active CPU, 360 GB-Hrs provisioned memory | vercel.com/pricing, accessed 2026-08-02 | HIGH |
| Vercel Hobby non-commercial clause | Quoted from the pricing page FAQ, not the Terms of Service | vercel.com/pricing FAQ, accessed 2026-08-02 | MEDIUM — and **not load-bearing** for this app (private, two-person, non-monetized) |
| Supabase Free | 500 MB database, **1 GB file storage**, 5 GB standard + 5 GB cached egress/month, max 2 active projects | supabase.com/pricing, accessed 2026-08-02 | HIGH |
| Supabase Pro | From **$25/mo**. 8 GB DB included ($0.125/GB over), 100 GB storage included ($0.0213/GB over), 250 GB standard + 250 GB cached egress included ($0.09 / $0.03 per GB over) | supabase.com/pricing, accessed 2026-08-02 | HIGH |
| Supabase Realtime Free | **200 concurrent connections, 2,000,000 messages/month** | supabase.com/pricing, accessed 2026-08-02 | HIGH |
| Supabase regional pricing (`eu-central-1`) | No region-specific differential published; pricing appears region-uniform | supabase.com/pricing, accessed 2026-08-02 | MEDIUM — absence of evidence, not evidence of parity |
| Cloudflare R2 storage | $0.015/GB-month, **10 GB-month free** (Standard class) | developers.cloudflare.com/r2/pricing, accessed 2026-08-02 | HIGH |
| Cloudflare R2 Class A ops (writes/lists) | $4.50 per million, 1,000,000/month free | developers.cloudflare.com/r2/pricing, accessed 2026-08-02 | HIGH |
| Cloudflare R2 Class B ops (reads) | $0.36 per million, 10,000,000/month free | developers.cloudflare.com/r2/pricing, accessed 2026-08-02 | HIGH |
| Cloudflare R2 egress | **"Egress (data transfer to Internet) \| Free"** — verbatim, Standard class, no cap | developers.cloudflare.com/r2/pricing, accessed 2026-08-02 | HIGH — this is load-bearing for the whole backup recommendation in §4, and it's now confirmed rather than assumed |
| Cloudflare R2 Infrequent Access retrieval fee | $0.01/GB retrieval — **does not apply to Standard class.** The bucket must be provisioned as Standard, not Infrequent Access, or this fee applies and the "free egress" framing breaks | developers.cloudflare.com/r2/pricing, accessed 2026-08-02 | HIGH — **actionable note for whoever provisions the R2 bucket** |
| Apple Developer Program | **$99/year** (Enterprise is $299 and irrelevant here) | developer.apple.com/programs, accessed 2026-08-02 | HIGH |

**Per-photo derivative sizes** (display ~350 KB, thumb ~30 KB, HEIC original ~2.5 MB) remain `(est. — CTO §5.4)`, not independently re-verified — they're CTO's own engineering estimates for the output of a defined pipeline (canvas resize/re-encode at fixed target dimensions and quality), not a vendor price, so they don't carry a source URL. They should be measured against real device output during P1-T4 and this model revised if they're materially off.

---

## 1. Monthly cost — launch and the 24-month projection

### 1.1 The stack, priced

| Service | Launch cost | Free-tier ceiling | Escape hatch |
|---|---|---|---|
| Vercel Hobby | $0/mo | 100 GB Fast Data Transfer, 1M invocations, 4h active CPU, 360 GB-Hrs memory `(fact, §0)` | Vercel Pro, $20/mo — not needed under any scenario modeled here |
| Supabase Free, `eu-central-1` | $0/mo | 500 MB DB, 1 GB storage, 5+5 GB egress/mo, pauses after 7 days idle (§6) `(fact, §0)` | Supabase Pro, $25/mo `(fact, §0)` |
| Cloudflare R2 Free, Standard class | $0/mo | 10 GB storage, 1M Class A ops, 10M Class B ops/mo, zero egress always `(fact, §0)` | $0.015/GB-mo storage, $4.50/M Class A, $0.36/M Class B beyond free tier `(fact, §0)` |
| GitHub Actions | $0/mo | 2,000 min/mo, personal private repo `(recall — not independently re-verified this pass, unchanged from v1, medium-high confidence)` | N/A — nightly job uses well under 5% of this |
| Domain | $0/mo (`*.vercel.app`) or ~$1/mo amortized | — | Optional, founder preference, not a cost decision |
| Apple Developer Program | Not needed — PWA confirmed, no native wrapper in Phase 1 (§5) | — | $99/year `(fact, §0)`, only if the §5 trigger fires |

**Launch-day total: $0/month**, or **~$1/month** with a custom domain.

### 1.2 The backlog question is answered: ~300 photos, light scenario is the base case

v1 modeled three backlog scenarios because the size was an open PRD question. **It's answered now: ~300 curated photos** ("the good ones," not a camera-roll dump). That's the light scenario from v1, and it changes the headline answer:

| | v1 (unresolved) | v2 (confirmed) |
|---|---|---|
| Supabase storage at launch | 114 MB – 1.14 GB (3 scenarios) | **114 MB** (300 × 380 KB) |
| Supabase free-tier crossing | month 0 – month 38, wide range | **~month 38 (~3.2 years)** |
| 24-month cost | $0 – $600, depending on the unknown | **$0, confirmed** |

Medium (1,000) and heavy (3,000) backlog figures are kept below for reference only — they no longer describe this product, but they're cheap to leave in case the import scope grows before Phase 1 closes.

### 1.3 The 24-month projection, confirmed base case

Using the confirmed 300-photo backlog, CTO's per-photo derivative sizes, and 2 photos/day steady state:

| Month | Supabase storage | Tier | R2 storage (mirror — see §2 for the correction) | Tier | Monthly cost |
|---|---|---|---|---|---|
| 0 (launch) | 114 MB | Free | 864 MB | Free | $0 |
| 6 | 254 MB | Free | 1.91 GB | Free | $0 |
| 12 | 394 MB | Free | 2.96 GB | Free | $0 |
| 18 | 534 MB | Free | 4.01 GB | Free | $0 |
| 24 | 674 MB | Free | 5.06 GB | Free | $0 |
| ~38 | crosses 1 GB | **Pro** | 7.51 GB | Free | **$25** |
| ~52 | 1.33 GB | Pro | crosses 10 GB | Pay-as-you-go | $25 + ~$0.01 |

**24-month total: $0.** The first real cost event lands around month 38 (~3.2 years) — well outside the requested window, and a full year later than my v1 medium-backlog planning default. Budget $25/month ($300/year) starting there; nothing sooner is expected under the confirmed photo count.

---

## 2. The storage curve

### 2.1 Originals-plus-derivatives is still the cheap choice, and still the right one

Unchanged from v1 (§2.1 there): CTO's client-side pipeline (never converts or reprocesses originals, generates fixed-size JPEG derivatives at upload) avoids Supabase's paid image-transform tier and avoids the fragile server-side HEIC pipeline CTO already rejected. HEIC-to-JPEG conversion at matching quality typically *increases* file size 1.5–2x `(est., not re-verified this pass)` — another reason not to touch the originals at all, which the architecture already doesn't.

### 2.2 The R2 mirror correction — this is the number that actually moved

This update specifies R2 as **an automated mirror, not append-only**, and asks me to cost storage, ops, and sync traffic properly. Doing that surfaced a gap in my v1 model: I priced R2 as holding only the *tiered originals* (2.5 MB/photo). A genuine mirror, consistent with CTO's §5.5 design ("rsync of new storage objects → Cloudflare R2"), also carries a synced copy of the display+thumb derivatives — the objects Supabase's own `media` bucket holds permanently — so that a restore doesn't depend on Supabase being reachable at all. That's **2.88 MB/photo in R2** (2.5 MB original + 0.38 MB mirrored derivative pair), not 2.5 MB.

This pulls the R2 free-tier crossing point in by roughly a year versus what I said before — worth flagging precisely because it's a correction, not a new assumption:

| | v1 estimate (originals-only) | v2 corrected (full mirror) |
|---|---|---|
| R2 growth rate | ~1.8 GB/year | **~2.1 GB/year** |
| R2 free-tier crossing, medium-backlog case | ~month 49 (~4.1 yr) | **~month 41 (~3.4 yr)** |

Under the **confirmed 300-photo backlog**, R2 starts at 864 MB and crosses its 10 GB free tier at **~month 52 (~4.3 years)** — still comfortably outside the 24-month window, and the overage past that point stays trivial (§2.3).

### 2.3 Storage at year 1 / 2 / 5, confirmed base case

| | Launch | Year 1 | Year 2 | Year 5 |
|---|---|---|---|---|
| **Supabase** (display + thumb) | 114 MB | 394 MB | 674 MB | 1.51 GB |
| **Supabase tier** | Free | Free | Free | Pro (crossed ~month 38) |
| **R2** (mirror: originals + synced derivatives) | 864 MB | 2.96 GB | 5.06 GB | 11.4 GB |
| **R2 tier** | Free | Free | Free | Pay-as-you-go (crossed ~month 52) |
| **R2 overage at year 5** | — | — | — | ~1.4 GB over × $0.015/GB-mo ≈ **$0.02/month** `(fact, §0, rate; computed overage)` |

Medium (1,000-photo) and heavy (3,000-photo) reference scenarios, recomputed with the corrected mirror math:

| | Medium (1,000, reference only) | Heavy (3,000, reference only) |
|---|---|---|
| Supabase crossing | ~month 27 (~2.2 yr) — unaffected by the R2 correction | month 0 — already over at launch |
| R2 crossing | ~month 41 (~3.4 yr) — corrected from v1's ~4.1 yr | **~month 8 (~0.65 yr)** — new finding this pass: a heavy backlog would cross R2's free tier within the first year, not just Supabase's |

Neither applies to the actual product now that the backlog is confirmed at ~300; kept only in case the import scope changes before Phase 1 closes.

### 2.4 R2 operations and sync traffic, costed properly

The brief asked for storage, Class A/B operations, and mirror sync traffic specifically — not just the storage line I gave in v1.

| Component | Estimate | Free tier | Utilization | Cost |
|---|---|---|---|---|
| **Class A (writes/lists)** — nightly sync: new derivative + original objects, plus list ops for the diff | ~10 ops/day × 30 ≈ 300/month (generous, includes retry buffer) | 1,000,000/month `(fact, §0)` | 0.03% | $0 |
| **Class B (reads)** — monthly cold-copy pull of the full mirror | Year 2: ~1,760 photos × 3 objects ≈ 5,280 ops/pull. Year 5: ~3,950 photos × 3 ≈ 11,850 ops/pull | 10,000,000/month `(fact, §0)` | 0.05%–0.12% | $0 |
| **Mirror sync traffic (nightly upload, GHA → R2)** | Daily delta only (new objects, not a full resync — flat storage layout means no object ever moves, per CTO §2.4) | N/A — this is *ingress* to R2 | — | $0 — cloud storage providers do not charge for data coming in, only going out |
| **Cold-copy pull traffic (R2 → founder's disk, monthly)** | This is R2 *egress* | **Free, confirmed verbatim (§0)** | — | $0 |

**The entire backup operations bill is $0 for the life of the product at this scale** — the headroom on Class A/B ops is 800–3,000x actual usage, not a close call.

---

## 3. Hosted "dates" — the realtime/turn-taking cost shape

New scope since v1: activities become playable inside the app ("dates"), some needing shared state and turn-taking across the 6–7 hour gap. This was flagged as likely negligible but explicitly wanted **verified, not assumed** — so here's the verification.

**Supabase Realtime Free tier: 200 concurrent connections, 2,000,000 messages/month `(fact, §0)`.**

**Usage shape for two people:** a realtime channel only needs to be open while a shared "date" screen is actually in the foreground on both devices — not persistently. Modeling two bounding cases:

| Scenario | Connections used | % of 200-connection limit | Messages/month | % of 2M-message limit |
|---|---|---|---|---|
| **Realistic** — realtime scoped to the active shared-session screen only, session lasts ~30 min/day when it happens, updates every ~5s | 2, only while a session is open | 1% | ~30 min × 12 msgs/min × 30 days ≈ 10,800 | 0.5% |
| **Pessimistic** — both devices leave a realtime channel open 24/7/365 (a scoping mistake, not the intended design) at a chatty 1-second update rate during any activity | 2, constantly | **1%** (connection count doesn't change — it's still 2 people) | 3,600/hr × ~2hr/day active ≈ 216,000/month | 10.8% |

**Cost of hosted dates: $0, verified rather than assumed.** Even the pessimistic, poorly-scoped case sits at roughly 1/10th of the message ceiling and 1/100th of the connection ceiling — this would need roughly two orders of magnitude more usage to become a real free-tier question, which for a fixed two-user product isn't a usage pattern that exists. It would take the product becoming multi-tenant (many couples, not one) to actually threaten this limit, which is explicitly out of scope (PRD §10).

**One design guardrail, costing nothing to state:** scope the realtime subscription to the specific screen where a shared date is actively in progress, not globally across the app. This isn't a cost-driven requirement given the headroom above — it's good practice regardless, and it keeps the negligible-cost conclusion true by construction rather than by luck if a future feature gets chattier than modeled here.

If CPO's feature cut ends up avoiding Realtime entirely in favor of poll-on-focus (consistent with the app's existing "no Background Sync, retry/refresh on next open" pattern for photos, §1.3 of the architecture), the cost is even lower — Vercel function invocations for the polling requests, at a volume far below the 1M/month free allowance. Either implementation path is free; I'd defer the choice to CTO/CPO on UX grounds, not cost grounds.

---

## 4. Backup — costed against the confirmed mirror design

CTO's design (§5.5): nightly R2 sync (now confirmed as a full automated mirror, not append-only) + monthly founder cold copy + mandatory restore drill (P1-T11).

| Component | Cost | Basis |
|---|---|---|
| Nightly `pg_dump` + full-mirror object sync via GitHub Actions | $0 | Well under 2,000 free min/month `(recall, unchanged from v1)` |
| R2 storage (mirror: originals + synced derivatives) | $0 through ~month 52, then ~$0.02/month by year 5, growing slowly | §2.2–2.3, `(fact)` rate |
| R2 Class A/B operations | $0, life of the product | §2.4, `(fact)` free-tier sizes vs. actual usage |
| R2 egress on the monthly cold-copy pull | **$0, always — confirmed verbatim** | §0, load-bearing citation now in hand |
| Founder's own disk (monthly cold copy) | $0 marginal | Existing hardware, not a vendor cost |
| Restore drill (P1-T11) | $0 vendor cost, real engineering time | N/A |

**The zero-egress claim was the one genuinely load-bearing citation in this whole model** — the entire case for R2 over an egress-charging alternative (S3) rests on it, and it's now confirmed against Cloudflare's own page rather than assumed. **One implementation note that follows directly from the citation:** the bucket must be provisioned as R2 **Standard** storage class. Infrequent Access carries a $0.01/GB retrieval fee that isn't "egress" in Cloudflare's accounting but would functionally break the "free restore" framing if the bucket were misconfigured. This is a one-line note for whoever provisions the bucket (T11), not a cost tradeoff.

**Encryption:** platform encryption-at-rest, not end-to-end, per the locked decision. There's no key-management service to cost — that's not a corner being cut, it's simply not part of this design, so it doesn't appear as a line item anywhere in this model.

**What I still refuse to cheap out on:** the restore drill, unchanged from v1. It costs $0 in vendor fees regardless of how it's done, so skipping it doesn't save money — it just converts a $0/month asset into an unverified one at zero savings. Still not buying Supabase PITR either (unchanged reasoning from v1 §3) — the nightly mirror already delivers a ≤24h RPO for $0, and PITR would pay to duplicate that.

---

## 5. PWA vs. native — future-option analysis, not a live decision

**No native wrapper in Phase 1 is confirmed.** This section answers "what would it cost, and when would it be worth revisiting" as a standing reference, not a decision pending action.

### 5.1 What staying PWA-only saves

| Cost avoided | Amount |
|---|---|
| Apple Developer Program | **$99/year** `(fact, §0)` |
| App Store review latency | 24–48 hours per submission, historically `(recall, directional)` |
| Toolchain overhead | No Xcode/provisioning-profile/TestFlight management |
| Ongoing OS-cycle maintenance | No annual rebuild-and-resubmit cycle |

### 5.2 The one thing the PWA gives up, quantified

iOS Safari has no Vibration API — haptics are categorically unavailable, a platform ceiling, not a bug. Cheapest fix if ever needed: Capacitor wrapper.

| Component | Cost |
|---|---|
| Apple Developer Program | **$99/year** `(fact, §0)` — practically mandatory even for private use, since free personal-team provisioning profiles expire every 7 days |
| A Mac + Xcode | $0 marginal if already owned; a hard build-time requirement regardless |
| Ongoing maintenance | No hard dollar figure — a few hours/year of engineering-agent time tracking SDK bumps |

**Total: ~$99/year plus a standing Mac/Xcode dependency**, to recover one missing feedback channel.

### 5.3 Trigger condition — unchanged from v1, restated as a future option

**Not now.** $0 CSS/Web Animations tap-feedback substitute in the meantime. **Revisit only if:**
1. iOS Safari ships Vibration API support (makes the whole question free and moot), **or**
2. After **at least one month of real daily use**, either partner repeatedly and non-speculatively identifies the lack of haptics as an actual gap.

The gate is evidence of need, not the $99 — that's cheap in isolation, but it's not worth spending against a hypothetical.

---

## 6. Ranked risks — cost and availability together

This section now leads with an availability risk, not a cost one, per this update's explicit request. It belongs here rather than in a separate document because the mitigation is a cost decision (a free keep-alive vs. a $25/month tier change), and I want the two things a founder actually cares about — the app being *there* and being *affordable* — evaluated together.

### 6.1 — TOP RISK: Supabase pauses free projects after 7 days of inactivity

**Finding, HIGH confidence:** "Free projects are paused after 1 week of inactivity" — Supabase's own pricing page, accessed 2026-08-02.

**Why this ranks above the storage cliff:** it's not a cost risk, it's an **availability failure mode, and it's shaped precisely wrong for this specific product.** A couple's app goes quiet exactly when life gets hard — illness, travel abroad without a working connection, a fight, a bad week where nobody opens it. The failure isn't "the bill went up," it's **"the app is down the one time they come back to it after a rough patch looking for exactly the kind of reassurance it's designed to provide."** That's the worst-shaped failure this specific product could have, independent of what it costs to prevent.

**Costed both ways, as asked:**

| Mitigation | Cost | Effect |
|---|---|---|
| **(a) Keep-alive ping** — a scheduled GitHub Actions job hitting the Supabase project on a sub-7-day cadence | **$0** — this is the *same* nightly GHA job already running for the backup sync (§4); a keep-alive is either that job itself (it already touches the DB nightly, which resets the inactivity clock) or a trivial separate cron step, either way inside the free 2,000 min/month allowance with enormous headroom | Prevents the pause entirely, for free, as long as the job runs |
| **(b) Pay for Pro to remove the pause behavior** | **$25/month, $300/year** | Also prevents the pause, but pays $300/year for something (a) already gives away free |

**Recommendation: (a).** CTO's architecture already specifies this exact mitigation — §5.4 states outright: *"the nightly GitHub Action doubles as a keep-alive ping so an unexpected quiet week can't pause the project."* This document confirms it costs $0 and closes the loop with the verified pause-policy citation the architecture doc flagged as needing re-verification. **I'm not recommending anything CTO hasn't already designed — I'm ranking it, costing it, and writing down why it must never be treated as optional.**

**The residual risk, written down so it doesn't get silently removed later:** the keep-alive's reliability depends on the GHA workflow itself staying enabled. GitHub has historically disabled scheduled workflows in repositories with extended inactivity (a repo-level policy, distinct from Supabase's project-level pause) `(recall, medium confidence, not re-verified this pass)`. **Practical mitigation:** the same nightly job that performs the backup sync (§4) is itself an activity signal that should keep the workflow classified as active — but this is worth an explicit line in whatever runbook P1-T11 produces, not an assumption. **Do not remove the keep-alive step to "simplify" the backup job later — it is a second, independent job in disguise, protecting against a different failure mode than the backup protects against, and it happens to be free because it rides along with work already being done.**

### 6.2 — Supabase free→Pro storage cliff

Unchanged mechanism from v1, but **materially less urgent now that the backlog is confirmed at ~300 photos**: crossing moves from v1's medium-backlog planning default of ~month 27 out to **~month 38 (~3.2 years)**. Still a real, discrete $25/month step — still worth budgeting for — just no longer a near-term concern. See §1.3 for the schedule.

### 6.3 — Supabase Storage egress on cold/reinstall book loads

Unchanged from v1: distinct from Vercel's separate bandwidth allowance; mitigated by install-first onboarding + service-worker warm-up caching, which makes this "once per device, ever" in steady state rather than recurring.

### 6.4 — Vercel Hobby's non-commercial fair-use boundary

Confidence downgraded to **MEDIUM** this pass (§0) — the clause is sourced from the pricing FAQ, not the Terms of Service. Not load-bearing for this product's current scope (private, two-person, non-monetized, forever) regardless of which document it lives in.

### 6.5 — Vercel function invocations / GB-hours

Negligible, now with a verified ceiling: 1,000,000 invocations/month free `(fact, §0)` against maybe a few hundred/month of actual traffic from two people. Not a risk.

### 6.6 — Domain renewal

Trivial (~$12/yr); the only real risk is an expired payment method, an admin reminder, not a budget item.

### 6.7 — Server-side image transformation

Correctly avoided by the architecture (client-side canvas resize, §5.2 of CTO's doc) — flagged as a non-risk, not a live one.

### 6.8 — Hosted "dates" / Realtime — verified, not a risk

Closing the loop explicitly per this update's ask: investigated in §3, found to sit at 1–11% of the relevant free-tier limits even under pessimistic assumptions. Included here only so the "was this checked" question has a documented answer.

---

## 7. The cheapest credible configuration

**Recommended stack:** Vercel Hobby + Supabase Free, `eu-central-1` (budgeted escape hatch to Pro, expected ~month 38) + Cloudflare R2 Free, Standard class, configured as an automated mirror + GitHub Actions Free (doing double duty as backup sync *and* keep-alive, §6.1) + an optional ~$12/yr domain.

**Reversibility: easy**, region aside (CTO's call, not a cost decision).

**Recommendation:** Run at $0–1/month for roughly the first 38 months. Budget for the Supabase Pro step ($25/mo, $300/yr) landing around month 38, not sooner, under the confirmed 300-photo backlog. Keep the GHA keep-alive as a permanent, non-negotiable line in the runbook (§6.1) — it's the cheapest availability insurance in this entire model, and the easiest thing for a future cleanup pass to mistake for cruft.

**What I refuse to cheap out on, unchanged in substance from v1, restated against the verified numbers:**

1. **The full mirror backup + restore drill.** Now fully costed (§2.4, §4): $0 for the operations, $0 for storage through ~month 52, pennies after. There is no dollar amount to save by weakening it — the "cheap" and "safe" paths are the same path, confirmed rather than assumed this pass.
2. **The keep-alive ping.** New this pass, but belongs in this list for the same reason: $0, and skipping it trades a free mitigation for the single worst-shaped failure mode this product could have (§6.1).
3. **Supabase Pro the moment storage actually crosses the free tier (~month 38).** Still refusing to recommend photo-quality or backlog reduction to dodge $300/year — that degrades the one deliverable this product exists for to save an amount that's trivial against the app's overall near-zero run cost.
4. **Encryption at rest, signed URLs, EXIF/GPS stripping, RLS deny-all.** Still $0 extra on either Supabase tier — no privacy-vs-cost trade-off exists here, confirmed again this pass with no change.

**What I did cheap out on, unchanged from v1:** no custom domain requirement, no Capacitor/native wrapper absent the §5.3 trigger, no server-side image transformation or CDN, no third-party analytics/monitoring paid tier, no Supabase PITR add-on.

---

## Appendix — what would change this model

- **A live re-verification pass on GitHub Actions' free-minute allowance** — the one line item in §1.1 not independently re-verified this pass (still `(recall)`).
- **The GHA scheduled-workflow-disable-after-inactivity claim in §6.1** — flagged medium confidence, not re-verified; worth confirming before P1-T11's runbook is finalized, since it's the one residual gap in an otherwise-verified backup/availability story.
- **Actual daily-photo cadence deviating from 2/day**, or the backlog import scope growing beyond ~300 before Phase 1 closes — either would move the crossing points in §1–2 proportionally.
- **CPO's dates feature list**, once cut — §3's conclusion (negligible cost) is robust to feature choice at two-user scale, but worth a final check once the actual interaction patterns are known, purely for completeness rather than because I expect it to change the answer.
