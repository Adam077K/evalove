# GSA Startup Kit — Quick Reference

## Start a Session

```
CEO, [what I need]
```

## Agent Routing (3-Layer System)

Always start with CEO. CEO assembles the right team.

| Need | Routed to |
|------|-----------|
| Any task | CEO → appropriate lead |
| Build a feature | CEO → Build Lead → Backend + Frontend Developer |
| Fix a bug | CEO → Build Lead → GSD Debugger |
| Research competitors | CEO → Research Lead → Researcher |
| Design a screen | CEO → Design Lead → Frontend Developer |
| Write copy / SEO | CEO → Growth Lead |
| Pricing / financials | CEO → Business Lead |
| Write a PRD | CEO → Product Lead |
| Deploy to production | CEO → DevOps Lead |
| Security audit | CEO → QA Lead → Security Engineer |
| Write tests | CEO → Build Lead → Test Engineer |
| New project from scratch | CEO → GSD Roadmapper → GSD Planner → Build Lead |

## Slash Commands

| Command | Use |
|---------|-----|
| `/build [feature]` | Build a feature end-to-end |
| `/fix [issue]` | Debug and fix a problem |
| `/design [screen]` | Design a UI screen |
| `/review` | Code review + security check |
| `/daily` | Daily planning |
| `/plan [goal]` | Feature/sprint plan |
| `/ship [feature]` | Pre-deploy pipeline |
| `/audit [focus]` | Codebase audit |
| `/research [topic]` | Deep research |

## Skills

Agents load skills on demand via `.agent/skills/MANIFEST.json`.

- `@brainstorming` — Design before coding
- `@react-patterns` — React component patterns
- `@api-design-principles` — API design
- See [BUNDLES](../.agent/skills/docs/BUNDLES.md) for curated starter packs

## Key Files

| File | Purpose |
|------|---------|
| CLAUDE.md | Project context (auto-loaded by Claude Code) |
| AGENTS.md | Full agent roster and routing table |
| .claude/memory/DECISIONS.md | Architecture decision log |
| .agent/skills/MANIFEST.json | Skills discovery index |
