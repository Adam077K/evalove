#!/usr/bin/env bash
# PreToolUse safety gate — Beamix Phase 6 (2026-05-16)
#
# PURPOSE: Block genuinely dangerous commands and file edits before they run.
#          This hook fires on EVERY tool call, so it MUST be fast (<200ms).
#
# BLOCKING RULES (exit non-zero → Claude Code refuses the tool call):
#   Bash: rm -rf *, rm -rf /, rm -rf ~, chmod +x, npm install -g,
#         pip install, wget, curl to external URLs, git --no-verify,
#         git push --force to main/master, git reset --hard (non-HEAD),
#         git checkout --
#   Edit/Write: .env* files, existing supabase migration files
#
# SOFT-WARN RULES (exit 1 → Claude Code logs warning but still executes):
#   NOTE: Claude Code PreToolUse exit semantics: 0 = allow, non-zero = BLOCK.
#   For soft-warns we emit stderr and exit 0 — this surfaces the message in
#   Claude's next turn but does NOT block execution.
#
# STDIN: Claude Code PreToolUse JSON payload:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#   { "tool_name": "Edit", "tool_input": { "file_path": "...", "old_string": "..." }, ... }
#   { "tool_name": "Write", "tool_input": { "file_path": "..." }, ... }
#
# EXIT CODES:
#   0           = allow (or soft-warn — message on stderr, execution continues)
#   non-zero    = BLOCK — Claude Code refuses the call; stderr message shown to agent
#
# STYLE: Mirrors post-edit-typecheck.sh — read payload via `cat`, parse with awk/grep.
#        No external deps; pure bash + coreutils only.

set -uo pipefail

# ── Helpers ───────────────────────────────────────────────────────────────────

block() {
  local reason="$1"
  echo "[pre-tool-use] BLOCKED: $reason" >&2
  exit 2
}

softwarn() {
  local reason="$1"
  echo "[pre-tool-use] WARNING: $reason" >&2
  # exit 0 so Claude Code still executes — warning surfaces in next turn
}

# ── Read payload ──────────────────────────────────────────────────────────────

payload=$(cat)

# Fast parse: awk-based extraction (no jq dependency)
tool_name=$(printf '%s' "$payload" | awk -F'"' '/"tool_name"/{print $4; exit}')

# ── Route by tool type ────────────────────────────────────────────────────────

