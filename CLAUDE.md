# Evalove — Project Context
*Auto-loaded by Claude Code on every session.*

> This is a TEMPLATE adapted from the Beamix agent system (2026-05-16 rethink baseline). Replace every `{{PLACEHOLDER}}` and the "Project State" section before first use. See [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md).

---

## The Team

This project runs as an autonomous C-suite company. **Every task starts at the CEO.**

```
Layer 1 — Entry
  CEO  (Founder-driven or ticket-triggered; orchestrates only, never implements)

Layer 2 — C-suite
  CTO   · CPO   · CMO   · CBO   · QA-Lead   · Research-Lead
  Design-Lead reports under CPO.

Layer 3 — Workers (13)
  backend-engineer · frontend-engineer · database-engineer · ai-engineer
  devops-engineer  · data-engineer     · security-engineer · test-engineer
  code-reviewer    · researcher        · technical-writer
  product-designer · design-critic
```

**Slash commands:** `/build` `/fix` `/design` `/review` `/daily` `/plan` `/ship` `/audit` `/research`
**Identity:** `/color [name]` · `/name [session-slug]` — set at the start of every session.

See [AGENTS.md](AGENTS.md) for the full routing table and [.claude/agents/](.claude/agents/) for canonical agent definitions.

---

## Skills Library

**147 curated skills** at `.claude/skills/[skill-name]/SKILL.md`.

**Discovery — read MANIFEST.json, never `ls | grep`:**

```
Step 1: Read .claude/skills/MANIFEST.json — filter `skills` array by `tags` matching task domain
Step 2: Load 3-5 matching SKILL.md files (CEO, C-suite, leads)
        Load 2-3 matching SKILL.md files (workers)
```

Skills load **on demand only** — never preload.

---

## Stack

> Replace this block with your actual stack. The defaults below were inherited from the source project and are reasonable starting points; agents reference them when generating code.

```
Frontend:   Next.js 16 (App Router), React 19, TypeScript strict, Tailwind, Shadcn/UI
Backend:    Next.js API Routes / Server Actions, Zod validation on all inputs
Database:   Supabase (auth, DB, RLS)
Payments:   Stripe        # e.g., Paddle / Stripe / LemonSqueezy
Email:      Resend          # e.g., Resend / Postmark / SendGrid
Jobs:       Inngest           # e.g., Inngest / Trigger.dev / Temporal
Hosting:    Vercel
AI:         OpenAI, Claude, Gemini (direct API integration)
Memory:     Mem0 (primary) + Anthropic Memory Tool (auto-fallback after 3 retries)
```

---

## Memory

| File | Purpose | Updated by |
|------|---------|-----------|
| `.claude/memory/DECISIONS.md` | Architecture & strategy decisions, append-only, 50-entry cap | Any agent making a decision affecting others |
| `.claude/memory/CODEBASE-MAP.md` | Key files, patterns, tech debt | code-reviewer |
| `.claude/memory/USER-INSIGHTS.md` | Customer language, pain phrases, JTBD | CMO + CPO (only authorized writers) |
| `.claude/memory/LONG-TERM.md` | Cross-session facts: user prefs, recurring patterns | CEO after each session |
| `.claude/memory/sessions/` | Lead session summaries (`YYYY-MM-DD-[lead]-[task].md`) | Each C-suite / Lead |

**Hard caps:** DECISIONS.md ≤ 50 entries (archive when full); LONG-TERM.md ≤ 100 lines; session summaries ≤ 10 lines each.

---

## Models (May 2026)

| Tier | Model | Use for |
|------|-------|---------|
| Opus 4.7 | `claude-opus-4-7` | CEO + research synthesis + design + orchestration heavy |
| Sonnet 4.6 | `claude-sonnet-4-6` | **Default** — C-suite, leads, most workers |
| Haiku 4.5 | `claude-haiku-4-5` | Simple/lookup — test runs, lint, log parsing, classification |

CEO specifies the model in every brief. Workers default to Sonnet if unspecified.

---

## Risk-Tiered QA Gate (4-tier)

Every PR is risk-tiered. **No merge without QA-Lead PASS.** The CEO and CTO cannot override.

