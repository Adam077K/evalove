---
date: 2026-08-03
from: cto (session cto-archive-survival)
to: ceo — spawn these
status: READY TO SPAWN. Two founder sign-offs pending, neither blocking a start.
implements: docs/04-features/PRODUCT-VISION-V2.md §6 items 1-7
session_file: docs/08-agents_work/sessions/2026-08-03-cto-archive-survival.md
briefs: 7
tiers: B1 full · B2 irreversible · B3 irreversible · B4 full · B5 full · B6 lite · B7 full
---

# Archive survival — worker dispatch packet

Seven briefs. The founder's brief said build Today and The Book; the research
states a sequencing rule it omits, and this packet is that rule made
executable:

> "The export ships before the archive accepts its first photograph. Not a
> backlog item, not Phase 2 — a sequencing rule. Nothing may be imported into
> The Book until there is a tested export that gets it out again."
> — PRODUCT-VISION-V2 §6.1

**Base branch for every brief is `ceo-3-1785631504` unless stated otherwise.**
`main` has no app code. Every worker takes an isolated worktree; create it from
the main repo root at `/Users/adamks/VibeCoding/evalove` with `git -C`.

---

## Dependency order

| Wave | Briefs | Why they can share a wave |
|---|---|---|
| **1** | **B1 · B4 · B5 · B7** | Four disjoint file sets. B1 is `tools/` (new). B4 is `app/api/photos/[id]/` (new). B5 is `lib/auth/` + one catch block in the session route. B7 is `app/sw.ts` + `next.config.ts` + `components/chrome/`. No two of them open the same file. |
| **2** | **B2** (after B1) · **B3** (after B5 + founder sign-off) | B2 invokes B1's CLI and must not modify it. B3 and B5 both edit `app/api/session/route.ts`, so they cannot be concurrent — B5 goes first because it is Full and needs no sign-off, and should not queue behind one. |
| **3** | **B6** (after B2) | It documents what actually shipped, so it reads B1's and B2's merged code rather than these briefs. |

Explicit blocking edges, nothing else:

```
B1 ──> B2 ──> B6
B5 ──> B3
B4, B7   (no predecessors)
```

**The hard gate:** no photograph enters The Book until B1 has been run
end-to-end against the real database and the result opened on a laptop with
wifi switched off. A `--verify` pass over fixtures is not the gate; opening the
folder offline is. Per CEO: this does **not** hold the design track, which is
composing The Book against fixtures and imports nothing.

---

## B1 — archive-export-engine

- **worker_type:** `backend-engineer`
- **slug:** `archive-export-engine`
- **branch:** `feat/archive-export-engine`
- **base_branch:** `ceo-3-1785631504`
- **risk_tier:** `full`
- **blocked_by:** nothing

**goal.** Build the export. A dependency-light Node CLI plus a pure library
that reads the whole archive out of Supabase and writes a folder tree of
original files in dated folders with a plain index — openable on a laptop in
ten years with this app gone and this company gone. No HTTP route, no schema
change.

**files_in_scope**

```
tools/export/index.ts            the CLI entry point
tools/export/read.ts             its own read-only Supabase client — see constraint 1
tools/export/layout.ts           path grammar + filename composition (pure)
tools/export/index-html.ts       the self-contained index (pure)
tools/export/manifest.ts         CSV emitters (pure)
tools/export/verify.ts           checksum re-read
tools/export/README.md
tools/export/__tests__/*.test.ts
package.json                     one script entry; NO new runtime deps
```

**context_files**

- `docs/04-features/PRODUCT-VISION-V2.md` §6 items 1, 3, 5 — read in full. They are written as outcomes; you own the mechanism.
- `apps/web/lib/schema.ts` — `MEDIA_BUCKET`, `PHOTO_PATH_PREFIX`, `VAULT_PATH_PREFIX`, `photoOriginalPath/DisplayPath/ThumbPath`, `RELATIONS`. Import these; never re-spell them. A drift test exists because someone did.
- `apps/web/supabase/migrations/20260802090200_photos.sql` — every column you export, incl. `original_location` and `checksum_sha256`.
- `apps/web/supabase/migrations/20260802091000_storage_media_bucket.sql` — the `p/` vs `v/` split, and why it is the mechanism rather than a convention.
- `apps/web/lib/data/supabase-gateway.ts:407` — `downloadObject`, the shape of a storage read.
- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.7, §5.8.

