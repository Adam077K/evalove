#!/usr/bin/env bash
# Stop hook — Beamix Phase 6 (2026-05-16)
#
# PURPOSE: Validate session hygiene at close. SOFT-WARN ONLY — never blocks.
#          Errors surface on stderr so Claude/agent sees them on next interaction.
#
# CHECKS:
#   1. Session file written: if git shows edited files this session,
#      warn if no docs/08-agents_work/sessions/YYYY-MM-DD-*.md was authored today.
#   2. Uncommitted changes: warn if git status shows dirty working tree.
#   3. Commit format: if commits exist since session start, check latest follows
#      conventional commit format (feat/fix/chore/docs/refactor/test/style/ci prefix).
#   4. QA verdict: if a session file exists, check it has qa_verdict in frontmatter.
#
# STDIN: Claude Code Stop hook JSON payload:
#   { "session_id": "...", "transcript_path": "...", "stop_reason": "..." }
#
# EXIT CODE: always 0 — Stop hooks MUST NOT prevent session close.
#
# STYLE: Mirrors post-edit-typecheck.sh — pure bash + coreutils, no external deps.
#        Uses `set -uo pipefail` but wraps all logic in try/finally pattern via
#        explicit error handling (set -e is NOT used — mustn't crash session close).

set -uo pipefail

# ── Always-exit-0 trap ───────────────────────────────────────────────────────
# If anything unexpected happens, we still exit 0.
trap 'exit 0' ERR

# ── Helpers ──────────────────────────────────────────────────────────────────

warn() {
  echo "[stop] WARNING: $1" >&2
}

info() {
  echo "[stop] INFO: $1" >&2
}

# ── Read payload ─────────────────────────────────────────────────────────────

payload=$(cat 2>/dev/null || echo '{}')
stop_reason=$(printf '%s' "$payload" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('stop_reason', 'unknown'))
except Exception:
    print('unknown')
" 2>/dev/null || echo "unknown")

# ── Locate repo root ─────────────────────────────────────────────────────────

repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$repo_root" ]; then
  # Not in a git repo — skip all checks
  exit 0
fi

# ── Check 1: Uncommitted changes ─────────────────────────────────────────────

git_status=$(git -C "$repo_root" status --porcelain 2>/dev/null || echo "")
if [ -n "$git_status" ]; then
  changed_count=$(printf '%s' "$git_status" | wc -l | tr -d ' ')
  warn "Session ended with $changed_count uncommitted change(s). Run 'git add + git commit' before closing to preserve work."
  # List the files briefly (max 5)
  printf '%s' "$git_status" | head -5 | while IFS= read -r line; do
    echo "[stop]   $line" >&2
  done
  if [ "$changed_count" -gt 5 ]; then
    echo "[stop]   ... and $((changed_count - 5)) more." >&2
  fi
fi

# ── Check 2: Commit format (latest commit this session) ──────────────────────

# Get the latest commit message (if any commits exist)
latest_commit_msg=$(git -C "$repo_root" log -1 --format="%s" 2>/dev/null || echo "")
if [ -n "$latest_commit_msg" ]; then
  # Conventional commit pattern: type(scope): description OR type: description
  # Types: feat fix chore docs refactor test style ci perf build revert
  conventional_pattern='^(feat|fix|chore|docs|refactor|test|style|ci|perf|build|revert)(\([a-zA-Z0-9_/-]+\))?!?:\s+.+'
  if ! printf '%s' "$latest_commit_msg" | grep -qE "$conventional_pattern"; then
    warn "Latest commit message does not follow conventional format: '$latest_commit_msg'"
    warn "Expected format: feat(scope): description  OR  fix: description"
    warn "Types: feat | fix | chore | docs | refactor | test | style | ci | perf | build | revert"
  fi
fi

# ── Check 3: Session file written today ──────────────────────────────────────

today=$(date '+%Y-%m-%d' 2>/dev/null || echo "")
sessions_dir="$repo_root/docs/08-agents_work/sessions"

session_file_exists=false
if [ -n "$today" ] && [ -d "$sessions_dir" ]; then
  # Look for session files authored today
  if find "$sessions_dir" -name "${today}-*.md" -newer /dev/null 2>/dev/null | grep -q .; then
    session_file_exists=true
  fi
  # Also accept files modified today (mtime check)
  if find "$sessions_dir" -name "${today}-*.md" 2>/dev/null | grep -q .; then
    session_file_exists=true
  fi
fi

# Only warn about missing session file if there were actual git changes
# (editing files without commits still triggers this via git_status check above)
if [ -n "$git_status" ] || [ -n "$latest_commit_msg" ]; then
  if [ "$session_file_exists" = false ] && [ -d "$sessions_dir" ]; then
    warn "No session file found for today ($today) in docs/08-agents_work/sessions/."
    warn "Team leads must write: docs/08-agents_work/sessions/${today}-[lead]-[task-slug].md"
    warn "Template: docs/08-agents_work/sessions/_TEMPLATE.md (if it exists)"
  fi
fi

# ── Check 4: QA verdict in today's session files ─────────────────────────────

if [ "$session_file_exists" = true ] && [ -n "$today" ] && [ -d "$sessions_dir" ]; then
  # Check each session file authored today for qa_verdict in frontmatter
  while IFS= read -r session_file; do
    if [ -f "$session_file" ]; then
      # Look for qa_verdict in YAML frontmatter (between --- delimiters)
      has_qa_verdict=$(awk '/^---/{n++} n==1 && /qa_verdict/{found=1} END{print found+0}' "$session_file" 2>/dev/null || echo "0")
      if [ "$has_qa_verdict" -eq 0 ]; then
        filename=$(basename "$session_file")
        warn "Session file '$filename' is missing qa_verdict in frontmatter."
        warn "Add: qa_verdict: PASS|FAIL|SKIP  (or N/A for non-code tasks)"
      fi
    fi
  done < <(find "$sessions_dir" -name "${today}-*.md" 2>/dev/null)
fi

# ── Summary ───────────────────────────────────────────────────────────────────

info "Stop hook completed (stop_reason: $stop_reason). All warnings above are informational only."

exit 0
