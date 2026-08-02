# {{PROJECT_NAME}} Agent System — Project Context
*Auto-loaded by Claude Code on every session.*

> **2026-05-16 rethink applied.** Org chart, QA gate, skills library, and naming were standardized this date. The source of truth is `docs/08-agents_work/2026-05-16-agent-rethink/` (11 planning docs + 13 board review files + 2 session files). The 10 locked decisions live in `.claude/memory/DECISIONS.md` under the "2026-05-16 BOARD VERDICT" entry.

---

## The Team

{{PROJECT_NAME}} runs as an autonomous C-suite company. **Every task starts at the CEO.**

```
Layer 1 — Entry
  CEO  (Adam-driven or Linear-triggered; orchestrates only, never implements)

Layer 2 — C-suite
  CTO   · CPO   · CMO   · CBO   · QA-Lead   · Research-Lead
  Design-Lead reports under CPO. CCO folded into CPO (premature org).

Layer 3 — Workers (13)
  backend-engineer · frontend-engineer · database-engineer · ai-engineer
  devops-engineer  · data-engineer     · security-engineer · test-engineer
  code-reviewer    · researcher        · technical-writer
  product-designer · design-critic
  + supabase-cleaner (specialist, retained as-is)
```

**Slash commands:** `/build` `/fix` `/design` `/review` `/daily` `/plan` `/ship` `/audit` `/research`
**Identity:** `/color [name]` · `/name [session-slug]` — set at the start of every session.

See `AGENTS.md` for the full routing table and `.claude/agents/` for canonical agent definitions.

> **GSD pipeline agents archived 2026-05-16** (codebase-mapper, debugger, executor, integration-checker, nyquist-auditor, phase-researcher, plan-checker, planner, project-researcher, research-synthesizer, roadmapper, verifier). Reference only at `.archive/agents/gsd-pipeline-2026-05-16/`.

---

## Skills Library

**117 curated skills** at `.claude/skills/[skill-name]/SKILL.md` (down from 423 — 308 orphans archived 2026-05-16 to `.archive/skills-orphans-2026-05-16/`).

**Discovery — read MANIFEST.json, never `ls | grep`:**

```
Step 1: Read .claude/skills/MANIFEST.json — filter `skills` array by `tags` matching task domain
Step 2: Load 3-5 matching SKILL.md files (CEO, C-suite, leads)
        Load 2-3 matching SKILL.md files (workers)
```

Skills load **on demand only** — never preload.

Skill categories (post-cleanup highlights):
- **AI/ML:** ai-engineer, rag-engineer, prompt-engineering-patterns, multi-agent-patterns, agent-memory-systems
- **Frontend:** nextjs-app-router-patterns, react-patterns, tailwind-design-system, radix-ui-design-system, frontend-design
- **Backend:** nodejs-backend-patterns, prisma-expert, postgresql, api-design-principles, error-handling-patterns
- **DevOps:** vercel-deployment, inngest, github-actions-templates, cloud-devops
- **Business:** startup-financial-modeling, pricing-strategy, market-sizing-analysis, competitive-landscape
- **Growth/SEO:** copywriting, marketing-psychology, email-systems, page-cro, seo-content-writer
- **Security:** security-audit, web-security-testing, xss-html-injection, broken-authentication, wcag-audit-patterns

---

## Stack