| Tier | Trigger | Review pipeline | Required label |
|------|---------|-----------------|----------------|
| **Trivial** | Typo, single-line, comment-only | Haiku schema-lint hook only (auto-pass) | none |
| **Lite** | Isolated feature, < 300 LOC, no API/DB/auth | code-reviewer + qa-engineer + semgrep | `risk:lite` |
| **Full** | API/DB/auth/billing touched, ≥ 300 LOC | Lite + security-engineer + craft-reviewer + Codex CLI second opinion | `risk:full` |
| **Irreversible** | DB migration, workflow file, agent definition, billing flow | Full + 2-of-3 multi-judge + Founder sign-off | `risk:irreversible` |

Auto-classification: see [.claude/qa-tier-floor.yml](.claude/qa-tier-floor.yml). Enforced by [.github/workflows/qa-lead-pass.yml](.github/workflows/qa-lead-pass.yml) (not installed by default — copy from `.archive/pre-beamix-bundle-2026-05-25/` or the upstream bundle when you wire CI).

---

## Context Budget — Hard Limits

- `DECISIONS.md`: ≤ 50 entries (archive when full)
- `LONG-TERM.md`: ≤ 100 lines (compress quarterly)
- Session summaries: ≤ 10 lines each
- Agent handoffs: ≤ 500 tokens (summarize, never forward raw conversation)
- Skills per task: **3-5 for CEO/C-suite/leads · 2-3 for workers** — never preload
- Pre-flight reads: cache as **one block** (avoid mid-session re-reads — they break 90% of prompt-cache savings)

---

## Cost Optimization

- `/clear` between unrelated tasks — saves 40-70%
- Sonnet 4.6 is the default — escalate to Opus only for synthesis, design, orchestration
- Haiku 4.5 for trivial subagent tasks
- Subagents run in isolated contexts — return summaries, not raw data dumps
- Use memory files (`.claude/memory/*.md`) for shared state, not handoff payloads

---

## Layer Contract — Hard Rules

### CEO
| DO | DO NOT |
|----|--------|
| Plan, ask, delegate, synthesize | Write source code |
| Structured briefs with all required fields | Vague "build the thing" |
| Validate C-suite returns (workers_spawned, qa_verdict, session_file) | Accept returns missing required fields |
| Set `/color` + `/name` at session start | Run unnamed/uncolored |

### C-suite + Leads
| DO | DO NOT |
|----|--------|
| Explore, plan, brief workers | Edit `.ts`, `.tsx`, `.sql` directly |
| Spawn the right worker for each task | Do a worker's job to "save turns" |
| Verify branches via `git branch --list` | Trust worker summaries blindly |
| Spawn QA-Lead before merge | Merge anything without QA-Lead PASS |
| Write session file at task close | Complete a task with no session file |

### Workers (Layer 3)
| DO | DO NOT |
|----|--------|
| One focused task per worktree | Touch files outside scope |
| Return structured JSON (branch, worktree, files_changed) | Return vague "done" |
| Auto-fix type errors, missing imports (Deviation Rules 1-3) | Make architectural decisions — return BLOCKED instead |
| Atomic commits per logical change | Commit to `main` or a lead's branch |

---

## Rules (All Agents)

1. **Read before acting.** Glob/Grep before creating; check memory before deciding.
2. **Own your domain.** Don't do another agent's work.
3. **Source claims.** Researchers source; no agent invents data.
4. **Leave breadcrumbs.** Append to DECISIONS.md when choices affect others.
5. **Iterate, don't overwrite.** Understand existing code before replacing.
6. **No placeholder UI.** Zero tolerance for stubs / TODOs in deliverables.
7. **Worktrees for code.** Every code worker creates a worktree.
8. **QA gate is sacred.** No merge without QA-Lead PASS + user confirmation.

---

## Git Worktree Protocol

```bash
# Detect — you may already be inside a worktree
git worktree list
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

# Create child worktree FROM the main repo root
git -C "$MAIN_REPO" worktree add "$MAIN_REPO/.worktrees/[slug]" -b feat/[slug]
cd "$MAIN_REPO/.worktrees/[slug]"

# Atomic commits
git commit -m "feat(scope): description"
```

**Never** run `git worktree add` from inside a worktree without `-C $MAIN_REPO`. `.worktrees/` is gitignored.

---

## Agent Identity — Colors & Session Naming

