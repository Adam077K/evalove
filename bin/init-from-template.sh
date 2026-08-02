#!/usr/bin/env bash
# init-from-template.sh — interactive template instantiation
# Walks the user through every {{PLACEHOLDER}}, runs the substitutions, then
# prints next steps. Safe to re-run; sed substitutions are idempotent.
#
# Usage:  bash bin/init-from-template.sh
#         bash bin/init-from-template.sh --non-interactive  (read from .template.env)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

NONINTERACTIVE=0
[[ "${1:-}" == "--non-interactive" ]] && NONINTERACTIVE=1

prompt() {
  # prompt VAR_NAME "Question" "default"
  local var=$1 q=$2 def=${3:-}
  if [[ $NONINTERACTIVE -eq 1 ]]; then
    eval "val=\${$var:-$def}"
  else
    if [[ -n "$def" ]]; then
      read -r -p "$q [$def]: " val
      val=${val:-$def}
    else
      read -r -p "$q: " val
    fi
  fi
  eval "$var=\"\$val\""
}

# Load .template.env if present
[[ -f .template.env ]] && set -a && . .template.env && set +a

echo "──────────────────────────────────────────────"
echo "  GSA Startup Kit — template instantiation"
echo "──────────────────────────────────────────────"
echo ""

prompt PROJECT_NAME    "Project display name"              "Acme"
prompt project_name    "Project slug (lowercase)"          "$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')"
prompt PROJECT_PREFIX  "Env var prefix (UPPERCASE)"         "$(echo "$PROJECT_NAME" | tr '[:lower:]' '[:upper:]')"
prompt TICKET_PREFIX   "Linear/Jira ticket prefix"          "${PROJECT_PREFIX}-"
prompt PROJECT_DOMAIN  "Production domain"                  "${project_name}.com"
prompt MARKETING_URL   "Marketing site URL"                 "https://${PROJECT_DOMAIN}"
prompt REPO_URL        "GitHub repo URL"                    "https://github.com/yourorg/${project_name}"
prompt FOUNDER_NAME    "Founder name (sign-off authority)"  "Founder"
prompt FOUNDER_ROLE    "Founder role"                       "Founder/CEO"
prompt COMMS_PREFS     "Communication preferences"          "Direct, numbers first"
prompt PAYMENT_PROVIDER "Payment provider"                  "Stripe"
prompt EMAIL_PROVIDER   "Email provider"                    "Resend"
prompt JOBS_PROVIDER    "Background-jobs provider"          "Inngest"
prompt STAGE            "Stage (pre-MVP/MVP/post-revenue/scale)" "pre-MVP"
prompt CURRENT_FOCUS    "Current focus (one line)"          "Building MVP"
prompt ACTIVE_SPRINT    "Active sprint"                     "Sprint 1 — foundation"
prompt BLOCKERS         "Blockers"                          "None"
prompt NEXT_MILESTONE   "Next milestone"                    "First demo"
prompt TARGET_MARKET    "Target market"                     "SMB"
prompt PRIMARY_LANGUAGE "Primary language"                  "English"
prompt LANGUAGES        "Languages (e.g. 'English' or 'English + Hebrew')" "$PRIMARY_LANGUAGE"

