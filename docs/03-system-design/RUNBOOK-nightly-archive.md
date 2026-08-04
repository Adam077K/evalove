# Runbook — nightly-archive workflow

**Workflow file:** `.github/workflows/nightly-archive.yml`
**Schedule:** 02:00 UTC, daily
**Managed by:** devops-engineer (B2, 2026-08-03)
**Risk tier:** irreversible — holds a write credential to Eva's account; copies created cannot be recalled

---

## §1 — What this job does

Every night at 02:00 UTC this job does two things:

**1. Archives the photos into Eva's storage.**
It runs B1's export CLI (`tools/export/index.ts`) against the live Supabase database, writes every photo in open formats to a local directory, verifies every file's SHA-256 checksum, then uploads the whole tree to Eva's own Cloudflare R2 bucket. If the checksum step fails, the upload does not run — a corrupt copy is not uploaded.

**2. Keeps the app alive.**
Supabase pauses free-tier projects after seven days of inactivity. Running this job queries the database every night, resetting the inactivity timer. Without this job, a quiet week ends with a paused database and an app that returns 503. Read the consequence comment in `.github/workflows/nightly-archive.yml` before disabling this job for any reason.

One job, both purposes. They cannot drift apart.

---

## §2 — What this copy is (and is not)

**It is Eva's copy, in Eva's account, not reachable by Adam.**
The purpose of this copy is that it exists somewhere Adam does not control. A copy in Adam's account, or in the project account, is the status quo wearing a backup's clothes — he is already the single point of failure this job exists to route around.

**It does not propagate deletes.**
Purges in the main app do not propagate into Eva's copy. The founder has ruled that nothing in this system is ever permanently destroyed, so there is nothing to propagate. Even if that policy changes, Eva's copy deliberately preserves her photos regardless. This contradicts ARCH §5.7 item 4 (mirror requirement); the vision wins. Ref: PRODUCT-VISION-V2 §6 item 5.

**The vault is excluded from this job.**
The job runs without `--include-vault`. The vault's automatic copy is handled by a separate encrypted-copy job. The founder has decided: vault items are included in the automatic copy, encrypted with `age` to three recipients (Eva, Adam, and the founder's recovery key). That is a separate job from this one.

---

## §3 — How to tell whether last night's run happened

1. Go to the GitHub repository → **Actions** tab → **nightly-archive** workflow.
2. The most recent run should be within the last 24 hours and should show a green checkmark.
3. A red X means the run failed — see §5 below.
4. No run in the last 24 hours means the workflow was not triggered — see §6 (load-bearing dependency).

**From the R2 side:**
Log into Eva's Cloudflare account → R2 → the archive bucket. The most recently modified objects should have a `Last-Modified` timestamp from the last 24 hours. If the most recent objects are older than 36 hours, the job did not run or the upload failed.

---

## §4 — How to run the job by hand from a laptop

You need:
- The repository checked out
- `apps/web` dependencies installed (`npm ci` inside `apps/web/`)
- `tools` dependencies installed (`npm ci` inside `tools/`)
- The following environment variables set (values from 1Password / wherever Adam stores them — never paste them into a terminal command that gets logged to shell history):

```
SUPABASE_URL                  Supabase project URL
SUPABASE_SERVICE_KEY          Supabase service role key
R2_EVA_ACCOUNT_ID             Cloudflare account ID (Eva's account)
R2_EVA_BUCKET_NAME            R2 bucket name (Eva's account)
R2_EVA_ACCESS_KEY_ID          R2 S3-compatible access key ID
R2_EVA_SECRET_ACCESS_KEY      R2 S3-compatible secret access key
```

**Step 1 — Export and verify (run from apps/web/):**

```bash
cd apps/web
node --experimental-strip-types \
  ../../tools/export/index.ts --verify
```

This writes `apps/web/eva-and-adam-archive/` and exits 0 on success, 1 on any checksum mismatch. Do not proceed to step 2 if this exits 1.

**Step 2 — Upload (run from repo root):**

```bash
node --experimental-strip-types \
  tools/export/upload.ts apps/web/eva-and-adam-archive
```

This uploads all files to Eva's R2 bucket and verifies the storage class. Exits 0 on success.

**To trigger the GitHub Actions run manually** (without running locally):
Go to the GitHub repository → Actions → nightly-archive → Run workflow (top-right button).

---

## §5 — What to do when the run failed

**Red X on the Actions run:**

1. Click the run → expand the failed step → read the error.
2. Common causes and fixes:

| Symptom | Likely cause | Fix |
|---|---|---|
| `Required credential 'R2_EVA_*' is not set` | A secret is missing or expired | Add / rotate the secret in GitHub → Settings → Secrets → Actions |
| `SUPABASE_URL is not set` | Supabase secret missing | Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to GitHub secrets |
| `VERIFY FAIL: N mismatches` | Supabase storage issue; bytes read back corrupt | Re-run manually; if it recurs, check Supabase storage health |
| `STORAGE CLASS ASSERTION FAILED` | Bucket misconfigured to IA | Change bucket to Standard in Eva's Cloudflare R2 settings |
| `UPLOAD FAILED: N files could not be uploaded` | R2 rate limit or network issue | Re-run manually; if persistent, check R2 status and credentials |
| `npm ci` fails | Lockfile out of sync | Run `npm ci` locally, commit the updated lockfile |

**If the Supabase project has already paused:**
Log into the Supabase dashboard → find the project → click "Restore". The project will resume in a few minutes. Once live, run the workflow manually to catch up the archive.

---

## §6 — Load-bearing dependency: this repository must stay private

**GitHub auto-disables scheduled workflows in public repositories after 60 days of no repository activity.**

"Repository activity" means pushes, pull requests, and similar events. A scheduled workflow run does not count as activity. This means:

- Making this repository public for any reason arms a 60-day timer against **both the archive copy and the keep-alive at once**.
- If the timer fires, the workflow is disabled silently. GitHub does not send a notification.
- After 60 days of silence in a now-public repo, the backup stops and the Supabase project will pause after the next idle week.

**This applies to public repositories only.** As long as the repo is private, GitHub's auto-disable rule does not apply and scheduled runs continue indefinitely.

If there is ever a reason to make this repo public — open-sourcing part of the infrastructure, for instance — the nightly-archive workflow must be migrated to a separate private repo or replaced with an external trigger before the visibility change. Record that decision in `.claude/memory/DECISIONS.md`.

Ref: ARCH §5.8a — "the repository stays private is now a load-bearing operational dependency."

---

## §7 — Secrets required

These must be set in GitHub → Settings → Secrets and variables → Actions → Repository secrets.

| Secret name | What it holds |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (read-only to the export CLI; the key itself is service-role-level) |
| `R2_EVA_ACCOUNT_ID` | Eva's Cloudflare account ID |
| `R2_EVA_BUCKET_NAME` | Name of the R2 bucket in Eva's account |
| `R2_EVA_ACCESS_KEY_ID` | R2 S3-compatible API token access key ID |
| `R2_EVA_SECRET_ACCESS_KEY` | R2 S3-compatible API token secret key |

Never put credential values in this file, in the workflow file, or in any commit. Assume every log line is public. The workflow deliberately avoids echoing any secret value; verify this before adding any new `run:` step.

**Scope of Eva's R2 token:** The API token should be scoped to the archive bucket with `Object:Edit` permission. It does not need account-level access. Narrow scope limits the blast radius if the token leaks.

---
