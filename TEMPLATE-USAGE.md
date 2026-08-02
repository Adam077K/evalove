# TEMPLATE-USAGE.md
*First-run checklist for adopting this kit on a new project.*

This kit ships the **Beamix agent system (2026-05-16 rethink baseline)**, generalized:
every Beamix-specific identifier was replaced by a `{{PLACEHOLDER}}`, project-only
skills were archived, and table/path names that would mislead a fresh project were
neutralized. Before agents will behave correctly on your project, fill in the
placeholders and review a small set of files by hand.

---

## 1 — Fast path (recommended)

Run the interactive init script. It prompts for every placeholder and runs the
substitution across `.claude/`, `.agent/`, and the root template files.

```bash
bash bin/init-from-template.sh
```

For CI / scripted installs, pre-set values in `.template.env`:

```bash
cat > .template.env <<EOF
PROJECT_NAME=Acme
project_name=acme
PROJECT_PREFIX=ACME
TICKET_PREFIX=ACME-
PROJECT_DOMAIN=acme.com
MARKETING_URL=https://acme.com
REPO_URL=https://github.com/yourorg/acme
FOUNDER_NAME=Sarah
FOUNDER_ROLE=Founder/CEO
COMMS_PREFS=Direct, numbers first
PAYMENT_PROVIDER=Stripe
EMAIL_PROVIDER=Resend
JOBS_PROVIDER=Inngest
STAGE=pre-MVP
CURRENT_FOCUS=Building auth + first feature
ACTIVE_SPRINT=Sprint 1 — foundation
BLOCKERS=None
NEXT_MILESTONE=First demo
TARGET_MARKET=SMB
PRIMARY_LANGUAGE=English
LANGUAGES=English
EOF

bash bin/init-from-template.sh --non-interactive
```

---

## 2 — Placeholders (21 distinct tokens, ~128 placement points)

| Placeholder | Meaning | Example |
|-------------|---------|---------|
| `Evalove` | Display name in agent prompts and brand voice | `Acme` |
| `evalove` | lower-case slug used in env vars / urls | `acme` |
| `EVALOVE` | UPPER prefix for env vars (e.g. `ACME_API_KEY`) | `ACME` |
| `EVALOVE-` | Linear / Jira ticket prefix | `ACME-` |
| `evalove.com` | Production domain | `acme.com` |
| `https://evalove.com` | Marketing site URL (often a separate platform) | `https://acme.com` |
| `https://github.com/Adam077K/evalove` | GitHub repo URL | `https://github.com/org/repo` |
| `Founder` | Sign-off authority for `irreversible` tier reviews | `Sarah` |
| `Founder/CEO` | One-line | `Founder/CEO` |
| `Direct, numbers first` | How the founder wants to be addressed by agents | `Direct, no hedging, numbers first` |
| `Stripe` | Billing stack | `Stripe`, `Paddle`, `LemonSqueezy` |
| `Resend` | Transactional email | `Resend`, `Postmark`, `SendGrid` |
| `Inngest` | Background jobs | `Inngest`, `Trigger.dev`, `Temporal` |
| `pre-MVP` | Current stage | `pre-MVP`, `MVP`, `post-revenue`, `scale` |
| `Building MVP` | One-line "what we're shipping this week" | `Auth + first scan flow` |
| `Sprint 1 — foundation` | Sprint label | `Sprint 3 — onboarding` |
| `None` | Active blockers | `None` |
| `First demo` | Next concrete goal | `First paying customer` |
| `TBD` | Audience descriptor | `SMB`, `Enterprise IT`, `Solo founders` |
| `English` | Default UI language | `English`, `Spanish` |
| `English` | Languages supported | `English` or `English + Hebrew` |

---

## 3 — Files to review by hand (placeholders won't catch everything)

| File | Why |
|------|-----|
| [CLAUDE.md](CLAUDE.md) | Project State section is the only thing agents read for "where we are now" — write it. Stack block defaults to Next.js + Supabase + Vercel; change if you're not on that stack. |
| [AGENTS.md](AGENTS.md) | Routing table — confirm the C-suite list matches your needs (you may not want a CCO or Design-Lead early). |
| [.claude/qa-tier-floor.yml](.claude/qa-tier-floor.yml) | File-path patterns assume a Next.js / Supabase layout. If you're on a different framework, retune the `**/api/**`, `**/middleware.ts`, `**/components/**` patterns. |
| [.claude/settings.json](.claude/settings.json) | Bash allowlist, MCP grants, hook paths. Review every line. |
| [.claude/settings.json.proposed](.claude/settings.json.proposed) | The aspirational tighter settings — diff against `settings.json` and adopt deltas as you trust them. |
| `.claude/hooks/*.sh` and `*.js` | Hooks run on every action. Read each one before enabling. `gsa-context-monitor.js` references env var `EVALOVE_NO_AUTOCOMPACT` — set it or remove the check. |
| `.claude/commands/*.md` | 13 slash commands. Confirm they reference the right docs paths for your project. |
| `.claude/memory/*.md` | Empty templates installed. Fill in `LONG-TERM.md` immediately. Leave the others to populate organically. |

