---
date: 2026-08-02
role: cto
task: ldr-app-arch
revision: v5
status: Complete
type: architecture-planning
qa_verdict: N/A (planning invocation — no code produced, nothing to gate)
tier: n/a
deliverable: docs/03-system-design/LDR-APP-ARCHITECTURE.md
---

# Session Log: CTO — Eva & Adam App Architecture

**Date:** 2026-08-02
**Lead:** CTO
**Task:** Private PWA — architecture, data model, shared-day semantics, photo pipeline, Phase 1 worker dispatch plan
**Status:** Complete (planning only; no workers spawned, no code written)

---

## What Was Done

**v1** — first architecture: system shape, Supabase schema, day model, PWA strategy, photo pipeline, auth, ranked risks, paste-ready dispatch plan. Derived a fixed 08:00 UTC couple-day anchor from the nine research windows. Independently found that the IL↔NYC gap is 6 hours for 26 days a year, not a constant 7.

**v2** — absorbed the CEO's first correction set: adopted CPO's local-date shared day (reversing my own anchor on the merits), made the tally monotonic, deleted `pauses`/grace/decay, raised storage security for confirmed intimate content, verified both `library.json` ingest hazards against the actual file.

**v3** — absorbed the final founder answers:
- **Ran the day-model reconciliation the CEO asked for and reported a divergence verdict** (§3.8), measured minute-by-minute across 2026.
- **Restructured private content from a column into a physically separate vault** (§5.5) per CPO D1 — separate table, storage prefix, routes, repository module, SW path rule, and no thumbnail artifact at all.
- **Specified batch upload** (§5.9) now that HEIC from the iOS picker is the default case and first run is a large batch over cellular.
- Confirmed pair binding at the extremes, applied the "Eva & Adam" identity, dropped RTL/i18n from scope, gated the storage migration on founder sign-off.

**v4** — CEO's final day-model ruling applied and closed (§3.9); region, backup and encryption confirmed; **hosted dates sized and specified (§3A)**; seam toggle re-anchored to each person's local midnight per the CEO's retraction; free-tier pause risk, OPFS, `storage.persist()`, the notification rule and the iPhone 14 device floor absorbed; **dispatch plan re-cut to 19 tasks in 8 waves**.

## Files Changed

| File | Change |
|------|--------|
| `docs/03-system-design/LDR-APP-ARCHITECTURE.md` | Created (v1), rewritten (v2, v3), amended (v4) — the deliverable |
| `docs/03-system-design/adr/ADR-001-supabase-region.md` | Created — `eu-central-1`, irreversible, jurisdiction as the deciding argument |
| `docs/08-agents_work/sessions/2026-08-02-cto-ldr-app-arch.md` | Created, updated through v4 |

## Decisions Made