echo ""
echo "About to substitute across .claude/ .agent/ CLAUDE.md AGENTS.md TEMPLATE-USAGE.md."
if [[ $NONINTERACTIVE -ne 1 ]]; then
  read -r -p "Continue? [y/N] " ok
  [[ "$ok" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

# Build sed expression set
SED_EXPRS=(
  -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g"
  -e "s|{{project_name}}|$project_name|g"
  -e "s|{{PROJECT_PREFIX}}|$PROJECT_PREFIX|g"
  -e "s|{{TICKET_PREFIX}}|$TICKET_PREFIX|g"
  -e "s|{{PROJECT_DOMAIN}}|$PROJECT_DOMAIN|g"
  -e "s|{{MARKETING_URL}}|$MARKETING_URL|g"
  -e "s|{{REPO_URL}}|$REPO_URL|g"
  -e "s|{{FOUNDER_NAME}}|$FOUNDER_NAME|g"
  -e "s|{{FOUNDER_ROLE}}|$FOUNDER_ROLE|g"
  -e "s|{{COMMS_PREFS}}|$COMMS_PREFS|g"
  -e "s|{{PAYMENT_PROVIDER}}|$PAYMENT_PROVIDER|g"
  -e "s|{{EMAIL_PROVIDER}}|$EMAIL_PROVIDER|g"
  -e "s|{{JOBS_PROVIDER}}|$JOBS_PROVIDER|g"
  -e "s|{{STAGE}}|$STAGE|g"
  -e "s|{{CURRENT_FOCUS}}|$CURRENT_FOCUS|g"
  -e "s|{{ACTIVE_SPRINT}}|$ACTIVE_SPRINT|g"
  -e "s|{{BLOCKERS}}|$BLOCKERS|g"
  -e "s|{{NEXT_MILESTONE}}|$NEXT_MILESTONE|g"
  -e "s|{{TARGET_MARKET}}|$TARGET_MARKET|g"
  -e "s|{{PRIMARY_LANGUAGE}}|$PRIMARY_LANGUAGE|g"
  -e "s|{{LANGUAGES}}|$LANGUAGES|g"
)

# Detect BSD vs GNU sed for -i semantics
if sed --version >/dev/null 2>&1; then
  SED_INPLACE=(-i)        # GNU
else
  SED_INPLACE=(-i '')     # BSD/macOS
fi

# Apply across all relevant file types
find .claude .agent CLAUDE.md AGENTS.md TEMPLATE-USAGE.md README.md \
  \( -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.sh" -o -name "*.js" \) \
  -type f -print0 \
  | xargs -0 sed "${SED_INPLACE[@]}" "${SED_EXPRS[@]}"

echo ""
echo "✓ Substitutions applied."
echo ""
echo "Remaining placeholders (should be zero or only intentional):"
grep -rho "{{[A-Z_][A-Z_]*}}" .claude .agent CLAUDE.md AGENTS.md TEMPLATE-USAGE.md 2>/dev/null \
  | sort -u | head -10 || echo "✓ none"
echo ""

# ── War-room install (optional) ──────────────────────────────
INSTALL_WAR=${INSTALL_WAR_ROOM:-}
if [[ -z "$INSTALL_WAR" ]] && [[ $NONINTERACTIVE -ne 1 ]]; then
  read -r -p "Install multi-CEO tmux war-room now? (creates ~/bin/$project_name, tmux scripts, dashboard) [Y/n] " ans
  [[ "$ans" =~ ^[Nn] ]] && INSTALL_WAR="no" || INSTALL_WAR="yes"
fi
INSTALL_WAR=${INSTALL_WAR:-yes}

if [[ "$INSTALL_WAR" == "yes" ]] && [[ -f bin/install-war-room.sh ]]; then
  echo ""
  echo "── Installing war-room ──"
  bash bin/install-war-room.sh "$project_name" "$PROJECT_NAME" || {
    echo "⚠ War-room install failed. You can retry with: bash bin/install-war-room.sh"
  }
else
  echo "→ Skipped war-room install. Run later with: bash bin/install-war-room.sh"
fi

echo ""
echo "Next steps:"
echo "  1. Review CLAUDE.md — make sure stack + project state read correctly"
echo "  2. Review .claude/qa-tier-floor.yml — retune file-path patterns for your repo layout"
echo "  3. Review .claude/settings.json — confirm bash allowlist + hook paths"
echo "  4. (Optional) Wire CI: cp 'new agents-skills-workflows-system/.github/workflows/'*.yml .github/workflows/"
echo "  5. Smoke test in a Claude Code session:"
echo "       /name ceo-smoke-test"
echo "       /color gold"
echo "       Read CLAUDE.md and tell me what's still a placeholder."
if [[ "$INSTALL_WAR" == "yes" ]]; then
  echo "  6. Launch war-room: $project_name 3"
fi
echo ""
