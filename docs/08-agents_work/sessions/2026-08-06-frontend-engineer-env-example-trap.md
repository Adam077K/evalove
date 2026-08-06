---
agent: frontend-engineer
task: env-example-trap (measure, correct the contract, restore the founder's file)
branch: fix/env-example
qa_verdict: PENDING
tier: lite
---

- Measured all four quoting forms through BOTH parsers (fresh process each; Turbopack via real boots): `\$`-escaped is the ONLY form @next/env delivers intact and the only form that boots `next dev`. Raw, single- and double-quoted all arrive mangled — expansion applies inside quotes in this stack.
- So the existing `\$` advice in `.env.example` and four handoffs was CORRECT; nothing to correct there. Two prior diagnoses were wrong: mine from Wave 2 ("Turbopack does not unescape; single-quote the values" — the Wave 2 session file on feat/the-book carries this and that branch is frozen at QA; this file is the correction) and the single-quote repair applied to the-book's `.env.local` (its own server was serving the malformed-hash 500 when probed).
- The REAL trap, measured: process env + `.env.local` both defining the hashes fails lib/env.ts even when each source alone boots. This is why the founder's correct file "broke" under agent-booted servers (they inject fixture env), and it is how the Playwright webServer dies whenever a developer `.env.local` exists.
- `.env.example` now documents three traps: keep `\$` (quoting re-arms the trap), never dual-source the variables, and the Supabase-must-answer rule.
- Verified by booting, not reading: throwaway `.env.local` written to the file's own literal instructions → `next dev` starts, lib/env.ts passes, /login 200; throwaway deleted, nothing committed.
- Restored the founder's original backslash-escaped `.env.local` in the-book worktree from the `.bak` (untracked file; branch untouched). Note: a stale `next dev` (PID 88098, :3000) still holds the-book's dev lock and serves the old error.