### Color
| Role | Color |
|------|-------|
| CEO (primary) | `gold` |
| CEO (parallel #2/3/4) | `orange` / `teal` / `lime` |
| CTO | `blue` · CPO `green` · CMO `yellow` · CBO `emerald` · QA-Lead `red` · Research-Lead `purple` · Design-Lead `pink` |
| backend-engineer | `blue` · frontend-engineer `pink` · database-engineer `teal` · ai-engineer `purple` |
| security-engineer | `red` · test-engineer `yellow` · code-reviewer `gray` · researcher `purple` · technical-writer `gray` |

### Naming
```
CEO:    /name ceo-[task-slug]       e.g., /name ceo-onboarding-flow
C-suite: /name [role]-[task-slug]   e.g., /name cto-scan-engine
Workers: /name [role]-[task-slug]   e.g., /name backend-engineer-rate-limit
```

### Documentation Gate
No task is COMPLETE without a session file at:
```
docs/08-agents_work/sessions/YYYY-MM-DD-[role]-[task-slug].md
```
With frontmatter including `qa_verdict: PASS` and (when applicable) `tier: full|irreversible`.

---

## Project State

*Updated 2026-08-08. `main` at `3863b79`, pushed and in sync.*

- **Current focus:** **Visual rebuild.** The founder's words: *"the app looks like shit, ai slop."* Three replacement directions were built and all three rejected — *"all very bad."* **Active brief: [`docs/08-agents_work/handoffs/2026-08-08-PROMPT-NEXT-TEAM.md`](docs/08-agents_work/handoffs/2026-08-08-PROMPT-NEXT-TEAM.md)** — read it before anything else.
- **Stage:** Stage 1 UI, plus the photo path (the founder authorised breaking "UI only" so screens get judged against real photographs instead of placeholders).
- **Merged and live:** Today · The Book (opens on tap, pages turn inside, three ways out, none the back button) · the photo path with server-verified EXIF/GPS stripping · the dock as a physical tray · and as of `3863b79`, **deco quarantined to Dates** — the Seam leaves the shared shell, the Band moves onto paper, returning Band (56px) + Seam (190px) = **246px, 29% of an 852px screen**, to the photographs on every route.
- **The gate that has not been passed:** **nobody has seen the real Today or Dates.** Every render came from `/review/today-pair`. The merge landed on QA-Lead's PASS and five reviewers, at the founder's explicit instruction, *before* anyone looked at the screens. First move next session is `pnpm dev` and his phone, not more building.
- **Blockers:** None technical. Decisions sitting with the founder — **Echo** (streaming endpoint works, UI returns a canned apology) · **the Pocket** (removal decided, unbuilt; `PocketGate` declines everything by design) · the hairline under the Band · the 190px `/book`, `/send` and `/pocket` silently lost.
- **The finding that reframes the stage:** the 54KB design law and 44KB style bible cite the founder's 26 reference images **by filename**, and **no agent opened one until 8 August.** The folder dismissed as "asset packs" holds **three shipped products for private two-person memory books** — Evalove's exact product. The law mined their decoration and discarded their product. **Not one reference behind the shipped design is a phone app.** That is why A, B and C were each rejected.
- **Next milestone:** the founder's one-sentence verdict on the rebuilt Today and Dates, then repair in priority order. **Mobile-first at 393×852 is the only viewport that counts.** Two users, both on phones, no desktop story.
- **The lesson governing this stage:** seven QA-Lead PASS verdicts were issued on this code and the app is still bad to use. Every review checked whether the code was *correct*; nobody checked whether the thing *worked*. **Use the app before you read it.** Its sharper form, learned 8 August: *the adversary goes looking for failure modes; the code-reviewer goes looking for reasons it is fine* — and **every structural assertion must be able to fail.**
- **Eva has still never been asked a single question.** Every claim about her half of this product is the founder's account, not a finding. Top of the backlog by more than double, blocked on nothing, questions written 3 August.

---

## Template Provenance

Adopted from the Beamix agent system snapshot dated **2026-05-25**.
Pre-template variant archived at [.archive/pre-beamix-bundle-2026-05-25/](.archive/pre-beamix-bundle-2026-05-25/).
See [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md) for the placeholder list and first-run checklist.
