---
title: War Room Agent Index
date: 2026-05-12
status: Phase 6B in progress — frontmatter locked, bodies being written
---

# War Room — Agent Index

**22 agents total: 12 Routines + 6 Worker templates + 4 Persona templates.**

Per Q13 (locked 2026-05-12): only the 12 Routines are provisioned in claude.ai. Workers + Personas are **Task subagent templates** invoked in interactive sessions, NOT standalone Routines. They need no `routine_id_env_key` / `routine_token_env_key` and no wrangler secrets.

---

## 12 Routines (provisioned in claude.ai)

| Filename | Role | Model | Schedule / Trigger | Budget |
|---|---|---|---|---|
| `advisor-daily-thinking.md` | Multi-domain Advisor Brief — business, tech, GTM, contrarian synthesis | claude-opus-4-7 | Daily 05:30 (`30 5 * * *`) | $2.00 |
| `morning-digest.md` | Day-ahead briefing — 3-5 bullet Linear comment | claude-sonnet-4-6 | Tue-Fri 05:35 (`35 5 * * 2-5`) — Q7 Mon suppression | $0.30 |
| `competitor-pulse.md` | Competitor diff monitor — silent on no-change days | claude-sonnet-4-6 | Daily 05:40 (`40 5 * * *`) | $0.40 |
| `cto-daily-plan.md` | Daily work proposal (Adam reviews + dispatches interactively) | claude-opus-4-7 | Daily 10:30 (`30 10 * * *`) | $1.50 |
| `content-idea-generator.md` | 3 ranked content ideas with hooks — Linear "Content" tickets | claude-sonnet-4-6 | Daily 10:35 (`35 10 * * *`) | $0.50 |
| `monday-standup.md` | Week-ahead sprint plan — Linear sprint planning ticket | claude-sonnet-4-6 | Monday 10:40 (`40 10 * * 1`) | $0.50 |
| `geo-algorithm-signal.md` | Weekly GEO algorithm trend report from Beamix scan data | claude-opus-4-7 | Sunday 10:30 (`30 10 * * 0`) — Q4 moved from 05:45 | $2.50 |
| `friday-retro.md` | Weekly retro — what shipped, slipped, learned + action items | claude-sonnet-4-6 | Friday 15:30 (`30 15 * * 5`) | $0.75 |
| `eod-sync.md` | Day recap + tomorrow's priorities — Linear ticket | claude-sonnet-4-6 | Daily 20:30 (`30 20 * * *`) | $0.30 |
| `security-watcher.md` | Daily CVE + secret-rotation + audit_log anomaly scan — Q11 NEW | claude-sonnet-4-6 | Daily 20:45 (`45 20 * * *`) | $0.30 |
| `auto-unblock.md` | Self-healing for stuck Routines + workers — 3 cascade max | claude-sonnet-4-6 | event-triggered (`routine.timeout`, `worker.stuck`) | $1.00 |
| `synthesizer.md` | Board meeting synthesis — locked decision JSON + DECISIONS.md update | claude-opus-4-7 | event-triggered (`@board` comment OR `agent:synthesizer` label) | $2.50 |

**Cron exemption:** All 12 Routines are cron-exempt from the 15-fires/24h cap (per ROUTINE-ROSTER §Schedule constraints).

---

## 6 Worker templates (Task subagents — NOT Routines)

Workers run inside interactive CEO sessions or are spawned by `cto-daily-plan`'s "work proposal" (Adam-approved). They have NO `routine_id_env_key` and need NO wrangler secrets. Model: claude-sonnet-4-6.

| Filename | Role | Isolation | Budget cap |
|---|---|---|---|
| `parallel-builder.md` | Feature/fix implementation in worktree, PR creation. Supabase **read-only** (Q9). | worktree | $2.00 |
| `parallel-researcher.md` | Targeted web + library research. Linear read-only grant (D4 R2-A). | none | $0.75 |
| `parallel-critic.md` | PR and ADR review — PASS / CHANGES_REQUESTED verdict | none | $0.75 |
| `parallel-tester.md` | E2E and integration test runner via Playwright | worktree | $1.00 |
| `parallel-deployer.md` | DB migrations + Vercel deploy trigger, no PR merge | worktree | $0.50 |
| `parallel-watcher.md` | Read-only `audit_log` + `claude_progress` anomaly monitor; emits `worker.stuck` Inngest event | none | $0.50 |

