# Getting Started — Startup Kit

A complete starter kit for building startups with an AI-native agent team. Get from idea to running product faster than any other setup.

---

## What Is This Kit

This kit gives you three things out of the box:

1. **A 3-layer AI agent team** (CEO → 9 Team Leads → Workers) that handles everything from code to research to deployment — you talk to the CEO in plain language, it routes work to the right specialists.
2. **38 pre-built documentation templates** in `/docs/` — PRD, roadmap, competitive research, unit economics, architecture, and more — structured to keep your team aligned as you scale.
3. **426+ expert skills** that agents load on demand — from Next.js patterns to pricing strategy to security audits.

---

## Quick Start

### 1. Clone the Kit

```bash
git clone <your-repo-url>
cd <repo-name>
```

### 2. Open in Your AI Tool

| Tool | How to Open |
|------|-------------|
| **Claude Code** | Open the folder; `CLAUDE.md` loads automatically |
| **Antigravity** | Open the folder as workspace; skills load from `.agent/skills/` |

### 3. Start Building

In the chat, type:

```
CEO, I want to build [your idea]
```

The CEO agent reads your project context, asks clarifying questions, and routes work to the right team.

### 4. Fill in Your Context

Before your first sprint, update these three files:
- **`CLAUDE.md`** — set Current Focus, Active Sprint, and any stack overrides
- **`docs/01-foundation/VISION.md`** — your mission, problem, and 3-year vision
- **`docs/PRD.md`** — Overview and Problem Statement (the rest follows from this)

---

## Slash Commands

These commands route directly to the right agent team — no need to explain what you need:

| Command | What it does |
|---------|--------------|
| `/build [feature]` | Build a new feature end-to-end |
| `/fix [issue]` | Debug and fix a problem |
| `/design [screen]` | Design a UI screen or component |
| `/review` | Code review + security check |
| `/daily` | Morning planning — today's focus |
| `/plan [goal]` | Sprint or feature planning |
| `/ship [feature]` | Pre-deploy: review → test → deploy |
| `/audit [focus]` | Codebase health report |
| `/research [topic]` | Deep research on a topic |

---

## The 3-Layer Agent Team

Always start with CEO. It assembles the right team for each task — never address workers directly.

| Layer | Agents | When It's Used |
|-------|--------|---------------|
| **Layer 1 — CEO** | CEO | Entry point for ALL tasks. Understands context, routes work, synthesizes results. |
| **Layer 2 — Team Leads** | Build Lead, Research Lead, Design Lead, QA Lead, DevOps Lead, Data Lead, Product Lead, Growth Lead, Business Lead | Each owns a domain. CEO delegates to them. They plan and manage their workers. |
| **Layer 3 — Workers** | Backend Developer, Frontend Developer, Database Engineer, AI Engineer, Security Engineer, Test Engineer, Code Reviewer, Researcher, Technical Writer | Specialists who do the actual work. Only take direction from their lead. |

> See `AGENTS.md` for the full routing table and agent capabilities.

---

## Your First 30 Minutes

Work through this checklist before your first sprint:

1. **Set project context** — open `CLAUDE.md` and fill in: Current focus, Active sprint, and any stack changes (e.g., swap Stripe for Paddle).
2. **Define your vision** — open `docs/01-foundation/VISION.md` and fill in the mission statement and 3-year vision.
3. **Write your PRD** — open `docs/PRD.md` and fill in Overview + Problem Statement. The rest will emerge through sprints.
4. **Plan your first sprint** — type `CEO, plan our first sprint based on the PRD`. The CEO will read your context and generate a sprint plan.
5. **Check the output** — review `docs/04-features/ROADMAP.md` after planning to see what the team has lined up.

---

## Next Steps

- **`AGENTS.md`** — full agent roster, capabilities, and routing table
- **`guides/QUICK_REFERENCE.md`** — cheat sheet for daily use
- **`guides/GLOBAL_SETUP.md`** — install agents globally so they work in every project on your machine
- **`docs/`** — all documentation templates, organized by category
