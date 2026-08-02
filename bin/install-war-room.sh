#!/usr/bin/env bash
# install-war-room.sh — install the multi-CEO tmux war-room for the current project
#
# Reads {{PROJECT_NAME}} / {{project_name}} from args or .template.env.
# Installs:
#   ~/bin/<project_name>                         — main launcher (templated beamix script)
#   ~/.tmux/scripts/<project_name>-{hq,status,scratchpad,colors}.sh — tmux helpers
#   ~/.<project_name>/                            — runtime state dir
#   ./war-room-dashboard/                         — live web dashboard, scoped to this project
#
# Usage:
#   bash bin/install-war-room.sh                  (reads from .template.env)
#   bash bin/install-war-room.sh acme             (sets project_name=acme, PROJECT_NAME=Acme)
#   bash bin/install-war-room.sh acme Acme        (explicit)
#
# Idempotent — re-run to update existing install.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── Determine project name ───────────────────────────────────
if [[ -n "${1:-}" ]]; then
  project_name="$1"
  PROJECT_NAME="${2:-$(echo "$project_name" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')}"
elif [[ -f .template.env ]]; then
  set -a; . .template.env; set +a
  : "${project_name:?need project_name in .template.env}"
  : "${PROJECT_NAME:?need PROJECT_NAME in .template.env}"
else
  echo "✗ Usage: bash bin/install-war-room.sh <project_name> [PROJECT_NAME]"
  echo "  or place values in .template.env"
  exit 1
fi

PROJECT_NAME_UPPER="$(echo "$project_name" | tr '[:lower:]' '[:upper:]')"
PROJECT_DIR="$REPO_ROOT"
STATE_DIR="$HOME/.$project_name"
TMUX_SCRIPTS_DIR="$HOME/.tmux/scripts"
BIN_DIR="$HOME/bin"

echo "──────────────────────────────────────────────"
echo "  War-room install"
echo "──────────────────────────────────────────────"
echo "  project_name:       $project_name"
echo "  PROJECT_NAME:       $PROJECT_NAME"
echo "  PROJECT_NAME_UPPER: $PROJECT_NAME_UPPER"
echo "  project dir:        $PROJECT_DIR"
echo "  state dir:          $STATE_DIR"
echo "  ~/bin launcher:     $BIN_DIR/$project_name"
echo "  tmux scripts:       $TMUX_SCRIPTS_DIR/$project_name-*.sh"
echo "  dashboard:          $PROJECT_DIR/war-room-dashboard/"
echo ""

# ── Detect BSD vs GNU sed ────────────────────────────────────
if sed --version >/dev/null 2>&1; then SED_INPLACE=(-i); else SED_INPLACE=(-i ''); fi

substitute() {
  # substitute SRC DEST
  local src="$1" dest="$2"
  cp "$src" "$dest"
  sed "${SED_INPLACE[@]}" \
      -e "s|{{PROJECT_NAME_UPPER}}|$PROJECT_NAME_UPPER|g" \
      -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
      -e "s|{{project_name}}|$project_name|g" \
      "$dest"
}

# ── 1. Master launcher ───────────────────────────────────────
mkdir -p "$BIN_DIR"
substitute "war-room/bin/PROJECT_NAME.tmpl" "$BIN_DIR/$project_name"
chmod +x "$BIN_DIR/$project_name"
echo "✓ Installed $BIN_DIR/$project_name"

# ── 2. tmux helper scripts ───────────────────────────────────
mkdir -p "$TMUX_SCRIPTS_DIR"
for helper in hq status scratchpad colors; do
  substitute "war-room/tmux/PROJECT_NAME-$helper.tmpl" "$TMUX_SCRIPTS_DIR/$project_name-$helper.sh"
  chmod +x "$TMUX_SCRIPTS_DIR/$project_name-$helper.sh"
  echo "✓ Installed $TMUX_SCRIPTS_DIR/$project_name-$helper.sh"
done

# ── 3. State dir ─────────────────────────────────────────────
mkdir -p "$STATE_DIR/snapshots" "$STATE_DIR/messages"
touch "$STATE_DIR/events.jsonl"
echo "✓ Created $STATE_DIR/"

# ── 4. Dashboard scaffold ────────────────────────────────────
if [[ -d "$PROJECT_DIR/war-room-dashboard" ]]; then
  echo "⚠ war-room-dashboard/ already exists in project — updating in place"
fi
mkdir -p "$PROJECT_DIR/war-room-dashboard"

# Copy + substitute dashboard files
cp -R war-room/dashboard/. "$PROJECT_DIR/war-room-dashboard/"
find "$PROJECT_DIR/war-room-dashboard" -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) \
  -print0 \
  | xargs -0 sed "${SED_INPLACE[@]}" \
      -e "s|{{PROJECT_NAME_UPPER}}|$PROJECT_NAME_UPPER|g" \
      -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
      -e "s|{{project_name}}|$project_name|g"
echo "✓ Installed $PROJECT_DIR/war-room-dashboard/"

# ── 5. PATH check ────────────────────────────────────────────
if ! echo ":$PATH:" | grep -q ":$BIN_DIR:"; then
  echo ""
  echo "⚠ $BIN_DIR is not in your PATH."
  echo "  Add this to ~/.zshrc or ~/.bashrc:"
  echo "    export PATH=\"\$HOME/bin:\$PATH\""
fi

# ── 6. Verify ────────────────────────────────────────────────
echo ""
echo "── Verification ──"
for f in "$BIN_DIR/$project_name" \
         "$TMUX_SCRIPTS_DIR/$project_name-hq.sh" \
         "$TMUX_SCRIPTS_DIR/$project_name-status.sh" \
         "$TMUX_SCRIPTS_DIR/$project_name-scratchpad.sh" \
         "$TMUX_SCRIPTS_DIR/$project_name-colors.sh" \
         "$STATE_DIR/events.jsonl" \
         "$PROJECT_DIR/war-room-dashboard/server/config.ts"; do
  if [[ -e "$f" ]]; then echo "  ✓ $f"; else echo "  ✗ MISSING: $f"; fi
done

# Residual placeholder check
RESIDUAL=$(grep -rl "{{PROJECT_NAME}}\|{{project_name}}\|{{PROJECT_NAME_UPPER}}" \
  "$BIN_DIR/$project_name" \
  "$TMUX_SCRIPTS_DIR/$project_name"-*.sh \
  "$PROJECT_DIR/war-room-dashboard" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$RESIDUAL" -gt 0 ]]; then
  echo ""
  echo "✗ $RESIDUAL files still contain placeholders. Substitution failed."
  exit 2
else
  echo "  ✓ Zero residual placeholders"
fi

echo ""
echo "✓ War-room installed. Launch with:"
echo "    $project_name           (3 CEOs in current dir)"
echo "    $project_name 5         (5 CEOs)"
echo "    $project_name 3 --grid  (grid layout)"
echo ""
echo "Live dashboard:"
echo "    cd war-room-dashboard && bun install && bun run dev"
echo "    open http://localhost:4200"
