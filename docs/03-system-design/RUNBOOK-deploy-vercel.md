# Runbook — deploying Eva & Adam to Vercel

**Config file:** `apps/web/vercel.json`
**Deployment root:** `apps/web` (this is a setting in the Vercel dashboard, and it is load-bearing — see §2)
**Written by:** devops-engineer, 2026-08-10, branch `devops/deploy`
**Risk tier:** irreversible — first internet exposure of a private two-person app; touches the live Supabase project

---

## §0 — Read this first

**Nobody has run this runbook.** It was written by an agent that was explicitly told not to deploy, not to create a Vercel project, and not to touch the live database. Everything in it that could be measured on this machine *was* measured, and §10 lists — precisely — every claim that could not be. Read §10 before you start, not after something fails.

**You are the only one who can do the secret-handling steps.** Four values in §3 are credentials. Generate them in your own terminal and paste them into the Vercel dashboard yourself. Do not ask an agent to generate, read back, echo, or "just check" any of them: a valid session token has already reached an agent log once on this project, which is why §6 makes rotating `SESSION_SECRET` part of the deploy rather than a follow-up.

**What you are deploying.** `apps/web` — the Next.js 16 app. Not the repository root (`gsa-startup-kit`, the agent kit), not `war-room-dashboard`, not the Framer marketing site. One app, one project.

**What already exists.** `https://eva-and-adam.vercel.app` is the v6 build from 2026-08-02 — before the visual rebuild. It is not the current code. Whether you reuse that Vercel project or create a new one is §2.1.

---

## §1 — The order everything happens in

The order matters twice, and both places are easy to get wrong.

1. **Establish what is actually in Supabase** (§5) — *before* the first deploy. The build reads the database. If the schema is not there, the build fails, and the failure looks like a Next.js error rather than a database one.
2. **Create / configure the Vercel project** (§2).
3. **Generate credentials and set environment variables** (§3), including a *brand-new* `SESSION_SECRET` (§6).
4. **Deploy.**
5. **Check it** (§7).

Do not set environment variables before §5. If you have to change `NEXT_PUBLIC_SUPABASE_URL` afterwards you will be redeploying anyway.

---

## §2 — The Vercel project

### §2.1 — New project, or reuse the old one?

**Reuse `eva-and-adam` if it is still connected to this repository.** Eva may already have that URL; keeping it means she does not have to be told a new one, and this app has exactly one person to tell. If you reuse it, you must still do all of §2.2 — the old project was configured for a different tree and its Root Directory is almost certainly wrong for the current one — and you must do §6, because whatever `SESSION_SECRET` that project holds is the one being rotated away from.

Create a new project only if the old one is disconnected or you cannot get into it.

### §2.2 — Settings

| Setting | Value | Why |
|---|---|---|
| **Root Directory** | `apps/web` | The single most important setting here. See below. |
| **Framework Preset** | Next.js | Auto-detected once Root Directory is right. |
| **Build Command** | leave as "override from vercel.json" | Set in `apps/web/vercel.json`. Do not also type it in the dashboard. |
| **Install Command** | leave as "override from vercel.json" | Same. |
| **Output Directory** | leave blank | Next.js default (`.next`), correct. |
| **Node.js Version** | leave at the project default | Verified locally on Node 24.11.1; Vercel's default is currently 22.x. See §10. |
| **Include files outside root directory** | **off** | `apps/web` is self-contained — it has its own `package.json` and its own `pnpm-lock.yaml`, and no module in it imports anything above `apps/web`. Verified by grep. |

**Why Root Directory is `apps/web` and not the repository root.** The root `package.json` is `gsa-startup-kit`, the agent kit — an npm package with a `bin/`, no Next.js app, and `engines.node: ">=18"`. Pointing Vercel at the repository root aims the framework detector, the install, and the Node version selection at the wrong package entirely. `apps/web` has everything the build needs and nothing it does not.

**The consequence, which used to be an open question in the repository.** `.vercelignore` is read from the deployment root. With the root set to `apps/web`, the repository-root `.vercelignore` no longer applies — that was the caveat written into that file, and it is now settled in both directions: the root file says it is dormant and why, and `apps/web/.vercelignore` exists and is the live one. Everything the root file excluded (`docs/`, `war-room/`, `guides/`, `.agent/`, `.claude/`, root `*.png`) is above `apps/web` and therefore already outside the upload.

