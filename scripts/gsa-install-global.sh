#!/bin/bash
# GSA Startup Kit — Install to global ~/.agent and ~/.claude
# Run from GSA project root: ./scripts/gsa-install-global.sh
set -e

# Resolve GSA project directory (script's parent's parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GSA="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "GSA Install Global — source: $GSA"
echo ""

# Step 0: Backup
BACKUP_DIR="$HOME/gsa-global-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "$HOME/.agent" "$BACKUP_DIR/agent" 2>/dev/null || true
cp -r "$HOME/.claude/agents" "$BACKUP_DIR/claude-agents" 2>/dev/null || true
cp -r "$HOME/.claude/get-shit-done" "$BACKUP_DIR/claude-get-shit-done" 2>/dev/null || true
cp -r "$HOME/.claude/commands" "$BACKUP_DIR/claude-commands" 2>/dev/null || true
echo "Backup: $BACKUP_DIR"
echo ""

# Step 1: ~/.agent (Antigravity structure)
echo "Building ~/.agent..."
rm -rf "$HOME/.agent"
mkdir -p "$HOME/.agent"
cp -r "$GSA/.agent/skills" "$HOME/.agent/"
cp -r "$GSA/.claude/agents" "$HOME/.agent/"
cp -r "$GSA/.claude/get-shit-done/workflows" "$HOME/.agent/"
mkdir -p "$HOME/.agent/rules"
cp "$GSA/.cursor/rules"/*.mdc "$HOME/.agent/rules/" 2>/dev/null || true
cp "$GSA/AGENTS.md" "$HOME/.agent/rules/" 2>/dev/null || true
echo "  Done: skills, agents, workflows, rules"
echo ""

# Step 2: ~/.claude (Claude Code / GSA structure)
echo "Building ~/.claude..."
rm -rf "$HOME/.claude/agents" "$HOME/.claude/get-shit-done" "$HOME/.claude/commands" "$HOME/.claude/skills" 2>/dev/null || true
cp -r "$GSA/.claude/agents" "$HOME/.claude/"
cp -r "$GSA/.claude/get-shit-done" "$HOME/.claude/"
mkdir -p "$HOME/.claude/commands"
cp -r "$GSA/.claude/commands/gsa" "$HOME/.claude/commands/"
ln -sf "$HOME/.agent/skills" "$HOME/.claude/skills"
echo "  Done: agents, get-shit-done, commands, skills (symlink)"
echo ""

# Step 3: ~/.cursor/rules
echo "Copying rules to ~/.cursor/rules..."
mkdir -p "$HOME/.cursor/rules"
cp "$GSA/.cursor/rules"/*.mdc "$HOME/.cursor/rules/"
echo "  Done: $(ls "$HOME/.cursor/rules"/*.mdc 2>/dev/null | wc -l | tr -d ' ') rules"
echo ""

echo "GSA global install complete."
echo ""
echo "Summary:"
echo "  ~/.agent/     skills, agents, workflows, rules"
echo "  ~/.claude/    agents, get-shit-done, commands, skills→~/.agent/skills"
echo "  ~/.cursor/    rules"
echo ""
echo "Backup: $BACKUP_DIR"
