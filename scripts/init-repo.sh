#!/bin/bash
# GSA Startup Kit — Initialize as standalone Git repository
# Run from the kit root when publishing to GitHub
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

if [ -d .git ]; then
  echo "Git already initialized."
  git remote -v 2>/dev/null || true
  exit 0
fi

echo "Initializing Git repository..."
git init

echo "Adding remote: https://github.com/Adam077K/GSA-Vibe-Startup-Kit.git"
git remote add origin https://github.com/Adam077K/GSA-Vibe-Startup-Kit.git 2>/dev/null || git remote set-url origin https://github.com/Adam077K/GSA-Vibe-Startup-Kit.git

echo "Done. Next: git add . && git commit -m 'Initial commit' && git push -u origin main"
