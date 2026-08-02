# Global Setup — Startup Kit

Install the agent team, skills, and commands once — available in every project on your machine.

---

## Why Global Setup

By default, agents and skills live inside your project folder. Global setup copies them to `~/.claude/` so they're available in every new project without repeating the installation. It also keeps everything in sync: update the kit once, all your projects benefit.

---

## What Gets Installed

| Component | Local Path (project) | Global Path |
|-----------|---------------------|-------------|
| Skills (426+) | `.claude/skills/` | `~/.claude/skills/` |
| Agents (31) | `.claude/agents/` | `~/.claude/agents/` |
| Commands | `.claude/commands/` | `~/.claude/commands/` |
| Workflows | `.claude/get-shit-done/` | `~/.claude/get-shit-done/` |

---

## Install Options

### Option A — Automated (recommended)

**Global install** — available in every project automatically:
```bash
npx gsa-startup-kit --claude --global
```

**Local install** — available in the current project only:
```bash
# Run from inside your project folder:
npx gsa-startup-kit --claude
```

### Option B — Manual

```bash
# Run from the root of the kit:
cp -r .claude/agents/* ~/.claude/agents/
cp -r .claude/commands ~/.claude/
cp -r .claude/get-shit-done ~/.claude/
cp -r .claude/hooks ~/.claude/
```

---

## Step-by-Step Global Setup

### Step 1: Copy Skills and Agents to Global Location

Run from the root of the kit. Symlinks are preferred over copies — they stay in sync when the kit updates.

```bash
# Create global directories
mkdir -p ~/.agent
mkdir -p ~/.claude/agents

# Skills — symlink (stays in sync with updates)
ln -sf <path-to-kit>/.agent/skills ~/.agent/skills

# Agents, Commands, Workflows — copy (or symlink)
cp -r <path-to-kit>/.claude/agents/* ~/.claude/agents/
cp -r <path-to-kit>/.claude/commands ~/.claude/
cp -r <path-to-kit>/.claude/get-shit-done ~/.claude/
```

Replace `<path-to-kit>` with the absolute path to your cloned kit, e.g. `/Users/you/projects/startup-kit`.

### Step 2: Cursor Agent Skills (optional)

To use skills with `@skill-name` in Cursor:

```bash
npx antigravity-awesome-skills --cursor --path ~/.cursor/skills
```

Or symlink specific sub-directories from `.agent/skills/` to `~/.cursor/skills/`.

### Step 3: Global Rules for Cursor (optional)

**Via Cursor Settings (simplest):**
1. Open **Cursor → Settings → Cursor Settings → General**
2. Under **Rules for AI**, paste the contents of `AGENTS.md`
3. These rules apply to every project automatically

**Via rules file:**
```bash
mkdir -p ~/.cursor/rules
cp <path-to-kit>/.cursor/rules/*.mdc ~/.cursor/rules/
```

### Step 4: New Project Setup

In any new project where you want to use the globally installed agents:

```bash
# From inside the new project root
mkdir -p .claude

# Symlinks to global components (stay in sync automatically)
ln -sf ~/.agent .agent
ln -sf ~/.claude/get-shit-done .claude/get-shit-done
ln -sf ~/.claude/agents .claude/agents
ln -sf ~/.claude/commands .claude/commands

# Project-specific planning directory
mkdir -p .planning
```

Then copy `CLAUDE.md` and `AGENTS.md` from the kit into the new project root and customize them for the new project.

---

## Keeping Skills Updated

If you installed via symlink (recommended), skills update automatically when you pull the latest kit. If you copied files:

```bash
# Pull latest kit
cd <path-to-kit>
git pull

# Re-copy agents and commands
cp -r .claude/agents/* ~/.claude/agents/
cp -r .claude/commands ~/.claude/
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| First-time global install | Run commands in Steps 1–3 above |
| Set up a new project | Run commands in Step 4 inside the project root |
| Update skills (symlink) | `cd <path-to-kit> && git pull` |
| Update agents (copy) | Re-run the copy commands in Step 1 |
| Check installed agents | `ls ~/.claude/agents/` |