### §2.3 — What `vercel.json` sets, and why

`vercel.json` is JSON and cannot carry comments, so the reasons live here.

```json
"installCommand": "pnpm install --frozen-lockfile"
```
`apps/web` contains **two** lockfiles: `pnpm-lock.yaml` (current — last regenerated at commit `7fbd0ee`) and `package-lock.json` (stale — untouched since `757c816`). Their top-level dependency ranges still agree, so this is not urgent, but which package manager Vercel would pick on its own is a guess. Naming the command removes the guess. `--frozen-lockfile` makes a lockfile that has drifted from `package.json` a loud build failure instead of a silently different dependency tree.

```json
"buildCommand": "pnpm exec next build && node scripts/build-sw.mjs"
```
Two things, both deliberate.

*The service worker step is spelled out rather than relied upon.* `package.json` has `"postbuild": "node scripts/build-sw.mjs"`, and pnpm's `enable-pre-post-scripts` — which decides whether `pnpm build` also runs `postbuild` — has changed default between pnpm majors. If Vercel runs a pnpm version where it is off, `public/sw.js` is never built, `/sw.js` 404s, the service worker never installs, and the offline shell and image caching are silently absent with a green build. Naming both halves means the SW is built exactly once regardless of which pnpm Vercel picks.

*`pnpm exec` rather than bare `next`.* Removes the assumption that `node_modules/.bin` is on `PATH` for the build command.

```json
"headers": [{ "source": "/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive, nosnippet, noimageindex" }] }]
```
The robots policy — see §8.

### §2.4 — Deployment Protection

Leave **Vercel Authentication ON for Preview deployments** (the default). Preview URLs are guessable and are not covered by anything else.

Production is different: it must be reachable by Eva, who has no Vercel account, so Vercel Authentication has to be **off** for production. The app's own door — `middleware.ts` plus `requireSession()` in every route — is what protects production. That is the design, and §8 is the audit of it.

---

## §3 — The five environment variables

All five are **required**. `apps/web/lib/env.ts` validates them at module evaluation, so importing that file *is* the boot check — a bad value fails the build, not the first request. Only `ANTHROPIC_API_KEY` is optional.

**Set all five in all three Vercel environments — Production, Preview and Development.** Not just Production. **The build itself needs them**: `next build` imports the route handlers to read their segment config, which evaluates `lib/env.ts`. Measured — with no variables set, the build dies at "Collecting page data" with `EnvironmentError`, listing all five as missing. A Preview deployment with no variables will fail to build for this reason and nothing else.

### §3.1 — What each one is

| Variable | Format | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` — https, bare origin, no trailing path, no `?`, no `#` | Supabase dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | one line, no whitespace anywhere, ≥ 40 chars | Supabase dashboard → Project Settings → API → `service_role` key. **Bypasses RLS entirely** — every table is deny-all with zero policies, so this key is the only thing that can read anything. |
| `APP_PASSWORD_HASH` | `scrypt$16384$8$1$<salt-b64>$<key-b64>` | Generate — §3.2. Opens the app. Both of you know it. |
| `VAULT_PASSPHRASE_HASH` | same format | Generate — §3.2. Opens the vault. **A different secret**, independently generated. |
| `SESSION_SECRET` | canonical base64 decoding to ≥ 32 bytes | Generate — §3.2. **Generate a new one now** — see §6. |
| `ANTHROPIC_API_KEY` | optional | Without it the margin's route answers 503 and nothing else changes. |

The only variable in this app permitted to carry the `NEXT_PUBLIC_` prefix is `NEXT_PUBLIC_SUPABASE_URL`. Anything else you add with that prefix will refuse to boot — deliberately, because that prefix means "inlined into the JavaScript every browser downloads". The one exception is Vercel's own `NEXT_PUBLIC_VERCEL_*` system variables, which are allowed by namespace; you can leave "Automatically expose System Environment Variables" on.

### §3.2 — Generating the three you have to generate

**Run these in your own terminal.** Each reads the secret from standard input rather than an argument, so nothing lands in your shell history. Type the secret, press Return, then press **Ctrl-D**.

The app password hash:

```sh
node -e 'const{scryptSync,randomBytes}=require("node:crypto");const s=require("node:fs").readFileSync(0,"utf8").trim();const N=16384,r=8,p=1,salt=randomBytes(16);console.log(`scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${scryptSync(s,salt,32,{N,r,p}).toString("base64")}`)'
```