**success_criteria**

1. **Output layout, exactly this shape:**
   ```
   eva-and-adam-archive/
     README.txt
     index.html
     index.csv
     photos/YYYY-MM-DD/YYYY-MM-DD--<author>--<HHMM local>--<short id>.jpg
     book/book.csv
     data/{photos,members,book_entries,dates,date_turns}.csv
   ```
2. **Filenames carry the meaning** — date, author name (`eva|adam`, never `a|b`; migration 02 says why), the local clock, a short id. If every index file is lost the folder still says what happened, when, and who. This is the property that actually survives ten years.
3. **`index.html` is self-contained.** No `<script src>`, no `<link href>` to any origin, no CDN font, no analytics, no network reference of any kind. Images by relative path only. It must render from `file://` with wifi off. Add a test asserting the emitted HTML contains no `http://` or `https://` outside plain-text prose.
4. **CSV alongside HTML**, because a spreadsheet opens in ten years without a browser. Not JSON as the primary index — a JSON blob needs code to read it, which is what §6 item 3 forbids.
5. **Originals when they exist.** Read `photos.original_location` (`none|supabase|r2|purged`) and fetch the original when present. When absent, export the display variant **and record in `index.csv` and `index.html` which variant each file actually is.** Never label a 1600px display copy an original.
6. **`--verify`** re-reads every written file and compares SHA-256 against `photos.checksum_sha256`, exiting non-zero on mismatch. An export that is not verified is a belief, not a backup.
7. **Resumable.** Re-running skips files already present with a matching checksum. A dropped connection must not mean starting over.
8. **Vault: `--include-vault` is OFF by default.** When passed it requires `VAULT_PASSPHRASE` in the environment, writes to a separate top-level `private/` folder, and the README states plainly what that folder holds. Never write vault bytes into `photos/`. Never generate a thumbnail for a vault item — migration 04 argues this at length.
9. **`README.txt` is plain text addressed to a person**, not a developer. technical-writer replaces the prose in B6; ship something honest and working, never a TODO.
10. **Tests:** layout, filename composition, CSV escaping (a caption containing a comma, a quote **and** a newline — all three occur in real captions), the no-network assertion, the checksum verifier. Fixtures only; the suite must not need a live database.
11. Runs under `node --experimental-strip-types` or a single `tsx` invocation. Must not require a Next.js build, a bundler, or the app running.

**constraints**

1. **Import `@supabase/supabase-js` directly. Do NOT route through `lib/data/*`.** This knowingly breaks the review-blocking rule in ARCH §6.3 — restate the reason in a header comment so the next reviewer does not "fix" it. *Do* import `lib/schema.ts`, which is a declaration of what the SQL owns, not a data-access layer.
2. **Read-only.** Never writes, never deletes, never updates a row. No exceptions.
3. **No new runtime dependencies.** The archive's exit must not rot because a package went unmaintained. Node built-ins plus `@supabase/supabase-js`, already a dependency.
4. TypeScript strict. Zod on anything parsed from outside.
5. Never put a credential literal in a script, test or fixture. This happened once on this project and had to be redacted (commit `3237d6b`).

**do_not_touch**

- `apps/web/lib/shared-day/` — 109 tests, four DST transitions, the app's one differentiator
- `apps/web/lib/photo/`, `apps/web/lib/outbox/` — out of scope per Vision §7.10
- `apps/web/app/api/` — this brief adds no route
- `apps/web/supabase/migrations/` — no schema change
- `apps/web/lib/auth/`, `apps/web/lib/session/`, `middleware.ts` — B3/B5/B7 own those

**skills_to_load:** `error-handling-patterns`, `nodejs-backend-patterns`
**session file:** `docs/08-agents_work/sessions/2026-08-03-backend-engineer-archive-export-engine.md`

---

## B2 — archive-export-mirror

