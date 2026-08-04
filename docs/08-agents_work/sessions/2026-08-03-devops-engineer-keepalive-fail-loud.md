---
date: 2026-08-03
role: devops-engineer
session: devops-keepalive-fail-loud
color: red
tier: irreversible
parent_ticket: keepalive-fail-loud
branch: feat/archive-export-mirror
head_sha: b436571e59132bf2935f44541e5b113599bc9d1a
qa_verdict: delta on prior PASS (sha 837efd3)
---

## Summary

Delta fix on top of the irreversible-tier QA-Lead PASS at 837efd3. The
CEO caught a fail-open defect in the "Independent Supabase keep-alive" step
that was added in that same PASS. This session closes it with one targeted
commit plus a DECISIONS.md record.

## The change

File: `.github/workflows/nightly-archive.yml`

**What changed:** One exit code in the missing-secret branch of the
independent keep-alive step.

Before:
```bash
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set — keep-alive skipped"
  exit 0
fi
```

After:
```bash
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set — keep-alive cannot fire; ..."
  exit 1
fi
```

Also added a new comment paragraph above the step explaining the rationale.

## Why (fail-open per DECISIONS.md)

A step that exits 0 when it did nothing is fail-open. Under
`continue-on-error: true`, the Actions UI renders a green check — "all
clear" — when in reality the keep-alive did not fire and the 7-day
Supabase pause timer was NOT reset. DECISIONS.md explicitly bans this
pattern: "A check whose absence means 'all clear' is fail-open — require a
positive artifact." Exiting 1 renders amber (failed-but-tolerated) in the
Actions UI, which is the correct signal: the archive still ran, but the
founder can see that the secret is missing.

This is the sixth occurrence of the fail-open class recorded today.

## Constraints preserved (six)

1. `if: always()` — unchanged; the step runs regardless of export/upload
   outcome.
2. `continue-on-error: true` — unchanged; the archive's exit code is never
   masked by the keep-alive. The job's own failure-or-success reflects only
   the export/upload steps.
3. No service-role key — unchanged; the step uses `SUPABASE_ANON_KEY` only.
   The service-role key bypasses RLS and is not needed for this purpose.
4. Cannot mask export failure — unchanged; only the export step has no
   `continue-on-error`, so its exit code governs the job.
5. Bounded log output — unchanged; the curl uses `--max-time 30` and `-o
   /dev/null`; no unbounded data hits the log.
6. No credential literals — verified; `grep -RiE "eyJ...|service.role.*key"
   .github/workflows/` returned nothing.

## Consistency with the 5xx path

The 5xx/timeout branch at the bottom of the same step already exits 1:
```bash
echo "WARNING: keep-alive: HTTP $HTTP_CODE — 5xx or timeout. ..."
exit 1
```
After this fix, BOTH abnormal branches exit 1. There is no longer a
split-personality step where one failure mode renders green and the other
renders amber.

## Commits (3 on top of 837efd3)

1. `68269ae` — fix(devops): fail-loud when keep-alive secrets are missing
2. `b436571` — docs(decisions): record fail-loud fix on keep-alive missing-secret branch
3. (this session file commit)