Run it **twice** — once for the app password, once for the vault passphrase, with **two different secrets you generate in a password manager**. Not one you invent, and not the app password with something added to it. A fresh salt is drawn each run, so running it twice on the *same* secret would produce two different-looking hashes that both open to the same word; the boot check cannot catch that, and it is the whole reason the vault is a second door.

The session secret:

```sh
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64"))'
```

Both commands are verified: values they produced were fed to a real `next build`, and `lib/env.ts` accepted them.

### §3.3 — The `$` question, answered for both places

`apps/web/.env.example` warns that every `$` in a scrypt hash must be written `\$` in a `.env` file. That warning is correct and it is narrower than it looks. Re-measured on the installed Next 16.2.12, feeding `scrypt$16384$8$1$AAAA$BBBB` through Next's own `.env` loader:

| written in `.env.local` as | arrives as |
|---|---|
| `RAW=scrypt$16384$8$1$AAAA$BBBB` | `scrypt6384` — mangled |
| `SINGLE='scrypt$16384$8$1$AAAA$BBBB'` | `scrypt6384` — mangled |
| `DOUBLE="scrypt$16384$8$1$AAAA$BBBB"` | `scrypt6384` — mangled |
| `ESCAPED=scrypt\$16384\$8\$1\$AAAA\$BBBB` | intact |

**In the Vercel dashboard: paste the hash exactly as generated. Do not escape anything.** Dashboard values are injected as process environment variables and never pass through a `.env` parser. This was tested the faithful way — a build whose five variables were injected into the child process directly, hashes carrying five literal `$` characters each, which passed the boot check and built. It has not been confirmed on Vercel's own infrastructure (§10).

**The trap that survives, and it has teeth: `vercel env pull` writes `.env.local` with double quotes** — the `DOUBLE` row above. So pulling your production environment down to run the app locally produces a file this app cannot boot from, and the error will name your hashes, which are fine. If you use `vercel env pull`, re-escape the two hash lines to `\$` by hand afterwards.

And the trap `.env.example` note 2 already documents: never define these variables in *both* the process environment and `.env.local`. Either alone works; together they fail with "malformed".

---

## §4 — Every failure message, decoded

The build fails with `Invalid environment for apps/web. The app will not start.` followed by one line per problem. All of them at once — it does not stop at the first.

| Message | What actually happened |
|---|---|
| `X is missing.` | Absent, empty, or whitespace-only. In Vercel: check you set it for **this** environment — Production, Preview and Development are separate lists. |
| `NEXT_PUBLIC_SUPABASE_URL is not a valid absolute URL.` | Missing the `https://`, or a typo. |
| `... must use https` | You pasted an `http://` URL. |
| `... must be a bare origin — no query string, no fragment` | You copied a URL out of the browser address bar with something after the hostname. Everything from the first `?` or `#` must go, and so must any trailing path. |
| `SUPABASE_SERVICE_ROLE_KEY contains whitespace` | The paste line-wrapped, or picked up a trailing newline. Re-copy it as one line. |
| `SUPABASE_SERVICE_ROLE_KEY is too short` | You pasted the `anon` key's neighbour, a truncated copy, or a project ref. |
| `APP_PASSWORD_HASH is malformed. Expected "scrypt$<N>$..."` | The single most likely cause is that the `$` characters were eaten (§3.3). In the dashboard, look for a value that starts `scrypt` and then jumps straight to digits. Second cause: you pasted the plaintext password instead of the hash. |
| `... has scrypt N below the 16384 minimum` / `... is not a power of two` | The hash was generated by something other than §3.2's command. |
| `... has a N-byte salt` / `... has a N-byte derived key` | Same. Regenerate with §3.2. |
| `... salt is not canonical base64` / `... derived key is not canonical base64` | The hash was truncated, or a character was lost on copy. Regenerate. |
| `SESSION_SECRET is not canonical base64.` | Not from §3.2's command — or it picked up a stray character. |
| `SESSION_SECRET decodes to N bytes; HS256 needs at least 32.` | Too short. §3.2 produces exactly 32. |
| **`APP_PASSWORD_HASH and VAULT_PASSPHRASE_HASH share a salt.`** | You copied the whole app-password line and edited the variable name. Regenerate the vault hash from scratch. This one is worth stopping over: a shared salt means one precomputation attacks both doors. |
| **`... are the same hash.`** | The vault passphrase is the app password. The vault is not a second door. Regenerate. |
| `X uses the NEXT_PUBLIC_ prefix, which inlines it into the browser bundle.` | You created a variable named `NEXT_PUBLIC_something` that is not the Supabase URL. Rename it. If a secret got that prefix and was ever deployed, treat it as published and rotate it — it is in every cached bundle. |

