---
date: 2026-08-10
role: ceo
task: make-it-real
branches:
  - fix/window-strings
  - chore/migration-truth
  - feat/photo-dedup
  - docs/runbook-credentials
  - design/board-port-probe
worktree: /Users/adamks/VibeCoding/Evalove/.worktrees/ceo-3-1785631504
tier: n/a — nothing merged
qa_verdict: NOT REQUESTED — no merge attempted
---

Five branches built, none merged. `main` unmoved at `238441c`. Everything below was
verified by the CEO against disk or by re-running, not taken from an agent's account.

**The defect that appeared three times in one day, in three costumes.** An instrument
that returns nothing when it fails, indistinguishable from one that returns nothing
because there is nothing. (1) `verify_schema.sql` checked
`fargs LIKE '%timestamptz%'`, but `pg_get_function_identity_arguments` renders OID 1184
as `timestamp with time zone` — migration 08 would have read NOT APPLIED forever. (2)
`sips -g orientation` returns `<nil>` whether or not an EXIF tag exists; the CEO read
that silence as absence and reported the photo library backwards. (3) The runbook's
§3.2 hash command reads its secret from **stdin**; run without a pipe it hashed the
empty string and printed a structurally perfect credential that `lib/env.ts` accepts.
**That one was minutes from becoming an empty-password sign-in on an archive with no
reset flow.** The lesson is not "write better tests" — it is *distrust any instrument
that cannot tell you it found nothing*.

**The board's real crop problem is the opposite of what was briefed, in two directions
at once.** As painted the library is **8 landscape / 38 portrait** (16 files carry EXIF
orientation 6). design-H's `.lf .mount img` is a 266x196 **landscape** box, so the mock
crops the 38 portraits; React's `Polaroid.tsx` uses fixed **portrait** aspects
(`795/1024`, `900/1024`) with `object-cover`, so it crops the 8 landscapes. Founder
ruled: **the mount takes the photograph's shape, the handwritten line keeps a floor,
nothing is ever silently clipped.** `BookSheet.tsx:24` claims no `overflow-hidden`
"ever", so the vanishing-sentence failure may be mock-only — unverified.

**A subagent contradicted the CEO's stated "established fact" and was right.** The
orientation correction came from `board-port-3` refusing a brief that called 24/22 the
single biggest risk in the port. Consistent with the standing pattern that every real
finding here comes from two agents disagreeing.

**Founder's library contains a duplicate the app could not detect.** 46 files, 45
unique. `prepare.ts:132` already computed a SHA-256 and stored it; idempotency keyed on
`client_uuid` alone, and `book` photos had no equivalent of `supersedePriorDaily`. Now
refused with `DataError("conflict")`. **No migration needed** —
`checksum_sha256 text not null` exists at migration 03:61. An index was proposed, not
applied.

**Local dev was broken and nobody had noticed.** `.env.local` still held the retired
`APP_PASSWORD_HASH` and neither `APP_PASSWORD_HASH_EVA` nor `_ADAM`; both are
`requiredString`, so boot fails Zod. `RUNBOOK-deploy-vercel.md` documented the retired
variable — following it during deploy would have set a name nothing reads.

**Eight of nine window sentences were wrong against the real clocks.** `w7` pinned a
weekday name to a two-hour band. Replacements are unmerged pending the founder's
ruling on voice; the new validator guards only 4 of the 8, the rest rest on judgment.
The zones disagree 26 days a year (8–26 March, 25–31 October) at a 6h gap, not 7.

**Agents died repeatedly with uncommitted work** — the board port took three attempts,
the leaf two. Fix that worked: brief them to commit within their first few actions, and
salvage/commit orphaned artifacts from dead worktrees before respawning.

**Still true, raised again, unresolved: Eva has never been asked a single question.**
Nine sentences describing her day were rewritten today, for the second time, entirely
from Adam's account. Question 1 of `2026-08-03-EVA-FIVE-QUESTIONS.md` is that exact
taxonomy. That file says its own value decays fast; it is seven days old.

**Open on the founder:** three hashes in a real terminal → `pnpm dev` → open it on an
actual iPhone (never once done) · paste `verify_schema.sql` · rule on the nine
sentences · rotate the Supabase PAT pasted into this session's transcript, alongside
`SESSION_SECRET`.
