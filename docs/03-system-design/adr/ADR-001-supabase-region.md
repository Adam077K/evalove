# ADR-001 — Supabase region: `eu-central-1` (Frankfurt)

**Date:** 2026-08-02
**Status:** Accepted — **irreversible without a full data migration**
**Decider:** CEO, on CTO recommendation. Founder deferred as an infrastructure decision.
**Affects:** every worker touching `supabase/migrations/**` or `lib/data/**`; Vercel function region (`fra1`).

---

## Context

The Supabase project region is fixed at creation. Changing it later means standing up a second project, migrating Postgres and every storage object, and re-pointing the app — for a two-person product holding irreplaceable photos, that is a migration nobody should have to run. It therefore had to be decided before the first migration ran, with the reasoning recorded.

The two users are 6–7 hours apart: Eva in New York (`America/New_York`), Adam in Israel (`Asia/Jerusalem`). The product holds private and intimate photos.

## Options considered

| Option | Latency to NYC | Latency to Tel Aviv | Jurisdiction |
|---|---|---|---|
| `us-east-1` (N. Virginia) | ~15 ms | ~140 ms | United States |
| **`eu-central-1` (Frankfurt)** | ~85 ms | ~50 ms | European Union |
| `eu-west-2` / others | worse on one leg or both | | EU / UK |

## Decision

**`eu-central-1` (Frankfurt).** Vercel functions pinned to `fra1` to sit beside it.

## Rationale

1. **Latency is largely neutralised by the application architecture, so it is not the deciding factor.** The photo book is service-worker cached and offline-first — page turns never touch a server. The activity library is a static build artifact, precached. What remains server-bound is posting a photo and reading a small amount of JSON, where 85 ms versus 15 ms is imperceptible. This removes the argument that would otherwise have favoured `us-east-1`.

2. **That leaves jurisdiction, and EU data residency is a genuine advantage for intimate content.** This was the argument the recommendation was carrying implicitly; it is now the stated primary reason.

3. **The remaining latency asymmetry favours the person with the worse windows.** Frankfurt is the shorter hop from Israel, and Adam's windows (W1 at 05:00, W6 at 01:00–05:00) are the ones that cost him something. Eva's hardest window — the subway commute, W3 — is served entirely offline, so it is unaffected by region either way.

## Consequences

- Supabase project and all storage live in the EU. Vercel functions run in `fra1`.
- Cloudflare R2 backup (ADR-002 pending) should be created in an EU-adjacent jurisdiction for consistency; R2's automatic placement is acceptable.
- Reversing this requires a full project migration with a maintenance window and a verified restore. Treat as a one-way door.

## Verification

The region must be confirmed in the Supabase dashboard **before** P1-T2 runs its first migration. `P1-T2` is not "done" until the region is recorded in its session file.
