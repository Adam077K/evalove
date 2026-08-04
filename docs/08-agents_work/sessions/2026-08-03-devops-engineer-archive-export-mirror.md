---
date: 2026-08-03
agent: devops-engineer
session: devops-engineer-archive-export-mirror
branch: feat/archive-export-mirror
base_branch: feat/archive-export-engine
worktree: .worktrees/archive-export-mirror
risk_tier: irreversible
qa_verdict: PENDING — merge requires QA-Lead PASS and founder sign-off
linear_ticket: B2
---

# Session: archive-export-mirror

## What was built

B2 from the archive survival packet: the nightly GitHub Actions job that
exports the archive and uploads it to Eva's Cloudflare R2 bucket.

This repo had no `.github/` directory before this session. This creates the
first one.

## Files created or changed

```
.github/workflows/nightly-archive.yml     NEW — the nightly job (first .github/ file in this repo)
tools/export/upload.ts                    NEW — S3-compatible upload to Eva's R2
tools/package.json                        NEW — @aws-sdk/client-s3 here only, never in apps/web
tools/package-lock.json                   NEW — lockfile for tools/
tools/tsconfig.json                       MODIFIED — added tools/node_modules to typeRoots
docs/03-system-design/RUNBOOK-nightly-archive.md   NEW — runbook
.gitignore                                MODIFIED — tools/node_modules/ and eva-and-adam-archive/
```

B1's CLI (`tools/export/index.ts` and all other files under `tools/export/`)
was not modified. `apps/web/` was not touched.

## The 9 success criteria — status

1. **Whose account.** upload.ts calls `requireCredential()` on all four
   R2_EVA_* env vars before doing anything. Exit 1 with a clear message if any
   are absent. No fallback. A copy in Adam's account is explicitly named as
   "the status quo wearing a backup's clothes" in the script header.

2. **Runs nightly with --verify. Fails on exit 1.** The workflow runs the
   export CLI with `--verify`. The CLI exits 1 on any checksum mismatch;
   GitHub Actions propagates exit codes, so the step fails and the upload
   step does not run.

3. **Storage class assertion.** After all files are uploaded, upload.ts calls
   `HeadObjectCommand` on the first uploaded object and checks `StorageClass`.
   Any value other than `"STANDARD"` or `undefined` (R2's default) triggers
   an explicit `process.exit(1)` with a named error.

4. **Not a mirror.** The workflow header states this in plain English,
   explains why (Eva's copy is not reachable by Adam's operations), and
   cites the founder's ruling (nothing is ever permanently deleted). The
   deliberate contradiction of ARCH §5.7 is named.

5. **Keep-alive.** The export step queries the Supabase database via
   fetchMembers/fetchPhotos/fetchBookEntries/fetchDates/fetchDateTurns —
   even with zero photos, all five queries execute. The workflow header
   states this explicitly: "One job, both purposes. They cannot drift apart."

6. **Header states the consequence.** The workflow opens with a DO NOT DELETE
   block naming both consequences: Eva's copy stops AND the app goes offline
   after seven idle days. Written so it is impossible to mistake for cruft.

7. **Load-bearing dependency recorded.** Both the workflow header and
   RUNBOOK §6 state that this repo must stay private, explain why (GitHub's
   60-day auto-disable on public repos), and describe what to do before
   any visibility change.

8. **Secrets via GitHub Actions secrets only.** No credential value appears
   in the workflow file, upload.ts, or the runbook. upload.ts does not
   log access key IDs. The runbook instructs using 1Password/secure storage,
   never pasting into terminal history.

9. **Runbook complete.** RUNBOOK-nightly-archive.md covers: what the job
   does (§1), what this copy is and is not (§2), how to tell last night's
   run happened (§3), how to run by hand from a laptop (§4), what to do when
   it fails (§5 — error table with five common failure modes), the private-repo
   dependency (§6), secrets reference (§7), and the vault seam for future
   addition (§8).

## Decisions made

- `@aws-sdk/client-s3` installed under `tools/package.json`, not `apps/web`.
  Separate `npm ci --prefix tools` step in the workflow. NODE_PATH split
  accordingly.
- Export output directory defaults to `apps/web/eva-and-adam-archive/`
  (B1's default). Upload.ts takes this path as its argument from the workflow.
- Upload.ts uses `StorageClass: "STANDARD"` explicitly in PutObjectCommand
  (belt) and HeadObjectCommand verification after upload (suspenders).
- Cron at 02:00 UTC — after most of New York's and Jerusalem's day has ended.
- `workflow_dispatch` also enabled for manual first-run and credential rotation
  verification.
- tools/tsconfig.json updated to include tools/node_modules in typeRoots so
  @aws-sdk/client-s3 types resolve for local typechecking.

## What was not done (by design)

- Vault is excluded. `--include-vault` is not passed. A vault seam is marked
  in both the workflow and the runbook.
- Cloudflare liveness Worker (ARCH §5.8b) is out of scope per the brief:
  "a monitor built in the same hour as the thing it monitors gets tested
  against the same assumptions."
- No production deployment. This branch is `feat/archive-export-mirror`,
  based on `feat/archive-export-engine`. Merge requires QA-Lead PASS and
  founder sign-off (risk tier: irreversible).

## Merge gate

Risk tier: **irreversible**.
- This repo's first `.github/workflows/` file.
- Holds a write credential to a third-party account (Eva's R2).
- Once it has run, it creates copies in storage the system cannot recall.

Required before merge:
1. QA-Lead PASS
2. Founder sign-off (explicit "yes" from Adam)