- **Day-model reconciliation: THEY DIVERGE.** CPO's 31-hour local-date day and my 08:00 UTC anchor are not the same concept expressed differently. Measured across all of 2026: they disagree for **44.1% of Adam's year** (his local 00:00–10:00/11:00, every day) and **15.2% of Eva's** (her local 00:00–03:00/04:00). Structural, not a DST edge case — DST only changes the band width by an hour. If both models coexisted in one codebase, ~a third of posts would be silently mislabelled with no error thrown. **CPO's model adopted, mine retired**; the ban on numeric offsets plus T6's golden set is the tripwire against a stray `-8h` resurrecting it.
- **Pair binding confirmed guaranteed** at both extremes: Adam at IL D 00:00:01 and Eva at NYC D 23:59:59 are 31 h apart and both bind to D; reverse order also holds, with Adam posting 17 h before Eva's day begins. The query has no ordering assumption, so "who posted first" is not a concept the data model has.
- **The vault is structural, not a flag.** `vault_items` is a separate table with its own storage prefix, routes, repository module and SW path rule. `photos` has **no `sensitivity` column** — if a row is in `photos`, it is not private, so there is no boolean anyone can forget. **No thumbnail derivative is ever generated for a vault item**, which removes the artifact rather than trusting it not to escape. `book_entries.photo_id` FKs to `photos`, so the database itself refuses to put a vault item in the book.
- **Recommended a separate `VAULT_PASSPHRASE` (§0.6).** One env var, and it is the difference between a stolen shared password reaching the private content or not. The single cheapest real security improvement available.
- **Batch upload built around never dropping an item.** Outbox durable before any processing; **sequential** decode with explicit `bitmap.close()` (parallel 12 MP HEIC decodes exhaust WKWebView memory); upload concurrency 2; **signed URLs requested just-in-time in chunks of 5**, because a 2-minute TTL against a 30-photo batch expires mid-run; 5 retries then the item stays queued; persistent per-item UI, never a toast.
- **Live Photos, burst and HDR resolved rather than left to production.** The picker delivers only the still frame for a Live Photo, so they degrade automatically with no work. HDR gain maps are lost in the canvas re-encode — a real, visible quality loss, accepted and stated, with Display P3 attempted and recorded in `color_space`.
- **The tally filters on `purged_at`, not `deleted_at`** — so tidying up an old photo cannot retroactively erase a day they both showed up for. Had it used `deleted_at`, that would have been a decay path by accident. Flagged to CPO to confirm it matches D3's intent.
- **`members.slug` is `eva`/`adam`, not `a`/`b`.** The library's `couple.a`/`couple.b` ordering (Adam first) is the opposite of the product name ordering (Eva first), and an index-style slug is exactly how a wrong-attribution bug gets written.
- **`<Spread>` is one shared component** owned by T9 and consumed by T10, with its interface fixed in the contracts section so both build in parallel. Two independently-written page renderers was the obvious duplication and is explicitly avoided.
- **Stated deviation retained** (§5.4): the read path is a stable cookie-gated proxy rather than signed read URLs. A signed URL is a bearer token that survives outside the session and breaks SW caching, which kills the offline book. Flagged for QA-Lead or founder override.

### v4 decisions

- **Dates: 4.5 worker-days across 4 tasks.** One engine serves the story and twenty questions; **the paired question does not run on it** — it is the daily photo pair with text, riding the `shared_day` completion logic already being built, which is cheaper than the framing assumed. Twenty questions adds ~20–25% over the story for its hidden-state visibility rule and asymmetric view, not a second implementation.
- **`book_entries` changed before T2 runs:** `photo_id` is now nullable with a `date_id` alternative and a photo-XOR-date CHECK, because a finished date writes a text page. This is exactly why dates needed to land before the migration rather than after.
- **No Realtime in Phase 1, and not on cost grounds** — cost is verified as a non-issue. The median gap between turns is *hours*; a websocket, subscription lifecycle and reconnection logic buy nothing against a latency nobody is waiting on. `GET` on focus covers it.
- **Fade is derived, never scheduled** — the third of the three mechanisms that look like they need a job and don't. Reinforced by the platform: a backgrounded iOS PWA is off, not asleep, so client-side scheduled work does not exist here.
- **`failed` / `abandoned` / `expired` banned in CI**, not by review. A word that cannot exist in the schema cannot leak into a screen.
- **T5 protocols get `hostable: false` derived at build time** — hosting a protocol async converts its core mechanic into its documented failure mode (contraindicated by truncation), so the constraint is a build-time assertion rather than a backlog note.
- **OPFS accepted for the outbox, rejected for the book cache.** The queue holds hundreds of MB of pending blobs — the exact case where OPFS beats IndexedDB. The book cache stores HTTP responses read by the SW fetch handler, so Cache Storage is the correct API; moving it would mean hand-reconstructing `Response` objects to reimplement the platform. `navigator.storage.persist()` adopted as a second eviction lever alongside the install exemption.
- **Keep-alive is the nightly backup job** — one workflow, two purposes, so it cannot drift out of sync with itself. Comment states the consequence, heartbeat in `app_settings` surfaces staleness in-app, removal condition on Pro recorded.
- **R2 Standard class is verified by the job**, not documented — Infrequent Access carries a retrieval charge that would quietly destroy the restore-costs-nothing property that justified choosing R2.
- **Seam toggle re-anchored to each person's local midnight.** Not a correctness mechanism; it covers "it's 00:30 but this is still Tuesday night to me" and the mid-flight/stale-timezone case that device-zone preference introduces.
- **Separate vault passphrase APPROVED** (§0.6). Two requirements are now binding and asserted rather than reviewed: **(a)** independently generated with its own salt — the app refuses to boot if the two secrets share a salt or hash; **(b)** **no route may redirect through the vault unlock**, and no session-expiry flow may present it. (b) is a habituation defence and the reason it is architectural: if the passphrase is ever demanded en route to something ordinary, it becomes muscle memory and degrades into the first password with extra steps. R4 drops from High to Medium-High as a result, and R4b is added for the habituation risk.

