---
date: 2026-08-06
role: qa-lead
task: dates-cardcopy
qa_verdict: PASS
tier: lite
---

# QA gate: feat/dates-cardcopy

PASS, 0 P0/P1, all findings P3. Real diff (true merge-base `860d2c7`, not stale `origin/main`) is exactly `suggestions.ts` +474/−1: 33 entries, all 9 windows covered (w2/w5/w6/w7 were the empty ones, not w9), caps/law checks independently verified clean, `tsc`/`eslint` clean, merge-tree conflict-free. Cross-checked by code-reviewer and qa-engineer, both PASS.

P3s: `TonightCard.tsx` (dead code, 0 imports, scheduled for deletion) has no `intimacyLevel` filter — recorded as a forward constraint for any future unprompted surface; pre-existing `today` (relative time) at `suggestions.ts:90`; `costConditional`/`costNote` inert in both current consumers, and `costTier:"paid"` gets no UI indicator at all (pre-existing component gap). An uncommitted 11-case regression test in the worktree has a wrong window claim (w9, not w7) — noted for whoever commits it separately, not part of this diff.

Not assessed: rendered appearance at any viewport/mode (no browser); whether the copy reads well (founder's call only).

Full findings: `.claude/memory/DECISIONS.md` (2026-08-06 entry).
