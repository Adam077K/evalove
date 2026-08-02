#!/bin/bash
# GSA Startup Kit — first-time setup
set -e
echo "GSA Startup Kit Setup"

# Verify Node (for GSA hooks)
if command -v node &>/dev/null; then
  echo "Node.js: $(node -v)"
else
  echo "Warning: Node.js recommended for Get-Shit-Done hooks (npm install not required)"
fi

# Verify structure
test -d .claude || (echo "Error: .claude missing" && exit 1)
test -d .agent/skills || (echo "Error: .agent/skills missing" && exit 1)

# Ensure memory files exist
for f in .claude/memory/DECISIONS.md .claude/memory/CODEBASE-MAP.md .claude/memory/USER-INSIGHTS.md; do
  if [ ! -f "$f" ]; then
    touch "$f"
    echo "Created: $f"
  fi
done

echo "Done. Open in Claude Code, Cursor, or Antigravity."