```
Marketing:  Framer (separate project — NOT in this repo)
Product:    Next.js 16 (App Router), React 19, TypeScript strict, Tailwind, Shadcn/UI
Backend:    Next.js API Routes / Server Actions, Zod validation on all inputs
Database:   Supabase (auth, DB, RLS)
Payments:   Paddle (NOT Stripe)
Email:      Resend
Jobs:       Inngest
Hosting:    Vercel (product only)
AI:         OpenAI, Claude, Gemini, Perplexity (direct API integration)
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
| `.claude/memory/specs/` | Product specs | CPO |

**Hard caps:** DECISIONS.md ≤ 50 entries (archive when full); LONG-TERM.md ≤ 100 lines; session summaries ≤ 10 lines each.

---

## Brain — Knowledge Navigation (docs/00-brain/)

Read the MOC for your domain **before** searching the full docs tree.

**Navigation:** `_INDEX.md` → domain MOC → specific document.

| MOC | Domain | Reader |
|-----|--------|--------|
| `docs/00-brain/_INDEX.md` | Master hub | CEO (every session) |
| `MOC-Product.md` | PRD, roadmap, feature specs | CPO, CEO |
| `MOC-Architecture.md` | System design, DB, APIs | CTO, backend-engineer |
| `MOC-Business.md` | Vision, market, competitive, pricing | CBO, Research-Lead |
| `MOC-Marketing.md` | GTM, messaging, SEO | CMO |
| `MOC-Codebase.md` | Code map, patterns, tech debt | CTO, code-reviewer |
| `MOC-History.md` | Changelog, decisions, audits | CEO, all C-suite |
| `MOC-Metrics.md` | North star, unit economics | CBO, data-engineer |
| `MOC-Agents.md` | Agent definitions, commands | CEO |
| `docs/00-brain/log.md` | Chronological activity record (append-only) | CEO + all C-suite |

After significant work, append one line to `log.md`.

---

## Project Documentation (docs/)

| Path | Purpose | Owner |
|------|---------|-------|
| `docs/00-brain/` | Navigation MOCs + activity log | CEO, all leads |
| `docs/PRD.md` | Master product requirements | CPO |
| `docs/BACKLOG.md` | Prioritized backlog | CPO, CEO |
| `docs/ENGINEERING_PRINCIPLES.md` | Code conventions | CTO |
| `docs/COMPETITIVE_RESEARCH.md` | Competitive intel summary | Research-Lead |
| `docs/01-foundation/` | Vision, business model, personas | CEO, CBO |
| `docs/02-competitive/` | Landscape, positioning, moat | Research-Lead |
| `docs/03-system-design/` | Architecture, schema, API contracts, ADRs | CTO |
| `docs/04-features/` | Roadmap, user stories, specs | CPO |
| `docs/05-marketing/` | GTM, channels | CMO |
| `docs/06-codebase/` | Code map, conventions | code-reviewer |
| `docs/07-history/` | Changelog, pivots, milestones | CEO, all leads |
| `docs/08-agents_work/` | Task index, session logs, handoffs | CEO, all leads |
| `docs/09-metrics/` | North star, unit economics | CBO, data-engineer |
| `docs/product-rethink-2026-04-09/` | **AUTHORITATIVE** — product decisions from April 2026 rethink | CEO, all leads |
| `docs/08-agents_work/2026-05-16-agent-rethink/` | **AUTHORITATIVE** — agent system rethink (org, QA, skills) | CEO, CTO |

---

## MCPs

| MCP | Tools prefix | Used by | Purpose |
|-----|--------------|---------|---------|
| Supabase | `mcp__supabase__*` | database-engineer, backend-engineer, data-engineer | **MANDATORY** for DB work when Supabase is in stack |
| Pencil | `mcp__pencil__*` | design-lead, frontend-engineer | `.pen` design files (check availability; skip gracefully if unavailable) |
| Playwright | `mcp__playwright__*` | test-engineer | E2E + browser automation |
| Context7 | `mcp__context7__*` | researcher | Library docs — try BEFORE WebSearch |
| Framer | `mcp__framer-mcp__*` | frontend-engineer (marketing only), design-lead | **ONLY** for the Framer marketing site, NOT the Next.js app |
| IDE | `mcp__ide__*` | backend-engineer, frontend-engineer | TypeScript diagnostics (`getDiagnostics`) before final commit |
| Stitch | `mcp__stitch__*` | design-lead | AI-generated screen designs (Pencil alternative) |
| Refero | `mcp__refero__*` | design-lead, frontend-engineer | UI reference patterns |

**Availability:** MCPs may not always be connected. On call failure → log "MCP unavailable, falling back to [alt]" → continue. **Exception:** Supabase MCP failure for DB work → flag to user before proceeding.

---

## Models (May 2026 — locked Q3 2026-05-07)

| Tier | Model | Use for |
|------|-------|---------|
| Opus 4.7 | `claude-opus-4-7` | CEO + research synthesis + design + orchestration heavy |
| Sonnet 4.6 | `claude-sonnet-4-6` | **Default** — C-suite, leads, most workers |
| Haiku 4.5 | `claude-haiku-4-5` | Simple/lookup — test-engineer runs, lint, log parsing, classification |

CEO specifies the model in every brief. Workers default to Sonnet if unspecified.

---

## Risk-Tiered QA Gate (4-tier — 2026-05-16)

Every PR is risk-tiered. **No merge without QA-Lead PASS.** The CEO and CTO cannot override.

| Tier | Trigger | Review pipeline | Required label |
|------|---------|-----------------|----------------|
| **Trivial** | Typo, single-line, comment-only | Haiku schema-lint hook only (auto-pass) | none |
| **Lite** | Isolated feature, < 300 LOC, no API/DB/auth | code-reviewer + qa-engineer + semgrep | `risk:lite` |
| **Full** | API/DB/auth/billing touched, ≥ 300 LOC pre-revenue (≥ 100 LOC post-first-paying-customer) | Lite + security-engineer + craft-reviewer + Codex CLI second opinion | `risk:full` |
| **Irreversible** | DB migration, workflow file, agent definition, billing-money-flow | Full + 2-of-3 multi-judge + Adam sign-off | `risk:irreversible` |

Auto-classification: a file-path tier-floor YAML map (`.claude/qa-tier-floor.yml`) sets the minimum tier; the `qa-lead-pass.yml` workflow enforces it. No Haiku LLM classifier — deterministic only.

**Codex graceful degradation:** if `codex review --diff` fails, proceed with Claude-only multi-judge + `audit_log` row `status: codex_unavailable`. Never hard-block on Codex availability.

---

## Context Budget — Hard Limits

- `DECISIONS.md`: ≤ 50 entries (archive when full)
- `LONG-TERM.md`: ≤ 100 lines (compress quarterly)
- Session summaries: ≤ 10 lines each
- Agent handoffs: ≤ 500 tokens (summarize, never forward raw conversation)
- Skills per task: **3-5 for CEO/C-suite/leads · 2-3 for workers** — never preload
- Pre-flight reads: cache as **one block** (avoid mid-session re-reads — they break 90% of prompt-cache savings)

**Turn efficiency:** `maxTurns` is a safety ceiling, not a target. Batch tool calls in parallel when independent. Don't re-read files you have in context. Stop when done — don't pad.

---

## Cost Optimization

- `/clear` between unrelated tasks — saves 40-70%
- Sonnet 4.6 is the default — escalate to Opus only for synthesis, design, orchestration
- Haiku 4.5 for trivial subagent tasks
- Subagents run in isolated contexts — return summaries, not raw data dumps
- Use memory files (`.claude/memory/*.md`) for shared state, not handoff payloads
- Mem0 vendor lock-in accepted 2026-05-16 with 6-month review trigger (2026-11-16) and export-pipeline commitment (Phase 3, post-first-revenue)

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
CEO:    /name ceo-[task-slug]       e.g., /name ceo-rethink-phase1
C-suite: /name [role]-[task-slug]   e.g., /name cto-scan-engine
Workers: /name [role]-[task-slug]   e.g., /name backend-engineer-rate-limit
```

**Parallel CEO rule:** different worktrees → different `/name` AND `/color`.

### Documentation Gate
No task is COMPLETE without a session file at:
```
docs/08-agents_work/sessions/YYYY-MM-DD-[role]-[task-slug].md
```
With frontmatter including `qa_verdict: PASS` and (when applicable) `tier: full|irreversible` — required by `.github/workflows/qa-lead-pass.yml`.

---

## Bash Allowlist

Strict allowlist (declared in `.claude/settings.json.proposed`, pending apply). Always-allowed prefixes:
`git, pnpm, gh, node, mkdir, mv, cp, ls, grep, find, wc, head, tail, cat, awk, sed, diff, which, echo`.

Always-denied: `rm -rf *`, `curl *`, `wget *`, `chmod +x *`, `npm install -g *`, `pip install *`.

---

## Project State

- **Current focus:** Agent rethink Phase 0+1 (2026-05-16, hard 5-day cap → product work begins 2026-05-21 regardless).
- **Active sprint:** Phase 0 hygiene → Phase 1 schema + tier-floor + hook → Day 6 pivot to MVP build (per board decision #9).
- **Pricing:** Discover $79 / Build $189 / Scale $499 (annual: $63 / $151 / $399).
- **Product MVP source of truth:** `docs/product-rethink-2026-04-09/build-prep-2026-05-13/`.
- **Agent system source of truth:** `docs/08-agents_work/2026-05-16-agent-rethink/`.
- **Vindication triggers active until 2026-06-15:** FM-12 fires · 5-day cap violated · Plan #6 proposed before first customer feature · zero customer features by Day 30.



# {{PROJECT_NAME}} — Project Context

**Repository:** https://github.com/Adam077K/{{PROJECT_NAME}}.git

This repo is the **{{PROJECT_NAME}} product (dashboard/app)** only. The marketing website is a separate Framer project.

## Project Overview

{{PROJECT_NAME}} scans SMBs for AI search visibility, diagnoses why they rank (or don't), and uses AI agents to fix it. Competitors show dashboards; {{PROJECT_NAME}} does the work.

## Architecture Split (IMPORTANT)

| Surface | Platform | URL | What it covers |
|---------|----------|-----|---------------|
| **Marketing website** | **Framer** | average-product-525803.framer.app | Homepage, pricing, features, about, blog, contacts |
| **Product (app)** | **Next.js on Vercel** | This repo (`apps/web/`) | Dashboard, scan, onboarding, agents, settings, auth |

**This repo = product only.** All marketing pages (homepage, landing, pricing page, about, features) are built and maintained in Framer — NOT in this codebase.

## Monorepo Layout (2026-04-18)

This repo is a Turborepo + pnpm monorepo.

| Path | Purpose |
|------|---------|
| `apps/web/` | **Next.js 16 product dashboard (deployed to Vercel). Fresh scaffold from 2026-04-18.** |
| `packages/` | Reserved for shared UI / config packages. Empty for now; add as needed. |
| `_archive/saas-platform-2026-04-legacy/` | Old product folder. Reference only. Never modify. |
| `docs/` | Product + architecture specs |
| `.agent/` | Agent system (skills, prompts, manifests) |

Workspace commands run from repo root: `pnpm dev`, `pnpm build`, `pnpm typecheck`. Per-app: `pnpm -F @{{project_name}}/web <script>`.

## Key Paths

| Path | Purpose |
|------|---------|
| `docs/` | PRD, architecture, specs, competitive research |
| `apps/web/` | Next.js product app (dashboard, API routes, agents) |
| `apps/web/supabase/migrations/` | DB migrations (2-phase rethink migration applied on staging first) |
| `docs/_archive/` | Archived old design docs (pre-2026-03-17) |
| `docs/product-rethink-2026-04-09/` | **AUTHORITATIVE** — all decisions from April 2026 rethink |
| `_archive/saas-platform-2026-04-legacy/` | Old product codebase, preserved for reference |

## Default References

- **Repo:** https://github.com/Adam077K/{{PROJECT_NAME}}
- **Framer site:** https://average-product-525803.framer.app
- **Product hosting:** Vercel

## Stack (Product)

- Next.js 16, React 19, TypeScript
- Supabase (auth, DB, RLS)
- Paddle (billing)
- LLMs: OpenAI, Claude, Gemini, Perplexity (direct integration via Next.js API routes)
- Hosting: Vercel

## Pricing (CURRENT — as of April 15, 2026)

| Tier | Monthly | Annual |
|------|---------|--------|
| Discover | $79/mo | $63/mo |
| Build | $189/mo | $151/mo |
| Scale | $499/mo | $399/mo |

Trial model: 14-day money-back guarantee (7-day trial is retired). Free one-time scan remains.

## Brand & Design

- **Marketing site:** Framer (separate, live at average-product-525803.framer.app)
- **Product:** Next.js dashboard in this repo
- **Primary accent:** Blue #3370FF (NOT orange, NOT navy, NOT cyan as UI accent)
- **Fonts:** Inter + InterDisplay (headings), Fraunces (serif accent), Geist Mono (code)
- **Guidelines:** `docs/BRAND_GUIDELINES.md` (v4.0) + `docs/PRODUCT_DESIGN_SYSTEM.md`
- **Old docs:** archived in `docs/_archive/`
- **Framer screenshots:** `docs/08-agents_work/framer-homepage-screenshots/`

## Conventions

- Hebrew + English in planning/docs as needed
- `docs/` is the source of truth for product and architecture
- `docs/product-rethink-2026-04-09/` supersedes older specs for pricing, agents, and UX