---

## 4 — Stack-coupled prompts (no action required, just be aware)

Agent prompts reference the **default stack** declared in CLAUDE.md as concrete
examples. Examples count: `Supabase 37` · `Inngest 18` · `Mem0 17` · `Paddle 12` · `Resend 3`.

If you swap one of these defaults (e.g. Stripe instead of Paddle), do **not** sed-replace
across all agent files — the examples are written assuming specific API shapes. Instead:

1. Update the Stack block in [CLAUDE.md](CLAUDE.md).
2. Let agents adapt their examples to your stack on first use.
3. If a specific agent's pattern matters (e.g. `database-engineer.md` shows Supabase RLS
   syntax), edit that one file by hand to match your DB.

---

## 5 — Skill library (147 → 144 after scrub)

3 Beamix-only skills were archived to `.archive/pre-beamix-bundle-2026-05-25/beamix-only-skills/`:
- `beamix-scan-architecture` — Beamix's GEO scan pipeline (project-specific)
- `beamix-voice-canon` — Beamix Model B voice canon (project-specific)
- `beamix-brand-quality-bar` — Beamix design system v4.0 (project-specific)

2 were renamed to drop the Beamix suffix:
- `supabase-rls-beamix` → `supabase-rls-conventions`
- `pgvector-rag-beamix` → `pgvector-rag-conventions`

The skill MANIFEST at `.claude/skills/MANIFEST.json` was regenerated from the
filesystem and is the discovery index — agents filter by tags rather than `ls | grep`.

If you delete/rename more skills, regenerate the manifest. The bundled
`bin/init-from-template.sh` does not regenerate it; if you make structural skill
changes, the regen pattern is in the script `Regenerating MANIFEST.json` section
of the conversation that produced this kit (or write your own walk).

---

## 6 — CI (not installed by default)

The Beamix kit shipped `.github/workflows/qa-lead-pass.yml` and `promptfoo-eval.yml`.
They are staged in `new agents-skills-workflows-system/.github/workflows/` but not
copied to `.github/` at the repo root, because the workflow references conventions
(session-file frontmatter, label vocabulary) you should validate first.

When ready:

```bash
mkdir -p .github/workflows
cp "new agents-skills-workflows-system/.github/workflows/"*.yml .github/workflows/
```

Then read both YAML files and confirm:
- Required GitHub labels (`risk:lite`, `risk:full`, `risk:irreversible`) exist in your repo settings
- Required secrets are configured (Claude API key for the multi-judge step)
- The session-file path convention (`docs/08-agents_work/sessions/`) matches your docs layout

---

## 7 — Provenance

| Path | What it is |
|------|------------|
| `.archive/pre-beamix-bundle-2026-05-25/` | The pre-existing GSA Startup Kit (31 agents, 426 skills, 10 commands) — preserved verbatim. Use as reference, do not modify. |
| `.archive/pre-beamix-bundle-2026-05-25/beamix-only-skills/` | The 3 Beamix-specific skills that were too project-bound to template. |
| `new agents-skills-workflows-system/` | The raw Beamix bundle as imported (5.2 MB). Useful for diff or re-install. Safe to delete once you're confident in the installed `.claude/` + `.agent/`. |
| `.claude/` and `.agent/` | The active agent system. Identical mirrors. |
| `CLAUDE.md` | Auto-loaded by Claude Code every session. |
| `AGENTS.md` | Routing table. |

---

## 8 — First-run smoke test

```
# In any Claude Code session at this repo root, after running init-from-template.sh:
/name ceo-template-smoke-test
/color gold
"Read CLAUDE.md and AGENTS.md and tell me what's still a placeholder, what's
ambiguous, and what you'd ask me before doing any real work."
```

If the CEO reports any unfilled `{{PLACEHOLDERS}}` and asks clarifying questions
before delegating, the install is good. If it tries to do work, re-read this
file — something is off.