Two of those messages tell you to "see `apps/web/README.md`". **That file does not exist** — `lib/env.ts` points at it twice and nothing is there. Use §3.2 above instead. (Reported; not fixed on this branch.)

---

## §5 — Supabase: establish ground truth before you deploy

### §5.1 — Why this is step one

Two of the app's routes read the database, and **the build reads it too**. `apps/web/supabase/migrations/README.md` records honestly that nobody has ever checked which of the 13 migration files are applied to project `oqiyzzpcsdlqqcjlpmix` — only that *tables exist*, confirmed from the dashboard on 2026-08-04. That is not enough to deploy on. Find out.

None of the queries below writes anything. Run them in the Supabase dashboard → **SQL Editor**. They are read-only catalogue lookups, they are yours to run and not an agent's, and — stated plainly — **they have never been executed anywhere** (§10), so treat a syntax error as a typo in this document rather than as a finding about your database.

### §5.2 — Which tables exist

```sql
select table_name
  from information_schema.tables
 where table_schema = 'public'
 order by table_name;
```

Expect eleven: `activity_log`, `activity_state`, `app_settings`, `auth_attempts`, `book_entries`, `date_turns`, `dates`, `members`, `photos`, `purge_audit`, `vault_items`.

### §5.3 — The rest of the schema, migration by migration

```sql
-- 01: enums
select typname from pg_type
 where typname in ('photo_kind','date_kind','date_status');
-- expect 3 rows

-- 08: the shared-day function
select proname from pg_proc where proname = 'shared_day_of';
-- expect 1 row

-- 09: the two views
select table_name from information_schema.views
 where table_schema = 'public'
   and table_name in ('v_shared_days','v_days_together');
-- expect 2 rows

-- 10: RLS on, and ZERO policies. Both halves matter.
select c.relname, c.relrowsecurity,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relname;
-- expect relrowsecurity = true and policies = 0 on every row

-- 12: photos.author_member_id must be nullable
select is_nullable from information_schema.columns
 where table_schema='public' and table_name='photos' and column_name='author_member_id';
-- expect YES

-- 13: the people column
select column_name from information_schema.columns
 where table_schema='public' and table_name='photos' and column_name='people';
-- expect 1 row
```

### §5.4 — The `media` bucket (migration 11)

```sql
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets where id = 'media';
```

Required: `public = false`, `file_size_limit = 26214400` (25 MiB), `allowed_mime_types = {image/jpeg}`.

**If `public` is `true`, stop and fix it before deploying.** Every read in this app goes through a signed URL minted by the server; a public bucket serves every object in it to anyone who can guess a path, and that boolean is bucket-wide. This is the one setting migration 11 exists to get right.

And the prefix guard:

```sql
select tgname, tgenabled from pg_trigger
 where tgrelid = 'storage.objects'::regclass and not tgisinternal;
```

`tgenabled = 'O'` means enabled. This trigger is the only mechanism keeping vault objects (`v/`) out of the ordinary photo path (`p/`). If it is absent, read migration 11's own header before applying anything — it warns specifically about the `42501` privilege failure and says, in bold, not to delete the guard to make the migration pass.

### §5.5 — If migrations are missing

Applying migrations to the live project is **Irreversible tier** and needs your explicit sign-off, per `apps/web/supabase/migrations/README.md`. Two further facts from that file, both still true:

- **None of this SQL has ever been executed anywhere** by the agent that wrote it — there was no container runtime on that machine.
- **`supabase/seed.sql` must never run against the hosted project**, and neither must `supabase db reset`, which runs it automatically.

### §5.6 — The service-role key lives in two places

`.github/workflows/nightly-archive.yml` uses `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` from **GitHub Actions secrets**. Vercel is a second, independent copy. If you ever rotate that key, change it in both or the nightly archive stops silently.

That workflow also exists to keep the free-tier project from pausing after seven days of inactivity. A paused database is an app returning 503.

---

## §6 — `SESSION_SECRET`: rotate as part of this deploy, not after

