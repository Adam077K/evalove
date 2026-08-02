# Beamix Agent System — Portable Bundle

Snapshot of the Beamix Claude Code agent system, copied **2026-05-25** from `/Users/adamks/VibeCoding/Beamix`.

## Contents

| Path | What it is | Count |
|------|-----------|-------|
| `.claude/agents/` | C-suite + worker agent definitions, including `war-room/` routines & personas | 51 `.md` files |
| `.claude/skills/` | Curated skill library (post 2026-05-16 cleanup) | 147 skills |
| `.claude/hooks/` | Pre/post tool hooks, schema-lint, statusline, context monitor | 7 files |
| `.claude/commands/` | Slash commands (`/build`, `/fix`, `/ship`, `/audit`, `/plan`, `/research`, `/daily`, `/design`, `/review`, `/debug`, `/board-meeting`, `/name`, `/color`) | 13 |
| `.claude/settings.json` + `.proposed` | Permissions, model routing, hook wiring | — |
| `.claude/qa-tier-floor.yml` | File-path → QA risk tier map (Trivial/Lite/Full/Irreversible) | — |
| `.claude/gsa-file-manifest.json` | File manifest used by GSA tooling | — |
| `.claude/package.json` | Hook runtime deps | — |
| `.github/workflows/qa-lead-pass.yml` | CI gate enforcing QA-Lead PASS + tier-floor before merge | — |
| `.github/workflows/promptfoo-eval.yml` | Prompt eval CI | — |
| `AGENTS.md` | Roster + routing table | — |
| `CLAUDE.md` | Project context auto-loaded each session (Beamix-specific — edit for new project) | — |
| `skills-lock.json` | Skill registry lockfile | — |

## Deliberately excluded

- `.claude/worktrees/` — ephemeral git worktrees
- `.claude/settings.local.json` — user-local overrides
- `.claude/memory/` — Beamix-specific decisions, sessions, USER-INSIGHTS (project-bound)
- `.DS_Store` files

## How to adopt in a new project

1. **Move into place** — copy `.claude/` and `.github/workflows/` to the new project root (merge with anything already there).
2. **Rewrite `CLAUDE.md`** — it currently encodes Beamix stack, pricing, repo paths, memory caps. Replace project-state, stack, and brand sections; keep the team/skills/QA gate sections as the operating contract.
3. **Reset memory** — start fresh `.claude/memory/DECISIONS.md`, `LONG-TERM.md`, `USER-INSIGHTS.md`, `CODEBASE-MAP.md`. Do not import Beamix's.
4. **Audit `settings.json`** — review bash allowlist/denylist, MCP grants, and hook paths for the new repo layout.
5. **Audit `qa-tier-floor.yml`** — file-path patterns assume Beamix's `apps/web/`, `supabase/migrations/`, agent-definition paths. Retune for the new repo.
6. **Audit workflows** — `qa-lead-pass.yml` references repo conventions (session-file frontmatter, label vocabulary). Adjust before enabling on CI.
7. **MCP servers** — agents reference Supabase, Pencil, Playwright, Context7, Framer, Stitch, Refero MCPs. Each fails gracefully if unavailable, but install/configure the ones you actually use.
8. **Re-run skill manifest** — if you prune skills, regenerate `.claude/skills/MANIFEST.json` and `skills-lock.json`.

## Provenance

Source repo: https://github.com/Adam077K/Beamix
Source commit (at copy time): see `git log -1` in the Beamix repo.
Agent rethink baseline: `docs/08-agents_work/2026-05-16-agent-rethink/` (in source repo; not copied here).
