---
date: 2026-08-03
role: cto
session: cto-archive-survival
color: blue
status: COMPLETE — dispatch packet, no code written
qa_verdict: N/A — no diff produced. Each worker brief carries its own tier; QA-Lead gates each branch.
tier: n/a (packet) — one tier per brief, seven briefs:
  B1 archive-export-engine   full
  B2 archive-export-mirror   irreversible
  B3 per-person-credential   irreversible
  B4 unilateral-remove       full
  B5 auth-availability       full
  B6 if-adam-stops           lite
  B7 offline-last-thing      full
linear_ticket: none
branches_created: none — brief bodies at
  docs/08-agents_work/handoffs/2026-08-03-cto-archive-survival-packet.md
---

# Archive survival — dispatch packet

Six worker briefs implementing PRODUCT-VISION-V2 §6 items 1–7, plus §9's open
technical question. I wrote no code; the layer contract forbids it and nested
Task was blocked, so the deliverable is briefs the CEO spawns.

## Verified state (re-checked, not inherited)

- **No export exists.** `apps/web/app/api/` holds exactly three routes:
  `ai/chat`, `photos/upload-url`, `session`. Nothing reads the archive out.
- **No CI, no scheduled job, no `.github/` directory at all.** The nightly
  GitHub Action + R2 mirror in `LDR-APP-ARCHITECTURE.md` §5.8 (task T11) was
  specified and never built. `photos.original_location` already accepts `'r2'`;
  nothing writes it.
- **One shared password.** `app/api/session/route.ts:148` checks a single
  `APP_PASSWORD_HASH`. The JWT already reserves an optional `mid`
  (`lib/session/token.ts:91`) and `createSession()` already accepts it — the
  per-person credential is a smaller change than it looks.
- **Delete is half-built.** `softDeletePhoto` and `purgePhoto` exist in
  `lib/data/photos.ts` with a `purge_audit` table and a 20/day cap. **No route
  exposes either.** Neither of them can currently delete anything.
- **The limiter fails closed** at `app/api/session/route.ts:110-128`.

## Decisions I made

1. **One export engine, two triggers — and neither is an HTTP route.** A
   `/api/export` would depend on Vercel, on Supabase, and on the fail-closed
   login: three things that must be up to reach what is already theirs. §6.7
   forbids exactly that. The engine is a CLI in the repo; the nightly job and a
   laptop run the same code.
2. **The export tool imports `@supabase/supabase-js` directly and does not go
   through `lib/data/*`**, deliberately breaking §6.3's rule. That rule exists
   so Phase 2 auth is a one-file swap. The export exists so it still runs when
   nobody maintains the app. Coupling the exit to the application's data layer
   means a refactor can silently break the archive's way out.
3. **The vault is not in the automatic copy.** Exported only by an explicit run
   holding `VAULT_PASSPHRASE`, into its own top-level folder. An unencrypted
   nightly mirror of `v/` into a synced cloud account defeats the one structural
   privacy property the schema was built around. Needs founder sign-off.
4. **A copy in Eva's account cannot be a mirror.** §5.7 promises a permanent
   delete propagates everywhere in 24h. Once a copy lands in storage Adam does
   not control, that promise is false. Survivability wins; the UI copy must stop
   promising propagation. Founder decision, flagged.
5. **The front door degrades, the vault door does not.** On a limiter storage
   failure, `scope='session'` falls back to an in-process counter (3 failures
   per instance per 15 min); `scope='vault'` keeps failing closed. Online
   guessing against a 20-char manager-generated secret is not a real threat;
   being locked out of your own photographs at 3am is.
6. **Permanent purge ships after the export, never before.** Soft delete alone
   satisfies the autonomy property in §6.4 and is recoverable.

## iOS 26 Safari web push — image in the notification body

**No. VERIFIED** by `researcher-ios-push-image`, HIGH confidence, primary
sources (WebKit blog 18.4/18.5/26.0, the WebKit explainer, caniuse, the
Notifications spec). `NotificationOptions.image` has never been implemented in
WebKit — no support, Safari iOS 3.2 through 26.5. Declarative Web Push carries
`web_push · title · lang · dir · body · navigate · silent · app_badge` and no
image field and no per-notification icon; the small icon shown is the manifest
icon. APNs `attachment` is native-only.

My unfetched prediction was correct, so no brief was re-cut. Consequence:
§4.5 losses (1) and (3) do not shrink. Declarative Web Push's `navigate` still
lands the tap on the newest item with no JavaScript — §4.2's "zero navigation"
for free. **Nothing in this packet designs toward lock-screen image delivery,
including as a future hook.**

## What the verification changed — the availability leg got heavier

If the notification cannot carry the thing, the tap is the only path to an
arrival. So §6.7 has three legs, and my first packet only briefed two:

1. A copy in Eva's storage — B1 + B2. The archive survives.
2. The door degrades instead of 503 — B5. She can get in.
3. **The app can show her the last thing without the network — unbriefed.**

Leg 3 is missing entirely. **The service worker does not exist.** `serwist` and
`@serwist/next` are in `package.json`, `middleware.ts` allowlists
`/manifest.webmanifest`, `/sw.js`, `/favicon.ico`, `/apple-touch-icon.png` and
`/icons/` — and **not one of those files exists**. `next.config.ts` is six bare
lines with no Serwist wrapper. `public/` holds only `fonts`. ARCH §7.2 and §7.3
specify a full offline story; none of it is built.

Without leg 3, B5 converts a 503 into a blank screen. Added as **B7**.

The good property: §4.4 says nothing is ever consumed and the last thing left
stays up until replaced. So a cache-first read during an outage shows exactly
what the product shows anyway — the outage degrades to "yesterday's lamp is
still on," which is designed behaviour rather than an error state.

## Sequencing

B1 (export engine) gates everything. **No photograph enters The Book until B1
has been run against the real database and the result opened on a laptop with
wifi off.** That gate binds the other CEO track, not this one.
