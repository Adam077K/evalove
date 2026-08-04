---
date: 2026-08-04
role: qa-lead
task: wave1-qa-gate
branches:
  - name: feat/today-scrapbook-deco
    tier: full
    qa_verdict: PASS
  - name: feat/photo-path
    tier: full
    qa_verdict: BLOCK
---

# QA Gate — Wave 1 (Today rebuild + photo path)

Independent review of two Full-tier branches. Verdicts are per-branch and independent of each other.

## feat/today-scrapbook-deco — PASS

Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/today-scrapbook-deco`. 4 commits, 24 files, +685/−421.

**Reviewers:** code-reviewer (completed), design-critic (terminated mid-run — see below). QA-Lead ran direct verification in place of qa-engineer/semgrep given this is a UI-only diff touching no critical path (no auth/API/DB/billing/secrets) — deviation from the default Full-tier roster, scoped by the spawning brief and judged proportionate to the diff's actual surface.

**code-reviewer:** 0 P1, 3 P2, 2 P3. P2s: djb2 hash duplicated between `TodayPair` and `Mounted`; `<h2>` used for decorative city labels (semantic/heading-hierarchy concern); doorway thumbnail lost its aspect-ratio reservation (CLS regression). None blocking.

**design-critic: DIED MID-RUN — NOT ASSESSED.** Terminated after 39 tool calls (~8 min) mid-sentence, no conclusion, no verdict. This is explicitly *not* read as a clean pass — an empty return and a critic finding nothing are indistinguishable in shape and opposite in meaning. The aesthetic/taste dimension (§6 Four Tests, Poiret One leash nuance, composition rhythm, the day-seam haze-vs-depth call, the Book-doorway-label-clipping question in `wave1-today-day-seam.png`) is **not assessed by this gate** and is explicitly out of QA-Lead's scope per the CEO/team-lead's steer — Wave 4 owns that loop separately and will re-run it as its own revision cycle. Do not read this PASS as covering design quality.

**Non-negotiables — verified by QA-Lead directly, not taken on a reviewer's word:**
1. **SealedCard fires only on genuine sleep** — traced in code: the gate evaluates `partnerPresence` against the historical `item.leftAt`, no `setTimeout`/interval/manufactured clock anywhere in the path, and `"unknown"` presence is treated as not-sealed (fails closed, not open). PASS.
2. **Photographs never dimmed/filtered, including at night** — verified two ways. Structurally: `under-lamp` sits on the mount at `zIndex: 0`, the photograph is a sibling at `zIndex: 1` inside an `isolation: isolate` context, so the lamp filter cannot reach the `<img>`. Empirically: cropped the identical photo region from `wave1-pair-day.png` and `wave1-pair-night.png` and compared mean luminance — **170.27 vs 170.27, bit-for-bit identical** — while a bare-paper margin in the same two images genuinely dims (239.6 → 175.9), proving the night toggle is real and the photo exemption holds. PASS.
3. **No counters, streaks, or "seen" status** — none found in code review or in any reviewed screenshot. PASS.
4. **Seeded composition uses stable item ID, never array index** — confirmed in code. PASS.
5. **`lib/shared-day/` untouched** — absent from the diff (confirmed via `git diff --stat`); all 109 of its tests pass unchanged. PASS.

**Tests:** 438/439 pass. The one failure (`tools/export/__tests__/cli-smoke.test.ts`, missing `@supabase/supabase-js` dep in `tools/package.json`) is outside this branch's 8 changed files and reproduces identically on `main` — not attributable to this branch.

**`tsc --noEmit`:** Errors present are byte-identical to `main` (`app/sw.ts` + its test file, `lib/data/__tests__/photos.test.ts`) — pre-existing, not this branch's fault.

**Open item, not resolved:** the apparent Book-doorway-label clipping by the dock in `wave1-today-day-seam.png`. QA-Lead's own read: `wave1-today-day-bottom.png` shows the same card fully clear of the dock at rest, and the design law itself warns (§6) that full-page captures paint `position: fixed` elements at the wrong offset, "has caused two false alarms in this project" — so this is likely a capture artifact from a mid-scroll or full-page-capture moment, not a resting-state defect. Not confirmed either way since design-critic died before weighing in. Filed as a P3 for Wave 4 to re-check with a live viewport-position capture, not a full-page one.

**Verdict rationale:** 0 P1/P2-blocking findings from the reviewer that completed; every non-negotiable in QA-Lead's actual gate (behavioral law, not aesthetic taste) independently verified by tracing code and measuring pixels, not by trusting a report. PASS, with design-taste explicitly NOT ASSESSED and three P2s + one open P3 filed as follow-up.

---

## feat/photo-path — BLOCK

Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/photo-path`. Commit `406816d`, +964/−91 across 7 files.