A valid session token reached an agent log. The value backing it must be replaced.

**Sequence it here, at setup, because here it is free.** Rotating `SESSION_SECRET` invalidates every existing session. Nobody has a session on this deployment yet — it does not exist — so doing it now costs one sign-in each and nothing else. Doing it a week later signs Eva out mid-use, in another timezone, possibly without an obvious reason.

1. Generate a **new** value with §3.2's command.
2. Put that new value into Vercel. **Never paste the old one anywhere**, not even temporarily, and not "just to get the first deploy working".
3. If the old value is in your local `apps/web/.env.local`, replace it there too. Local and deployed do not have to match — they are separate session populations — but leaving a known-leaked secret sitting in a file is how it reaches a log a second time.
4. You will both sign in again after the first deploy. That is the whole cost.

Do not reuse the `SESSION_SECRET` from the old `eva-and-adam` project.

**Related, and a correction worth having:** `app/sw.ts` describes `SESSION_VERSION` as "(env var) — the session panic lever". It is not an environment variable. It is a constant at `lib/session/token.ts:40`, currently `1`. Bumping it requires a code change and a redeploy. If you ever need to invalidate every session at once, the lever you actually have is rotating `SESSION_SECRET` in the dashboard — which takes effect on the next request, with no deploy.

---

## §7 — After it is up

Sign-in first — almost nothing is reachable without it.

1. **`/` redirects to `/today`, signed out you land on `/login`.** If instead you get a 503 on sign-in, the cause is almost certainly Supabase: `POST /api/session` reads `auth_attempts` *before* it looks at the password, and the rate limiter **fails closed** — a network error there is treated exactly like being under attack. A paused free-tier project does this.
2. **Sign in with the app password** (the plaintext behind `APP_PASSWORD_HASH`).
3. **`/today`, `/book`, `/book/days`** — all three read the live database. `/book` and `/book/days` are rendered per request as of this branch; if either shows content that does not change when the database does, the `force-dynamic` fix on those two pages has been lost (§9.1).
4. **`/sw.js` returns JavaScript, not a 404.** If it 404s, the service-worker build step did not run — check the build log for `[build-sw] done`. Everything else works; offline and image caching do not.
5. **`/robots.txt`** returns `User-agent: *` / `Disallow: /`.
6. **`/manifest.webmanifest`** returns JSON.
7. **Response headers carry `X-Robots-Tag: noindex, ...`** on a normal page.
8. **A photo renders.** `/p/{id}/display.jpg` is served by a route handler that calls `requireSession()` itself — verified by reading it, and it matters, because the middleware matcher skips every path with a file extension and never runs for that URL at all (§8).

**Two ~6 MB PNGs ship in `public/`** — `paper-bone-v2.png` and `paper-bone-laid.png`. The service-worker build already warns that both exceed the precache size limit and are excluded. They are still downloaded on demand by anyone whose screen needs them, over whatever connection Eva has. Not a deploy blocker; a real number to look at once the app is being used on a phone.

---

## §8 — The public surface: what is reachable with no session

This section is an audit, not a change. `middleware.ts` is the auth boundary and this branch does not touch it.

### §8.1 — The matcher runs less often than the allowlist suggests

`middleware.ts`'s matcher is `/((?!_next/static|_next/image|.*\.[^/]+$).*)` — it deliberately skips anything with a file extension. Tested against the real paths:

| path | middleware runs? |
|---|---|
| `/today`, `/book`, `/login` | yes |
| `/manifest.webmanifest`, `/favicon.ico`, `/apple-touch-icon.png`, `/robots.txt`, `/sw.js` | **no — skipped by the matcher** |
| `/icons/icon-192.png` | **no** |
| `/img/foo.jpg` | **no** |
| `/api/img/abc.jpg` | **no** |
| `/api/img/abc` | **yes** |
| `/p/123/display.jpg` | **no** |

So the allowlist's five extension-bearing entries — `/manifest.webmanifest`, `/favicon.ico`, `/apple-touch-icon.png`, `/robots.txt`, `/sw.js` — and the `/icons/` prefix are **inert**. The matcher already exempts those requests; the allowlist never sees them. Removing those lines would change nothing, and adding a file at any of those paths publishes it whether or not it is listed.

The general rule this implies is bigger than the list: **everything in `public/` is on the internet.** The fonts and the ~50 material images already are.

