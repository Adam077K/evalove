#!/usr/bin/env bash
# Per-file typecheck PostToolUse hook
# Locked 2026-05-16 (board decision #10 — replaces full `pnpm typecheck` cascade).
# Runs `tsc --noEmit` on the edited file ONLY. Target latency <1s.
# Soft-warn only — emits stderr but never blocks (Claude Code reads stderr
# into the next turn so the agent can self-correct).
#
# Trigger: Claude Code PostToolUse hook on Edit / Write tool calls.
# Stdin: JSON payload with .tool_name, .tool_input.file_path, .tool_response
# Stdout: empty (silent on success)
# Stderr: tsc errors (surfaced to next agent turn)
# Exit: always 0 (non-blocking by design — FM-13 mitigation)

set -uo pipefail

# Read PostToolUse JSON payload from stdin
payload=$(cat)

# Extract tool name + edited file path; bail if not Edit/Write of a TS file
tool_name=$(printf '%s' "$payload" | awk -F'"' '/"tool_name"/{print $4; exit}')
file_path=$(printf '%s' "$payload" | awk -F'"' '/"file_path"/{print $4; exit}')

case "$tool_name" in
  Edit|Write|NotebookEdit) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Only typecheck files inside apps/web/ (the only TS workspace right now)
case "$file_path" in
  */apps/web/*) ;;
  *) exit 0 ;;
esac

# Locate the monorepo root via git
repo_root=$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$repo_root/apps/web/tsconfig.json" ] || exit 0

# Relative path inside apps/web/
rel_path="${file_path#$repo_root/}"

# Run tsc on the file alone (skipLibCheck for speed; standalone may emit
# false-positive import errors which the agent should ignore unless persistent)
cd "$repo_root" || exit 0
tsc_output=$(pnpm --silent --filter '@beamix/web' exec tsc --noEmit --skipLibCheck --pretty false "$rel_path" 2>&1)
tsc_exit=$?

if [ $tsc_exit -ne 0 ] && [ -n "$tsc_output" ]; then
  # Filter noise: drop "Cannot find module" + "Cannot find name" lines that
  # come from standalone-file mode missing the project graph. The agent's IDE
  # MCP getDiagnostics will catch real issues with full project context.
  filtered=$(printf '%s\n' "$tsc_output" | grep -vE "Cannot find (module|name)" | head -20)
  if [ -n "$filtered" ]; then
    {
      echo "[post-edit-typecheck] tsc --noEmit on $rel_path:"
      echo "$filtered"
      echo "[post-edit-typecheck] Run \`pnpm -F @beamix/web typecheck\` for full project view."
    } >&2
  fi
fi

exit 0