**Reviewers:** code-reviewer, security-engineer (adversary-mode brief included). QA-Lead ran the actual test suites and `tsc` directly rather than spawning qa-engineer separately.

**code-reviewer:** 0 P1, 2 P2, 3 P3. Both P2s in `QuickSend.tsx`: uncoordinated `void drain()` calls with no coordination can orphan storage objects; `send()` has no catch, so an OPFS write failure fails silently (worth noting: this cuts against the outbox's own stated design intent of "never silently lose a pick," per the file's own header comment).

**security-engineer:** self-rated PASS, 0 P0/P1, 1 P2 (no rate limiting on `POST /api/photos` or `GET /p/[photoId]/[variant]`, against a six-month session lifetime), 3 P3. Vault exclusion confirmed airtight — storage paths are hardcoded server-side with no client-controllable segment, so `/p/[photoId]/[variant]` structurally cannot reach a vault object. Middleware-matcher exclusion of file-extension paths confirmed as by-design, not a hole — the route calls `requireSession()` directly and that is the actual enforcement layer, consistent with `middleware.ts`'s own documented architecture.

**QA-Lead's own escalation, overriding the sub-agent's self-rated severity — P1, BLOCKING:**

`apps/web/lib/data/photos.ts`, in `commitPhoto` (~line 301–304):
```
// The client strips EXIF while it resizes; the server never sees the
// untouched file and so cannot re-verify this. Recorded as the claim it
// is, in the column the schema already defaults to true.
exif_stripped: true,
```
This is written **unconditionally**. The upload path is direct-to-storage (bytes never transit the Next.js server, by design, to dodge Vercel's 4.5 MB body limit), so the server has never actually inspected the bytes it is making a claim about. The happy path is genuinely strong — `route.gps-integration.test.ts` runs a real Apple HEIC with a real GPS IFD through the real `preparePhoto`, independently re-parses the output with `findMetadataEvidence`, and asserts `sourceHadGps === true` so the test cannot be vacuous. But nothing stops an authenticated caller (or a future client-side regression that never touches `preparePhoto`) from PUTting raw, GPS-laden bytes to the signed storage URL directly and then calling `POST /api/photos` with a self-computed checksum matching those raw bytes — the route has no way to tell the difference, and will happily record `exif_stripped: true` regardless. That falsely-clean claim is exactly what feeds the nightly R2 export, which ships the data off-machine.

The founder's own brief (relayed to QA-Lead verbatim) states: "`assertNoMetadata` must run on every byte that reaches storage... do not accept a test's word." That is an enforcement standard, not a best-effort one, and the system as built attempts stripping but does not enforce it. This is one of the seven explicitly-named non-negotiables and the one the brief weighted heaviest ("a founder immovable and a security property"). QA-Lead reads a gap on this specific line as disqualifying, independent of how low a probability the actual couple would ever trigger it.

**Must-fix (P1), proportionate to the actual gap — not the two oversized remedies first floated in review:**
- Removing direct-to-storage upload entirely is a real architectural regression (it exists specifically to dodge the platform body-size limit) — not required.
- Renaming/qualifying the column alone (e.g. `exif_stripped_by_client_claim`) makes the failure legible but does not stop GPS-laden bytes from reaching the export pipeline — insufficient on its own, though a reasonable complementary change.
- **Required:** `assertNoMetadata`/`findMetadataEvidence` already exist as a pure, fast byte-segment scan (no image decode) and are already unit-tested. `commitPhoto` runs server-side (`runtime = "nodejs"`) and already has gateway access to download storage objects, the same call `readPhotoBytes` uses to serve them. Before writing `exif_stripped: true`, download the just-committed display/thumb objects and run the existing scan against them; reject or quarantine the commit if metadata survives. This does not touch the direct-to-storage architecture and is not a hot-path cost (photo commits are low-frequency for a two-person app).

**Other findings, not blocking, filed as follow-ups:**
- P2 (security): no rate limiting on `POST /api/photos` / `GET /p/[photoId]/[variant]`.
- P2 (code-reviewer): `QuickSend.tsx` uncoordinated `void drain()` — possible orphaned storage objects.
- P2 (code-reviewer): `QuickSend.tsx` `send()` has no catch — silent OPFS failure.
- 3+3 P3s from the two reviewers — minor, non-blocking; file as `tech-debt` tickets.

**Verified independently by QA-Lead:**
- Ran the actual test suites (not taken on report): `app/api/photos/__tests__` + `app/p/[photoId]/[variant]/__tests__` — 19/19 pass. Broader related suite (`lib/outbox`, `lib/photo`, `lib/data/photos`, `lib/shared-day`, `components/send`) — 159/159 pass. `lib/shared-day` in isolation — 109/109 pass, confirming it is untouched and unbroken.
- `tsc --noEmit` errors are byte-identical to `main` (`app/sw.ts` + its test, `lib/data/__tests__/photos.test.ts`) — pre-existing, not this branch's fault.
- Vault exclusion (`PhotoKind = "daily" | "book"` only; `vaultSrc()` now points at the documented-but-unbuilt `/v/{id}.jpg` and 404s honestly instead of faking content) — confirmed structurally sound, independent of security-engineer's report.

**Provenance note, carried forward, not re-litigated:** this branch was written by a session outside the CEO's original brief, and its own claim of "no migration needed" was reached without evidence — its tests fake the `DataGateway`, so the branch itself never touched a real database. The founder has since confirmed directly (Supabase dashboard) that the tables exist, so the underlying premise holds. That confirmation is external verification, not something the branch's own test suite produced — worth remembering the next time this branch's self-reported claims are taken at face value.

**Verdict rationale:** one P1 on the single non-negotiable the brief weighted heaviest — an unenforced privacy/security claim that reaches an off-machine export. BLOCK. CTO to route the must-fix above; re-submit for QA-Lead review after the fix (max 2 cycles per protocol before escalating to CEO).

---

## feat/photo-path — RE-GATE cycle 1 of 2 — PASS

Four commits on top of `406816d`: `a81f1e6` (the P1 fix), `070fe79` (`createSerialQueue`), `df51348` (serialise `drain()`), `9a3e10f` (surface `send()` failures).

**Every claim re-verified with my own hands, not accepted on report:**

1. **Red→green, reproduced independently.** Stashed `verifyDerivativesAreClean`'s call site in `lib/data/photos.ts` (commented out the one call), ran the new bypass test (`route.gps-integration.test.ts` > "a commit whose stored bytes still carry GPS") — it failed exactly as expected: `expected 201 to be 400`, i.e. without the guard the malicious commit succeeds. Restored the file via `git checkout`, re-ran: 3/3 pass. The guard is load-bearing, not decorative.

2. **Reject-outright vs. quarantine — judged legitimate, resolves the P1.** A rejected commit never reaches `insertPhotoIfAbsent`, so no `photos` row is ever written for it. Every consumer that could leak this data reads through a row: `readPhotoBytes`/`photoObjectResponse` (the serving route) calls `findPhotoById` first and 404s on `null`; `commitPhoto`'s own idempotency keys off `findPhotoByClientUuid`; and (on the stated premise that the R2 export operates on the `photos` table, not a raw bucket scan) the export has nothing to iterate that points at the orphaned bytes. The two objects do stay in storage — nothing here may delete them, and that constraint is real elsewhere in this codebase — but "present in a bucket under an unguessable UUID path, referenced by zero rows, unreachable through every application read path" is a categorically different exposure than "a verified-clean flag that is false and gets exported off-machine." It closes the actual harm my P1 named. Also consistent with the already-accepted shape of an unclaimed upload slot (`issueUploadSlots` already authorises paths a client can simply never commit).

3. **The permissive-codec control — judged legitimate, not rigged.** It is used only in the first test ("unserialised: each asks for its own upload ticket"), which exists solely to prove the race is real before the fix is applied to it. The second test (proves `createSerialQueue` fixes it) uses the standard, guarded `createNodeCodec()` — serialisation means no concurrent decode ever happens there, so that test's pass is not resting on a weakened double. The permissive double is also documented as more production-accurate than the guarded one: real `OffscreenCanvas` does not throw on concurrent use, it wastes work — which is exactly what the double does instead of masking the race behind an unrelated reentrancy guard.

4. **Log-leakage — verified clean.** `verifyDerivativesAreClean`'s two failure modes throw `DataError("invalid", ..., { variant })` and `DataError("invalid", ..., { variant, evidenceKinds: evidence.map(e => e.kind) })` — a variant name (`"display"`/`"thumb"`) and an array of the `MetadataKind` enum (`"app1-exif"` etc.), never a storage path, byte offset, or the evidence's human-readable `detail` string. Matches `DataError`'s own class-level contract ("Structured detail for the log line. Never contains photo bytes").

**Independently re-run, not taken on report:**
- Full `vitest`: 461/462 pass. The one failure is the same pre-existing, unrelated `tools/export/__tests__/cli-smoke.test.ts` (missing dep), outside this branch's changed files.
- `tsc --noEmit`: errors are byte-identical to the pre-fix baseline (`app/sw.ts` + its test, `lib/data/__tests__/photos.test.ts`) — zero new errors introduced.
- `git diff 406816d..feat/photo-path --stat`: 6 files touched (`route.gps-integration.test.ts`, `QuickSend.tsx`, `lib/data/photos.ts`, `serial-drain.test.ts`, `lib/outbox/index.ts`, `lib/outbox/serial.ts`) — `lib/shared-day/` and any vault/`v/` path are absent. Nothing deleted; the two prior P2s in `QuickSend.tsx` (uncoordinated `drain()`, silent `send()` failure) are both resolved by this same set of commits, not just filed.

**Remaining, not blocking:** no rate limiting on `POST /api/photos` / `GET /p/[photoId]/[variant]` (P2, unchanged from cycle 0, filed as tech-debt). Minor P3: `verifyDerivativesAreClean` downloads display and thumb sequentially rather than in parallel — trivial latency nit, not worth blocking on.

**Verdict: PASS.** The P1 is closed by a fix that reuses existing, already-tested code, does not touch the direct-to-storage architecture, and was verified red→green by QA-Lead directly rather than accepted from the implementing session's own report.

---

## fix/toolchain — PASS

Worktree: `/Users/adamks/VibeCoding/evalove/.worktrees/toolchain`. 3 commits (`66ba284`, `92e7e25`, `0231099`) on top of `main`. Tier: **Lite** — confirmed: no API, DB, auth, migration, or CI-workflow file touched; only `apps/web/app/sw.ts`, `sw-runtime-caching.ts`, two test files, `eslint.config.mjs`, `next.config.ts`. Treated as a second opinion per team-lead's own independent verification, but given the stated consequence ("changes what verified means for everything else") QA-Lead did full direct verification rather than a lighter Lite-tier pass — no code-reviewer/qa-engineer spawn was needed on top of it.

**Zero suppressions — confirmed by grepping the full diff, not by inspection alone:** `git diff main..HEAD | grep -E '@ts-expect-error|@ts-ignore|ignoreBuildErrors|eslint-disable|: any\b|as any\b'` on added lines returns nothing. The only ignore-list addition is `public/sw.js` in `eslint.config.mjs`, which is generated build output (confirmed gitignored), not source being silenced.

**Claim 1 — the hydration bug, reproduced independently in both directions, not just read about:**
Started `next dev` on the branch, used a standalone Playwright script (not the repo's own e2e suite) to load `/login`, and used exactly the signal named in the brief — the submit button is `disabled={password === "" || pending}` in `LoginForm.tsx`, so typing into the password field re-rendering it to enabled is an unambiguous, purely-client-side hydration signal (no network call required).
- **With the fix, at `http://127.0.0.1:PORT`** (the exact origin `e2e/playwright.config.ts`'s `baseURL` uses): `disabledBefore: true → disabledAfter: false`. Hydrated.
- **Fix reverted (`git apply -R` on just `next.config.ts`, everything else untouched), same origin, same probe:** `disabledAfter: true` — hydration genuinely does not commit. Console shows the exact error the code comment names: `WebSocket connection ... failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE`.
- **`localhost`, both with and without the fix:** hydrates either way — unaffected, as claimed.
- Fix restored via `git checkout`, worktree left clean.

This is not a claim taken on report — the causal mechanism was reproduced on command, in both directions, with the exact error signature the diff's comment predicts.

**Claim 2 — `allowedDevOrigins` is dev-only, verified two ways:**
- Read Next.js's own source (`node_modules/next/dist/server/lib/router-server.js`, `block-cross-site-dev.js`): `blockCrossSiteDEV(req, res, development.config.allowedDevOrigins, ...)` is called only inside `if (development)`, and `development` is declared `let development = undefined` at module scope, populated only inside the branch that calls `setupDevBundler(...)` — which only runs for `next dev`. In `next build`/`next start` this variable is never assigned, so the check is structurally unreachable.
- Ran it: `pnpm build` succeeded cleanly end-to-end (Turbopack compile, typecheck, static generation, `postbuild` service-worker compile) — this also fully resolves the `app/sw.ts` type errors that every prior QA cycle today had been carrying as an accepted, unrelated "pre-existing on main" condition; `next build` is no longer blocked by anything. `next start` on the built output answered `200` on both `http://127.0.0.1:PORT/login` and `http://localhost:PORT/login`.

**Claim 3 — `photos.test.ts`'s `attribution_source` correction is real, not just green:**
`FakeGateway` now `implements DataGateway` in full; every method `softDeletePhoto` doesn't call throws a `notImplemented` error naming itself, rather than silently stubbing a return value a future test could accidentally rely on. `attribution_source: "camera"` → `"authenticated"` is a fixture-data correction only — `AttributionSource`'s real values are `"authenticated" | "self_declared"` (confirmed against `commitPhoto` in `lib/data/photos.ts`), `"camera"` was never valid, and `softDeletePhoto`'s own behavior under test does not branch on this field at all — the correction fixes a type error in unrelated fixture data without touching what the test actually exercises.

**Independently re-run:**
- `tsc --noEmit`: exit 0. Zero errors — not merely "no new ones"; this branch fully resolves every TS error this project had been treating as pre-existing baseline noise across today's earlier reviews.
- `eslint .`: **32 problems (11 errors, 21 warnings)** — matches the claim exactly. Confirmed as the first real lint signal this repo has produced; not fixed in this diff by design, and QA-Lead is not treating the 32 outstanding violations as a finding against this branch, per the brief.
- `vitest run`: 436 passed, 2 skipped (`lib/__tests__/no-client-secrets.test.ts`, conditional on a `.next` build artifact existing — unrelated to this fix), 1 failed — the same pre-existing, unrelated `tools/export/__tests__/cli-smoke.test.ts` (`ERR_MODULE_NOT_FOUND: @supabase/supabase-js`) seen identically on `main` and on both other branches gated today.

**Verdict: PASS.** All three flagged claims hold under independent, adversarial-enough re-verification (including deliberately breaking the fix to watch it fail the same way). This branch retroactively explains and closes several conditions every earlier review today had accepted as environment noise — future QA cycles on the remaining branches should re-verify against a working `next dev`/`next build` rather than continuing to invoke that exemption.