case "$tool_name" in
  Bash)
    command=$(printf '%s' "$payload" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" 2>/dev/null || printf '%s' "$payload" | awk -F'"' '/"command"/{print $4; exit}')

    # ── BLOCK: rm -rf dangerous variants ─────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'rm\s+-[a-zA-Z]*r[a-zA-Z]*f|rm\s+-[a-zA-Z]*f[a-zA-Z]*r'; then
      # Specifically block rm -rf targeting /, ~, *, /tmp broad, etc.
      if printf '%s' "$command" | grep -qE 'rm\s+(-[a-zA-Z]+\s+)*(\/[^a-zA-Z]?|~|\.\.\/|\*|\/tmp\/?\*|\/var|\/etc|\/home|\/usr)'; then
        block "rm -rf on a dangerous path. Use targeted removal instead: rm -f <specific-file>."
      fi
      # rm -rf with no path (bare) or trailing space = block
      if printf '%s' "$command" | grep -qE 'rm\s+-rf\s*$'; then
        block "Bare rm -rf with no path. Specify the exact file or directory."
      fi
    fi

    # ── BLOCK: chmod +x ──────────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'chmod\s+\+x'; then
      block "chmod +x is blocked. Use 'chmod 755 <file>' for explicit permissions, or ask the CEO to approve."
    fi

    # ── BLOCK: npm install -g ────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'npm\s+install\s+-g|npm\s+i\s+-g'; then
      block "Global npm install (npm install -g) is blocked. Use project-local deps via pnpm add --save-dev."
    fi

    # ── BLOCK: pip install ───────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'pip\s+install|pip3\s+install'; then
      block "pip install is blocked. Python deps are not part of the Beamix stack. Confirm with the CEO if this is intentional."
    fi

    # ── BLOCK: wget ──────────────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE '\bwget\b'; then
      block "wget is blocked. Use 'curl -fsSL <url>' for controlled downloads, or ask the CEO to approve wget usage."
    fi

    # ── BLOCK: curl to external URLs (allow localhost / 127.0.0.1) ───────────
    # Strategy (no lookaheads — macOS grep doesn't support them):
    # 1. If curl is present AND the command contains http:// or https://
    # 2. AND the command does NOT contain localhost or 127.0.0.1
    # 3. → BLOCK (external curl)
    if printf '%s' "$command" | grep -qE '\bcurl\b'; then
      if printf '%s' "$command" | grep -qE 'https?://'; then
        if ! printf '%s' "$command" | grep -qE '(localhost|127\.0\.0\.1)'; then
          block "curl to external URL is blocked. Only curl localhost/127.0.0.1 is allowed. Wrap external HTTP calls in Next.js API routes or use the WebFetch MCP tool."
        fi
      fi
    fi

    # ── BLOCK: git --no-verify ───────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*--no-verify'; then
      block "--no-verify skips pre-commit hooks (lint + typecheck). Remove --no-verify and fix the underlying hook failure instead."
    fi

    # ── BLOCK: git push --force to main/master ────────────────────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*push\b.*(--force|-f)\b.*(main|master)' || \
       printf '%s' "$command" | grep -qE 'git\b.*push\b.*(main|master).*(--force|-f)'; then
      block "Force-push to main/master is blocked. Create a PR instead, or ask the CEO to approve the force-push explicitly."
    fi

    # ── BLOCK: git reset --hard (allow git reset HEAD for staging) ────────────
    if printf '%s' "$command" | grep -qE 'git\b.*reset\b.*--hard'; then
      # Allow: git reset --hard HEAD (no-op relative to current commit)
      # Block: git reset --hard with anything other than HEAD or HEAD~0
      if ! printf '%s' "$command" | grep -qE 'git\b.*reset\b.*--hard\s+HEAD\s*$'; then
        block "git reset --hard is blocked (destroys uncommitted work). Use 'git stash' to save work, or 'git reset HEAD <file>' to unstage specific files."
      fi
    fi

    # ── BLOCK: git checkout -- (discards uncommitted changes) ────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*checkout\b.*--\s+'; then
      block "git checkout -- <file> discards uncommitted changes permanently. Use 'git stash' to temporarily save work instead."
    fi

    # ── SOFT-WARN: git push origin main (non-force) ──────────────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*push\b.*origin\b.*(main|master)' && \
       ! printf '%s' "$command" | grep -qE '(--force|-f)\b'; then
      softwarn "Pushing directly to main/master. Prefer a PR via 'gh pr create' for code review. Proceeding with push."
    fi

    # ── SOFT-WARN: gh pr merge ────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'gh\s+pr\s+merge'; then
      softwarn "gh pr merge bypasses the local QA Lead review step. Ensure QA verdict PASS is in the session file before merging."
    fi

    ;;

  Edit|Write|NotebookEdit)
    file_path=$(python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null <<< "$payload" || printf '%s' "$payload" | awk -F'"' '/"file_path"/{print $4; exit}')

    # ── BLOCK: .env* files ───────────────────────────────────────────────────
    if printf '%s' "$file_path" | grep -qE '(^|/)\.(env)(\.|$|local|production|staging|test|development)'; then
      block ".env files must be edited via your system editor (not Claude). These files may contain secrets. Path: $file_path"
    fi
    # Also catch plain .env
    if printf '%s' "$file_path" | grep -qE '(^|/)\.env$'; then
      block ".env file must be edited via your system editor (not Claude). This file may contain secrets."
    fi

    # ── BLOCK: existing supabase migration files ─────────────────────────────
    if printf '%s' "$file_path" | grep -qE 'supabase/migrations/[^/]+\.sql$'; then
      # Block only if the file already exists (migrations are immutable once authored)
      if [ -f "$file_path" ]; then
        block "Supabase migration files are immutable once authored. Create a NEW migration file instead of editing '$file_path'. Editing migrations breaks the audit trail."
      fi
    fi

    # ── SOFT-WARN: DECISIONS.md edits (prefer append-only) ─────────────────
    if printf '%s' "$file_path" | grep -qE '(^|/)\.claude/memory/DECISIONS\.md$'; then
      old_string=$(python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('old_string', ''))
except Exception:
    print('')
" 2>/dev/null <<< "$payload" || echo "")
      # If old_string is non-empty, this is a replacement (not an append)
      if [ -n "$old_string" ]; then
        softwarn "DECISIONS.md edit detected (non-append). DECISIONS.md should be append-only — add new entries at the bottom rather than modifying existing ones. Proceeding."
      fi
    fi

    ;;

  *)
    # Unknown tool — allow
    ;;
esac

exit 0