---

## 4 Persona templates (Task subagents inside Synthesizer session)

Personas are invoked inside Synthesizer's 4-round board-meeting protocol. They are NOT Routines and have NO trigger labels. Synthesizer dispatches them via the Task tool. Model: claude-opus-4-7.

| Filename | Role | Invoke via |
|---|---|---|
| `persona-visionary.md` | Horizon-3 opportunities, contrarian takes, category-defining moves | `@visionary` in board comment |
| `persona-strategist.md` | Execution plan, metrics, trade-offs, competitive positioning | `@strategist` in board comment |
| `persona-architect.md` | Technical feasibility, system design options, BOM estimates | `@architect` in board comment |
| `persona-aria.md` | Vendor/procurement critic — SLA, security, compliance, TCO | `@aria` in board comment |

Synthesizer dispatches personas in the order defined by its `round_sequence` frontmatter field: visionary → architect → strategist → aria.

---

## Locked decisions from Phase 6B (Q1-Q15, 2026-05-12)

| # | Decision | Locked answer |
|---|---|---|
| Q1 | File location | A — keep at `.claude/agents/war-room/` |
| Q2 | Worker names | A — keep 6 placeholder names (rename later if needed) |
| Q3 | Persona count | A — keep all 4 |
| Q4 | GEO Sunday schedule | YES — moved 05:45 → 10:30 to dodge Opus quota collision |
| Q5 | EOD Sync Mem0 grant | A — GRANT (write episodic chain for Morning Digest read) |
| Q6 | Auto-Unblock GitHub MCP | A — GRANT read-only (read CI failure logs) |
| Q7 | Morning Digest Monday suppression | YES — cron `35 5 * * 2-5` |
| Q8 | Strip stale C-suite labels | A — yes, delete in 6C routing.ts cleanup |
| Q9 | Synthesizer Supabase scope | B — RLS-scoped (decisions table + audit_log row_kind='decision') |
| Q10 | Telegram audit-log | MOOT (Telegram deferred per 6A-bis closeout) |
| Q11 | Add security-watcher | YES — added (this file) |
| Q12 | Add ai-search-rank-tracker | NO — defer (Beamix product itself will track this in future) |
| Q13 | Reclassify personas + workers as NOT Routines | A — locked. 12 Routines + 10 templates (workers + personas). |
| Q14 | `@board` comment handler | A — wire in 6C `infra/cloudflare-bridge/src/index.ts` |
| Q15 | Telegram P0 anomaly carve-outs | A — 3 carve-outs (canary fail, fire-rate spike, audit_log schema corruption) |

---

## 6C provisioning checklist (after 6B body writing complete)

Adam click-throughs required:
- **12 Anthropic Routines** in claude.ai (CEO entry-point already provisioned — 11 more)
- **24 wrangler secrets** (12 × ID + 12 × TOKEN). Per-Routine token split eliminates shared-CEO-token blast radius.
- **Cron schedules** wired in Anthropic Console per the Schedule column above
- **routing.ts cleanup:** strip stale `agent:ceo`, `agent:cto`, `agent:cmo`, `agent:cpo`, `agent:cbo`, `agent:cco`, `agent:qa-lead`, `agent:customer-voice` (Q8); rename `agent:competitor-signal` → `agent:competitor-pulse`; add `agent:advisor`, `agent:cto-daily-plan`, `agent:content-idea`, `agent:security-watcher`
- **`@board` comment handler** in `infra/cloudflare-bridge/src/index.ts` (Q14)
- **`routine.timeout` + `worker.stuck` Inngest event producers** (D1.R4 + D3.F3 gap)
- **Audit-log canary** Inngest cron (D5 CC4 — highest-leverage hardening)
- **Telegram P0 wiring** for the 3 Q15 carve-outs