The one entry that is genuinely load-bearing and genuinely empty is **`/api/img/`**. An extensionless request under it — `/api/img/anything` — *does* reach the middleware and *is* waved through with no session. No route exists there today, so it 404s. The day someone adds `app/api/img/.../route.ts`, it is internet-public with no line changed and no review.

`/img/` is the same shape but weaker: no directory exists, and any real image path under it would carry an extension and skip the middleware anyway.

`/p/123/display.jpg` skipping the middleware is **fine** and is the design working — "middleware is the fast path, not the guarantee". That route handler calls `requireSession()` itself before it looks at anything. Verified by reading `app/p/[photoId]/[variant]/route.ts`.

### §8.2 — The recommended change, for your own hand

`middleware.ts` needs the founder's own hand; an agent proposing it is the most an agent should do. The exact diff is in the devops-engineer's return for this branch. In one line: delete the `/api/img/` and `/img/` prefixes, because nothing implements them and both are pre-published holes. The five inert exact-match entries can stay — they are harmless and they document intent.

### §8.3 — Robots

Three layers, because a private app being indexed cannot be undone by fixing it afterwards:

1. `/robots.txt` — `Disallow: /` for everyone (`app/robots.ts`).
2. `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` on **every** response (`vercel.json`). This is the one that matters: a page can be indexed URL-only from an inbound link even when robots.txt disallows it, and this header travels with the response regardless of how it was reached.
3. Every route worth indexing needs a session anyway — a crawler ignoring both gets a 307 to `/login`.

---

## §9 — Known gaps, deliberately left

### §9.1 — Two pages were being frozen into the build

Fixed on this branch, recorded here because it will be invisible again if it regresses. `/book` and `/book/days` read the live database and touched no request-scoped API, so Next classified them `○ (Static)` and **prerendered them at build time** — baking whatever the archive held during the deploy into a CDN artefact that would never change until the next deploy. Eva adds a photograph in New York; The Book does not learn.

`next dev` renders everything dynamically, so on the LAN this could not be seen. It is a deploy-only bug, found by reading `next build`'s route table.

Both pages now carry `export const dynamic = "force-dynamic"`. `/today` was already dynamic by accident — it reads the `profile` cookie. **A live database read is not on its own enough to make a route dynamic**; `supabase-js` issues an ordinary `fetch` that Next is free to cache. Any future page that reads data and reads no cookie needs this line.

### §9.2 — No app icon

`app/manifest.ts` deliberately ships **without an `icons` array**. An icon is artwork and a design decision. The consequence: Chrome and Android will not offer "Install app", and iOS "Add to Home Screen" falls back to a screenshot of the page instead of an icon. The app is fully usable either way.

To finish it, drop these into `apps/web/public/` and add the array to `app/manifest.ts`:

| file | size | purpose |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | Chrome / Android minimum |
| `public/icons/icon-512.png` | 512×512 | Chrome / Android minimum |
| `public/icons/maskable-512.png` | 512×512, art inside the safe circle | Android adaptive icon |
| `public/apple-touch-icon.png` | 180×180, no transparency | iOS home screen |
| `public/favicon.ico` | 32×32 | browser tab |

All five paths are already public by §8.1 — they carry file extensions, so the middleware never runs for them. That is what you want for icons; note it anyway.

### §9.3 — Not done, on purpose

- **`apps/web/package-lock.json` not deleted — and do not delete it casually.** It is stale (last touched at `757c816`) and it is not what Vercel will use, because `vercel.json` names pnpm explicitly. But `.github/workflows/nightly-archive.yml:119-121` installs `apps/web` with **`npm ci`**, which needs exactly that file. Deleting it breaks the nightly archive; the nightly archive is also what keeps the free-tier Supabase project from pausing; a paused project is a deployed app that 503s on sign-in (§7 step 1). Whoever reconciles the two lockfiles has to change the workflow in the same commit. Two package managers against one `apps/web` is the real defect here, and it is not this branch's to fix.
- **`turbopack.root` / `outputFileTracingRoot` not set.** `next build` warns about multiple lockfiles and infers a workspace root well outside this repository. It is a local-machine artefact — on Vercel with the root at `apps/web` there is one lockfile in scope — and silencing it means editing `next.config.ts`, which this branch is not permitted to touch.
- **`middleware.ts` deprecation.** Next 16.2.12 warns: *"The `middleware` file convention is deprecated. Please use `proxy` instead."* It still works. It is the auth boundary, so migrating it is its own piece of work with its own review.
- **No serverless region pinned.** `vercel.json` sets no `regions`. The right value is whichever region the Supabase project is in, and that was not established. Vercel's default is US East; if Supabase is in Europe, every database round trip crosses the Atlantic twice. Check the Supabase project's region and consider setting it.