### v5 decisions

- **iOS 26 confirmed on both devices.** Page-turn moves to `animation-timeline`; the JS animation layer — gesture handling, rAF loop, velocity threshold, reduced-motion branch — disappears entirely. **T9 re-derived to ~1 worker-day from ~2.** Stated explicitly what iOS 26 did *not* fix: Background Sync, Web Share Target and background execution are all still absent, and those are precisely the three constraints that shape this product. Declarative Web Push moves from "when it lands" to available now, and should be the default push mechanism because it executes no JS — the notification channel becomes provably not a data channel.
- **Liveness monitoring moved outside GitHub's failure domain** (§5.8b). GitHub's auto-disable is scoped to public repos, so **"the repo stays private" is now a recorded load-bearing dependency** rather than an accident of configuration. Both undocumented behaviours assumed worst-case: scheduled runs do not count as activity, and auto-disable notifies nobody. Primary monitor is a Cloudflare Worker cron watching the **R2 manifest's `Last-Modified`** — watching the artifact rather than a synthetic ping proves the backup wrote bytes, so one check covers R1 and R13 together. The in-app heartbeat stays as a secondary signal but is explicitly blind during the quiet week the risk exists for, since it needs someone to open the app.
- **Partner presence lifted out of the dates engine into `lib/shared-day/presence.ts`** (§3.10, T6). Three surfaces consume it — the partner-clock line, the "their day hasn't started" empty state, and the dates waiting state — so building it in T14a would have meant reimplementing it twice. Typed as an inference (`'asleep' | 'working' | 'awake' | 'unknown'`) with `'unknown'` as a renderable value, because it is derived from local hour bands plus work weeks, not a device signal. Pure function of `now()`; no presence table, no heartbeat.
- **Net Phase 1 growth is ~4 worker-days**, not 4.5: dates +4.5, T9 −1, T11 +0.5.

## What's Next

1. Founder resolves §0 — **region (blocks T2)**, backup target (blocks R1), vault passphrase, and migration sign-off.
2. CEO spawns Wave 1 (`P1-T1`), then Wave 2's four parallel tasks (T2, T4, T6, T7-UI).
3. Design-Lead's page-turn spec unblocks T9 and, via the `<Spread>` contract, part of T10.
4. QA-Lead briefed at Wave 7 with the §10.4 tier map; CPO's AC-24→AC-32 are non-waivable.

## Blockers / Open Questions

- §0.1 region, §0.5 backup target, §0.6 vault passphrase, §0.7 migration sign-off — all founder, all in §11.
- CPO: does the purged-vs-deleted tally rule match D3's intent? How large is the backlog import (the lever on when the Supabase Pro step lands)? Reveal-on-post gating? A daily prompt (turns a view into a table — cheaper before T2)? Is the tally displayed at all?
- Design-Lead: page-turn interaction spec.

---

_Session by: CTO | Date: 2026-08-02_