- **worker_type:** `devops-engineer`
- **slug:** `archive-export-mirror`
- **branch:** `feat/archive-export-mirror`
- **base_branch:** `feat/archive-export-engine`
- **risk_tier:** `irreversible` — creates a `.github/workflows/` file (named explicitly in CLAUDE.md's trigger list), holds a write credential to a third-party account, and once it has run it creates copies the system can never reach again
- **blocked_by:** B1

**goal.** Make the copy automatic and land it in storage **Eva owns**. A nightly
GitHub Action that runs B1's CLI and writes the archive into a bucket under her
own account — plus the Supabase keep-alive, because it is the same job.

**files_in_scope**

```
.github/workflows/nightly-archive.yml   this repo has NO .github directory — you create the first one
tools/export/upload.ts                  the S3-compatible put
docs/03-system-design/RUNBOOK-nightly-archive.md
```

`@aws-sdk/client-s3` is the one new dependency I pre-approve, and only inside
`tools/`, never in `apps/web`.

**context_files**

- `docs/04-features/PRODUCT-VISION-V2.md` §6 item 5 — *"The change is not the mechanism; it is whose account the copy lands in."* Read that sentence twice; it is the whole brief.
- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.8, §5.8a, §5.8b — cost model, free-tier pause, liveness design. §5.8a is why the keep-alive belongs in this same job.
- `tools/export/` — B1's CLI, which you invoke and do not modify.

**success_criteria**

1. **Whose account.** The destination credential belongs to Eva, not to Adam and not to the project. Cloudflare R2 is the pre-decided vendor (ARCH §5.8: 10 GB free, zero egress, so a restore costs nothing at the moment a restore is needed). If Eva's own account is not available at build time, ship pointed at a placeholder secret and **fail loudly** rather than silently falling back to Adam's bucket. A copy in Adam's account is the status quo wearing a backup's clothes.
2. Runs nightly, invokes B1's CLI with `--verify`. A verification failure fails the workflow — a green run that wrote corrupt bytes is worse than a red one.
3. **Storage-class assertion.** Read back an uploaded object's storage class and fail loudly if it is not Standard. ARCH §5.8: Infrequent Access carries a per-GB retrieval charge that destroys the restore-costs-nothing property that justified R2.
4. **Not a mirror, and the workflow says so.** This copy is Eva's; purges do not propagate into it. Contradicts ARCH §5.7 item 4 deliberately — put the reason in the workflow header so the next reader learns it from the file.
5. **Keep-alive.** The same job touches Supabase, preventing the 7-day free-tier pause (ARCH §5.8a). One job, both purposes, so they cannot drift apart.
6. **The workflow header states the consequence, not the mechanism.** Per ARCH §5.8a, whoever reads this file in a year must learn from the file that deleting it takes the app offline after seven idle days and stops the archive's only automatic copy. It must be impossible to mistake for cruft.
7. **Record the load-bearing dependency:** this repo staying private is now operational. GitHub auto-disables scheduled workflows after 60 days of inactivity in **public** repositories; making it public for an unrelated reason silently arms a timer against the backup and the keep-alive at once. State it in the runbook.
8. Secrets via GitHub Actions secrets only — never in the workflow file, never echoed in a log, never in the runbook. Assume every log line is public.
9. The runbook records: what the job does, how to run it by hand from a laptop, how to tell whether last night's run happened, and what to do when it did not.

**constraints**

- Do not modify B1's CLI. If it needs a change, return BLOCKED and say what — do not fix it here or the branches conflict.
- The Cloudflare liveness Worker (ARCH §5.8b) is **out of scope**. It matters, and a monitor built in the same hour as the thing it monitors gets tested against the same assumptions.
- Never commit `.env.local`. Never put a credential literal in the workflow or runbook.

**do_not_touch:** `apps/web/` entirely — this brief touches no application code.

**skills_to_load:** `github-actions-templates`, `vercel-deployment`
**session file:** `docs/08-agents_work/sessions/2026-08-03-devops-engineer-archive-export-mirror.md`

---

## B3 — per-person-credential

- **worker_type:** `backend-engineer`
- **slug:** `per-person-credential`
- **branch:** `feat/per-person-credential`
- **base_branch:** `feat/auth-availability`
- **risk_tier:** `irreversible`
- **blocked_by:** B5 (same file) **and founder sign-off**

> **Tier note for QA-Lead.** CLAUDE.md's table puts auth-without-a-migration at
> Full, and this brief has no migration. I am tiering it Irreversible anyway:
> it changes the only door of a live app that has no reset flow and no recovery
> email (ARCH §6.1), so a mistake locks out both users with no rollback
> available to the person locked out. Reverting the branch does not unlock the
> phone in New York. **This upgrade is deliberate, not a misread.**

**goal.** Give Eva her own credential, so getting into the archive stops
depending on a password in Adam's manager. Two hashes instead of one; the
session token carries who came in.

**files_in_scope**

```
apps/web/lib/env.ts               APP_PASSWORD_HASH -> _EVA + _ADAM
apps/web/app/api/session/route.ts
apps/web/lib/session/index.ts     getIdentity, createSession
apps/web/lib/session/profile.ts
apps/web/.env.example
plus the __tests__ for each
```

**context_files**

- `docs/04-features/PRODUCT-VISION-V2.md` §6 item 2 — *"a governance fact hiding inside an auth design."*
- `apps/web/app/api/session/route.ts` — the whole file including its four-point header. Every property it lists is one you must preserve.
- `apps/web/lib/session/token.ts:91` — `NewSession` already has an optional `mid` and `signSession` already puts it in the token. **The plumbing exists.**
- `apps/web/lib/session/index.ts:148-201` — why `source` is in `getIdentity`'s return type, and `createSession`'s existing `mid` parameter.
- `apps/web/lib/env.ts` — `scryptHashVar`, and the boot-time refusal when two salts or two hashes match.
- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §6.1, §6.2, §6.3 — especially 6.3, whose whole design was to make this a swap.

**success_criteria**

1. Two env vars, two independently generated salts, two independently generated hashes. `env.ts` already refuses to boot when two hashes or salts match — extend it to cover the new pair **and** the vault passphrase. Three secrets, all distinct.
2. **The route checks both hashes in constant time relative to each other.** Do not short-circuit on the first match: an early return makes one person's login measurably faster than the other's and turns the door into an oracle for which name was typed. Evaluate both, then decide. `lib/auth/timing.ts`'s `holdUntilFloor` discipline is your model.
3. On success, `createSession({ mid })` with the member id whose hash matched.
4. `getIdentity()` returns `source:'authenticated'` when the session carries a `mid`, falling back to the profile cookie with `source:'self_declared'` when it does not — so sessions minted before this change keep working until they expire. Every caller needing real identity already has to read that field, by design.
5. The "who's this?" picker stops being asked when the token carries a `mid`. It stays for legacy sessions.
6. **Preserve all four of the route header's properties:** Node runtime (scrypt does not exist on Edge); every declining answer takes the same time; every declining answer says the same thing (the single `DECLINED` sentence, no reason code, no hint about which password was wrong); the limiter is asked before any scrypt work.
7. **Rewrite the route's header comment.** Line 164 currently reads *"One password, two people, and the door cannot tell them apart."* That sentence is what this brief exists to make false, and leaving it is worse than never having written it.
8. `.env.example` gains both vars with the two documented traps: generate your own hash, and escape every `$` as `\$` because Next expands `$VAR` in `.env` files.
9. **Tests:** Eva's password mints a token carrying Eva's `mid`; Adam's mints Adam's; a wrong password is refused with identical message and status as before; the timing floor holds for both correct- and both wrong-password paths; a legacy token with no `mid` still verifies and still falls back to the profile cookie.
10. **A migration note in the PR body, addressed to the founder:** both env vars must be set in Vercel *before* this deploys; both phones re-enter a password once; there is still no reset flow, so a lost password is a Vercel env change plus a `SESSION_VERSION` bump.

**constraints**

- **No database migration. No Supabase Auth. No credentials table.** Those are ARCH §6.3 Phase 2 and this is the step before it. Do not skip ahead.
- **This does not complete vision item 2 and must not claim to.** It gives Eva her own credential and real identity in the token. It does not give her **rotation** (still a Vercel env var Adam controls) or **recovery** (no reset flow, by design). Say so in the session file. What gives her recovery is B1's copy in her own storage — which is why B1 is first.
- Never put a password literal in a script, test, fixture or commit message.
- Rebase onto `feat/auth-availability` before starting — you both edit the session route.

**do_not_touch:** `apps/web/lib/auth/rate-limit.ts` (B5) · `lib/shared-day/`, the photo pipeline, the outbox · `apps/web/supabase/migrations/`

**skills_to_load:** `security-audit`, `error-handling-patterns`
**session file:** `docs/08-agents_work/sessions/2026-08-03-backend-engineer-per-person-credential.md`

---

## B4 — unilateral-remove

- **worker_type:** `backend-engineer`
- **slug:** `unilateral-remove`
- **branch:** `feat/unilateral-remove`
- **base_branch:** `ceo-3-1785631504`
- **risk_tier:** `full`
- **blocked_by:** nothing

**goal.** Give either of them a way to remove what they made, alone, without
the other. The data layer already implements this and nothing exposes it —
**there is currently no way for either person to delete anything at all.**

**files_in_scope**

```
apps/web/app/api/photos/[id]/route.ts            new — DELETE only
apps/web/app/api/photos/[id]/__tests__/route.test.ts
apps/web/lib/data/photos.ts                      ONLY if softDeletePhoto lacks an author check — read it first
```

**context_files**

- `docs/04-features/PRODUCT-VISION-V2.md` §6 item 4 — and P4's sentence about intimate photographs on infrastructure one partner owns, which is why this exists.
- `apps/web/lib/data/photos.ts:453` `softDeletePhoto` and `:527` `purgePhoto` — read both; you expose only the first.
- `apps/web/lib/data/index.ts` — the data layer's front door and the only import surface a route handler may use.
- `apps/web/lib/session/index.ts:163` `getIdentity` — read the comment above it carefully. `source` is in the return type on purpose.
- `apps/web/app/api/photos/upload-url/route.ts` — the existing route's shape, error handling and test style. Match it.
- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.7 — the two deletion operations.

**success_criteria**

1. `DELETE /api/photos/[id]` calls `softDeletePhoto`. Recoverable, hidden everywhere, bytes still present. The 30-day sweep is not built here.
2. Authorised against `getIdentity()`. A person may remove a photo they authored. **This upgrades for free when B3 lands, because both read the same accessor** — that is exactly what ARCH §6.3's single-module design is for, so do not write a second identity path.
3. **State the honest limitation in the header comment:** while identity is self-declared this authorises *"someone claiming to be Eva"*, not *"Eva"*. It is no weaker than the status quo — anyone with the password can already do anything — and it delivers the half of item 4 that matters today: Eva can remove her own things without asking Adam. The protective half arrives with B3. Say it in the file rather than letting a reader assume the stronger property.
4. **Permanent purge is out of scope.** Do not expose `purgePhoto`. Do not add a query parameter, header or body field that reaches it. If you find yourself writing "purge" outside a comment, stop.
5. `401` for no session — throw/catch `UnauthenticatedError`; do **not** use `requireSessionOrRedirect` in a route handler (`lib/session/index.ts:127` explains what that breaks). `404` for a photo that does not exist or is already removed. `403` for a photo authored by the other person. Never leak which beyond the status code.
6. Idempotent: deleting an already-removed photo is `404` or `204`, never a `500`.
7. **Tests:** authored-by-me succeeds; authored-by-the-other is 403; no session is 401; unknown id is 404; already-removed is not a crash; response body shape matches the existing route's conventions.

**constraints**

- Import only from `lib/data` (the index), never from `lib/data/photos.ts` or the gateway directly.
- Zod on the route params. TypeScript strict.
- No schema change, no migration.
- **Scope guard:** vault-item removal is the other half of item 4 and needs the vault's own re-authentication (ARCH §5.6). If adding it pushes this diff past 300 lines, **stop and return it as a follow-up brief** rather than growing this one — the tier would change.

**do_not_touch:** `lib/shared-day/`, `lib/photo/`, `lib/outbox/` · `lib/auth/` and `app/api/session/` (B3/B5) · `apps/web/supabase/migrations/`

**skills_to_load:** `api-design-principles`, `error-handling-patterns`
**session file:** `docs/08-agents_work/sessions/2026-08-03-backend-engineer-unilateral-remove.md`

---

## B5 — auth-availability

- **worker_type:** `backend-engineer`
- **slug:** `auth-availability`
- **branch:** `feat/auth-availability`
- **base_branch:** `ceo-3-1785631504`
- **risk_tier:** `full`
- **blocked_by:** nothing

**goal.** Stop one vendor's bad afternoon from locking both of them out of
their own archive. The login limiter degrades to an in-process counter instead
of answering 503 — **and the vault's limiter does not.**

**files_in_scope**

```
apps/web/lib/auth/rate-limit.ts
apps/web/lib/auth/__tests__/rate-limit.test.ts
apps/web/app/api/session/route.ts          the catch block at lines 110-128 ONLY
apps/web/app/api/session/__tests__/route.test.ts
```

**context_files**

- `docs/04-features/PRODUCT-VISION-V2.md` §6 item 7 — the requirement, stated as an outcome.
- `apps/web/lib/auth/rate-limit.ts` — the whole file including the header. The current posture is argued, not accidental; you are narrowing it, not removing it.
- `apps/web/app/api/session/route.ts:110-128` — the fail-closed catch and its comment.
- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §6.1, §6.4 — the threat model you are reasoning against.

**success_criteria**

1. A new exported function in `lib/auth/rate-limit.ts` implementing the degraded decision: module-scope (per-lambda-instance) counting, allowing at most **3 failures per instance per 15 minutes** while the database is unreachable.
2. **`scope='session'` uses it. `scope='vault'` never does and keeps failing closed.** That split is what makes this safe, and it needs a comment at the point of the branch, not only in the file header.
3. The client-visible response on the degraded path is **byte-identical** to the ordinary path. No banner, no header, no different message at the door: telling a caller "the limiter is degraded" is an oracle for the one attacker this still guards against.
4. `console.error` on every entry into the degraded path, with enough detail to find it later and no credential material in it.
5. **Tests, all against the pure decision function, no database:** storage failure + correct password = in; storage failure + 4th wrong password from the same instance = refused; vault scope + storage failure = still 503; the degraded counter expires after its window; the ordinary path is unchanged when storage is healthy.
6. **The file header's existing argument for failing closed is updated, not deleted.** It is a good argument and it still holds for the vault. Rewrite it to say which door it now applies to and why the other is different.

**constraints**

- Do not weaken the healthy path. The 5-per-address-per-15-min and 20-per-hour-global numbers do not change.
- Do not add a database table, a cache vendor, or a dependency. The point is to work when the database does not.
- **Do not use a cookie or any client-supplied value as the counter.** It is attacker-controlled.
- TypeScript strict, Zod on inputs.

**do_not_touch:** `apps/web/lib/session/` and `middleware.ts` (B3 owns them; the branches would conflict) · `lib/auth/password.ts`, `lib/auth/timing.ts` · `lib/shared-day/`, the photo pipeline, the outbox

**known non-defect, not yours:** `apps/web/lib/session/__tests__/session.test.ts`
flakes ~1 run in 10. It is a test defect — the assertion mutates a base64url
character whose low bits are discarded — diagnosed in commit `9711bc9`. Do not
fix it and do not let it block you.

**skills_to_load:** `error-handling-patterns`, `security-audit`
**session file:** `docs/08-agents_work/sessions/2026-08-03-backend-engineer-auth-availability.md`

---

## B6 — if-adam-stops

- **worker_type:** `technical-writer`
- **slug:** `if-adam-stops`
- **branch:** `docs/if-adam-stops`
- **base_branch:** `feat/archive-export-mirror`
- **risk_tier:** `lite`
- **blocked_by:** B2

**goal.** One paragraph in the repo about what happens if Adam stops. Who pays
Supabase, who can restore it, and what Eva does at 3am in New York when it
returns 503.

**files_in_scope**

```
docs/IF-ADAM-STOPS.md
README.md            one link to it, near the top
```

**context_files**

- `docs/04-features/PRODUCT-VISION-V2.md` §6 item 6 — the requirement; and item 5 for what the answer now is.
- `tools/export/README.md` — B1's actual output, which you read rather than the brief for it.
- `.github/workflows/nightly-archive.yml` and `docs/03-system-design/RUNBOOK-nightly-archive.md` — B2's actual job.
- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.8a — the free-tier pause, the most likely way this actually happens.
- `apps/web/app/sw.ts` if B7 has merged — the offline read materially improves the 3am answer.

**success_criteria**

1. **It opens with the paragraph.** One paragraph, addressed to Eva, in plain English, answering the three questions before any heading. Someone frightened at 3am reads the first thing on the page and nothing else — if the answer is below a table of contents, it does not exist.
2. It says **where her copy is and how to open it** without this app, without a terminal if at all possible, and without asking anyone. That is the point, and it belongs in the second sentence.
3. Below that: who pays for what and when it renews; what a 503 means and whether waiting fixes it; how to tell whether last night's copy actually happened; who to contact.
4. **It describes what shipped, not what was briefed.** Read B1's and B2's code and READMEs. If the vault is excluded from the automatic copy, the page says so plainly — discovering that at the worst moment is the failure this page exists to prevent.
5. **No jargon without an immediate plain-English gloss.** "Supabase" means nothing to the reader; "the service that holds the photographs" does.
6. Honest about what is **not** solved: there is no password reset; if Eva's own password is lost it is a Vercel environment change; and anything already copied into either person's own storage cannot be reached by the other's delete.
7. **Under 400 words for the whole page.** A long document is one nobody reads at 3am.

**constraints**

- Do not write aspirationally. If a capability is not merged, it is not on this page.
- No credential, no URL containing a token, no bucket name that is itself a secret.
- Documentation only — do not edit any `.ts`, `.tsx` or `.sql` file.

**do_not_touch:** all source code

**skills_to_load:** `technical-writing`
**session file:** `docs/08-agents_work/sessions/2026-08-03-technical-writer-if-adam-stops.md`

---

## B7 — offline-last-thing

- **worker_type:** `frontend-engineer`
- **slug:** `offline-last-thing`
- **branch:** `feat/offline-last-thing`
- **base_branch:** `ceo-3-1785631504`
- **risk_tier:** `full`
- **blocked_by:** nothing

**Why this brief exists.** The iOS push verification closed the possibility of
an arrival reaching the lock screen, which makes the tap the only path to an
arrival. So §6.7 has three legs: a copy in Eva's storage (B1+B2), a door that
degrades (B5), and **an app that can show her the last thing without the
network** — which was unbriefed. Without it, B5 converts a 503 into a blank
screen.

**goal.** A service worker so that the last thing the other one left is still
there when Supabase is not — without ever writing a byte of vault content to
disk.

**files_in_scope**

```
apps/web/app/sw.ts                                    new — the Serwist entry
apps/web/next.config.ts                               wrap with withSerwist; currently six bare lines
apps/web/components/chrome/ServiceWorkerRegistration.tsx   new, client
apps/web/app/sw.__tests__/                            route-classification tests, pure, no browser
```

**context_files**

- `docs/03-system-design/LDR-APP-ARCHITECTURE.md` §7.2 and §7.3 — the full specified table. **You are building a narrow subset of it with full exclusion rigour.** Read §7.2's paragraph on why the vault exclusion is enforced three independent ways.
- `docs/04-features/PRODUCT-VISION-V2.md` §4.4 — *"nothing is ever consumed, the last thing left stays up"*. This is why an offline read is not a degraded mode: the outage renders exactly what the product renders anyway.
- `apps/web/lib/schema.ts` — `VAULT_PATH_PREFIX`, `isVaultStoragePath`, `VAULT_OBJECT_PATH`. Import these; never re-spell the prefix. A drift test exists because someone did exactly that and shipped a defence that could never fire.
- `apps/web/middleware.ts` — the allowlist already publishes `/sw.js` and `/manifest.webmanifest`; you are creating files it has been advertising.

**success_criteria**

1. **Scope is deliberately narrow:** the app shell, the navigation fallback, and `CacheFirst` on `/p/*/display.jpg` and `/p/*/thumb.jpg`. **Not** the book warm-up ladder, **not** the 300/600 LRU caps, **not** the activity index, **not** the offline progress indicator. Those are §7.2's full scope and belong to the Book track.
2. **The vault exclusion is built at full strength anyway** — all three independent mechanisms from §7.2: (a) a path rule keyed on `VAULT_PATH_PREFIX` imported from `lib/schema.ts`, evaluated inside `fetch` from the request URL before any response exists; (b) `NetworkOnly` on any response carrying `Cache-Control: no-store`; (c) vault items never appear in any warm-up or precache manifest. **A partial service worker that caches display images without all three is a privacy failure, not an incomplete feature.**
3. `/api/*` is `NetworkOnly`. No exceptions, no allowlist, no "just the read endpoints".
4. Navigations are `NetworkFirst` with a 3s timeout falling back to an offline shell. **The offline shell contains no personal content** — no photograph, no caption, no name. It is chrome, plus whatever the cached image layer supplies on its own terms.
5. **A cache purge on sign-out.** `destroySession()` clears cookies and nothing else; `SESSION_VERSION` is documented as the panic lever that kills every session everywhere, and **it does not purge cached bytes.** That gap is real today and shipping a cache without closing it makes it worse. Wire `DELETE /api/session` to trigger a client-side `caches.delete()` sweep, and say in the header comment that the kill-switch and the cache are two separate levers.
6. **A kill switch.** The service worker must be able to unregister itself and clear its caches on a version signal. A bad SW is the one artifact in a web app that persists on the device after the bad deploy is reverted, and "both users are reachable in person" is not a recovery plan.
7. **Tests as pure functions over request URLs, no browser needed:** a `v/` path is never cached, in upper case too; a `p/` path is; an `/api/` path is not; a `no-store` response is not; the vault check runs before any response is available.

**constraints**

- **Do not build the manifest, the icons, or the install overlay.** They do not exist (`public/` holds only `fonts`) and they belong to the Book/PWA track — see the cross-track note below.
- Do not touch `lib/shared-day/`, the photo pipeline, or the outbox.
- Do not touch `lib/auth/`, `lib/session/` or `app/api/session/route.ts` beyond the sign-out purge hook — B3 and B5 own those files.
- TypeScript strict.

**qa_lead_note.** The specific hazard is **stickiness**: a service worker
survives the revert of the deploy that shipped it. I tiered this Full rather
than Irreversible because it involves no migration, no workflow file and no
credential — but criteria 5 and 6 are what make that tier defensible. **If
either is missing from the diff, the tier is wrong and it should come back.**

**do_not_touch:** `lib/shared-day/`, `lib/photo/`, `lib/outbox/` · `lib/auth/`, `lib/session/` · `apps/web/supabase/migrations/`

**skills_to_load:** `nextjs-app-router-patterns`, `sharp-edges`
**session file:** `docs/08-agents_work/sessions/2026-08-03-frontend-engineer-offline-last-thing.md`

---

## Pending founder sign-offs

Neither blocks a start. Both must land before **B2** merges.

1. **The vault is excluded from the automatic copy.** Recommended. An
   unencrypted nightly mirror of `v/` into a synced cloud account defeats the
   structural privacy separation the schema was built around — separate table,
   separate prefix, no thumbnail ever generated (migration 04), a storage
   trigger enforcing the split (migration 11), a second independent secret
   (§6.4). Vault content stays reachable, deliberately, via `--include-vault`
   with the passphrase. But an archive that silently omits half of itself is
   also not an archive, so the founder should choose knowingly.

2. **A copy in Eva's storage makes ARCH §5.7's propagation promise false.**
   §5.7 requires the cold copy be a mirror so a permanent delete is not undone
   by the backup, and says the 24-hour window is stated in the UI. A copy in an
   account Adam does not control cannot receive his purges — and **should not**,
   because a copy he can reach into is not a copy that protects her from him.
   Vision item 5 and ARCH §5.7 are in direct conflict; the vision wins.
   **Consequence: the delete UI may no longer promise propagation, and both of
   them need to know that anything which sat in the archive overnight may exist
   in the other's copy permanently.** That is a product fact, not a technical
   one.

## Cross-track finding — not in this packet

The entire PWA layer is unbuilt. No manifest, no icons, no service worker, no
install path — while `middleware.ts` has been publishing five PWA paths that do
not exist. Install belongs to the Today/The Book track, and *"works installed
on an iPhone"* is a founder immovable that track already owns.

It bounds B7: iOS evicts site data after ~7 days without interaction and
home-screen web apps are exempt (ARCH §7.4), so B7's offline cache is real but
**not durable until the app is installable**. B7 ships useful either way. Not a
blocker for anything here.