---

## §10 — What could not be verified without deploying

The most useful list in this document. Everything below is reasoned or read, **not measured**.

**Verified on this machine (Node 24.11.1, pnpm 9.12.3, Next 16.2.12):**
- `pnpm install --frozen-lockfile` succeeds from a clean checkout of `main`.
- `pnpm typecheck` passes.
- The literal `buildCommand` string from `vercel.json` runs to completion, service-worker step included.
- The build fails with `EnvironmentError` when the five variables are absent — the boot check fires at build, not just runtime.
- The build succeeds when they are injected as process environment variables with literal `$` characters, unescaped.
- Both credential commands in §3.2 produce values `lib/env.ts` accepts, end to end through a real build.
- `pnpm test` — 68 files, 1021 tests, all pass. (One file fails until `pnpm install` has been run in `tools/` as well; `tools/node_modules` is gitignored and CI installs it separately. Confirmed by installing and re-running, not assumed.)
- `pnpm lint` fails on `main` with **4 pre-existing errors** — `components/auth/LoginForm.tsx`, `components/dates/DatesExplorer.tsx`, `lib/outbox/uploader.ts`, `lib/viewer.ts`, all `react-hooks/set-state-in-effect`. None are in files this branch touches, and lint is not part of the Vercel build, so this does not block a deploy. It does mean there is no lint gate standing between here and production.
- The `.env` quoting table in §3.3 — all four rows, on the installed Next.
- The middleware matcher table in §8.1 — every row.
- `/book` and `/book/days` were `○ (Static)` before the fix and are `ƒ (Dynamic)` after it.

**Not verified, because nobody has deployed this:**
1. **That any of it works on Vercel at all.** No deployment was made, no project created, no `vercel` command run. Zero of this configuration has been executed by Vercel.
2. **That `apps/web/.vercelignore` does anything for a Git-integration deploy.** `.vercelignore` is documented for the upload a CLI deploy performs; whether it also prunes a Git build's working tree is untested here. Treat it as a size measure, never a boundary.
3. **That literal `$` survives Vercel's own environment injection.** The mechanism was simulated faithfully — direct process-env injection — and passed. Vercel's actual pipeline was not exercised.
4. **The Node version.** Verified on 24.11.1; Vercel's default is 22.x. `apps/web/package.json` declares no `engines`, deliberately, so Vercel picks its default rather than being pinned to something untested.
5. **Every SQL query in §5.** Written from the migration files, never executed. No agent on this project can reach the live database.
6. **Which migrations are actually applied.** Still unknown. §5 is how you find out; it is not a report of what is there.
7. **That the build succeeds against the real Supabase.** The successful builds here ran against a local stub returning `[]`. A real project with real rows exercises `liveBookLeaves` and `liveWhatCameBack` for the first time.
8. **Anything about behaviour on a phone**, over a real connection, from New York. That is the entire point of the deploy and none of it has happened.
9. **`X-Robots-Tag` actually appearing on responses.** The `vercel.json` `headers` block is unexercised — check it in §7 step 7.

---

## §11 — Rollback

**The app:** Vercel keeps previous deployments. Dashboard → Deployments → the previous one → **Instant Rollback**. Takes seconds and needs no build.

**One thing a rollback does not reach: the service worker.** A bad service worker survives reverting the deploy that created it — it is installed on the device, not on the server. `app/sw.ts` carries a `KILL_SWITCH` constant for exactly this: flip it to `true` and deploy, and the SW unregisters itself and clears its caches on next install. That is a forward deploy, not a rollback.

**Environment variables do not roll back with a deployment.** Changing one in the dashboard requires a redeploy to take effect, and rolling back to an older deployment does not restore the older values.

**The database does not roll back with the app.** Nothing in this runbook applies a migration. If you apply one and then roll the app back, the schema stays forward. Down-migrations exist in `apps/web/supabase/migrations/down/`; read each file's own warnings first — several destroy data once real content exists, and per that directory's README, *the irreversible event in this system is the first real photograph committing to `photos` or `vault_items`*, not the schema landing.
