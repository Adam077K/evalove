#!/usr/bin/env node
// Context Monitor - PostToolUse hook
// Reads context metrics from the statusline bridge file and injects
// warnings when context usage is high. This makes the AGENT aware of
// context limits (the statusline only shows the user).
//
// How it works:
// 1. The statusline hook writes metrics to /tmp/claude-ctx-{session_id}.json
// 2. This hook reads those metrics after each tool use
// 3. When remaining context drops below thresholds, it injects a warning
//    as additionalContext, which the agent sees in its conversation
//
// Thresholds:
//   WARNING     (remaining <= 35%): Agent should wrap up current task
//   CRITICAL    (remaining <= 25%): Agent should stop immediately and save state
//   AUTOCOMPACT (remaining <= 20%): Auto-send /compact to the agent's tmux pane
//
// Debounce: 5 tool uses between warnings to avoid spam
// Severity escalation bypasses debounce (WARNING -> CRITICAL fires immediately)
//
// Auto-compact:
//   - Fires when remaining <= 20% (AUTOCOMPACT_THRESHOLD)
//   - Sends /compact to the tmux pane via tmux send-keys (target = TMUX_PANE env var)
//   - 5-minute cooldown between auto-compacts (tracked in /tmp/claude-autocompact-{sid}.json)
//   - Disabled if BEAMIX_NO_AUTOCOMPACT=1 env var is set
//   - Does NOT fire if already in the CRITICAL debounce window

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const WARNING_THRESHOLD     = 35;  // remaining_percentage <= 35%
const CRITICAL_THRESHOLD    = 25;  // remaining_percentage <= 25%
const AUTOCOMPACT_THRESHOLD = 20;  // remaining_percentage <= 20% → send /compact
const STALE_SECONDS         = 60;  // ignore metrics older than 60s
const DEBOUNCE_CALLS        = 5;   // min tool uses between warnings
const AUTOCOMPACT_COOLDOWN  = 300; // seconds between auto-compacts (5 minutes)

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;

    if (!sessionId) {
      process.exit(0);
    }

    const tmpDir = os.tmpdir();
    const metricsPath = path.join(tmpDir, `claude-ctx-${sessionId}.json`);

    // If no metrics file, this is a subagent or fresh session -- exit silently
    if (!fs.existsSync(metricsPath)) {
      process.exit(0);
    }

    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);

    // Ignore stale metrics
    if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
      process.exit(0);
    }

    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;

    // No warning needed
    if (remaining > WARNING_THRESHOLD) {
      process.exit(0);
    }

    // Debounce: check if we warned recently
    const warnPath = path.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null };
    let firstWarn = true;

    if (fs.existsSync(warnPath)) {
      try {
        warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
        firstWarn = false;
      } catch (e) {
        // Corrupted file, reset
      }
    }

    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    const isAutoCompact = remaining <= AUTOCOMPACT_THRESHOLD;
    const isCritical    = remaining <= CRITICAL_THRESHOLD;
    const currentLevel  = isCritical ? 'critical' : 'warning';

    // ── Auto-compact logic ─────────────────────────────────────────────────
    // Fires when: at/below AUTOCOMPACT_THRESHOLD, not opt-out, not in CRITICAL
    // debounce window (severity escalation would already be firing the crit warn
    // immediately, so we avoid stacking a /compact on top in the same call).
    const autoCompactDisabled = process.env.BEAMIX_NO_AUTOCOMPACT === '1';
    const inCriticalDebounce  = isCritical && !firstWarn &&
                                warnData.callsSinceWarn < DEBOUNCE_CALLS &&
                                warnData.lastLevel === 'critical';

    let autoCompactFired = false;

    if (isAutoCompact && !autoCompactDisabled && !inCriticalDebounce) {
      const acPath = path.join(tmpDir, `claude-autocompact-${sessionId}.json`);
      let lastCompactTs = 0;
      if (fs.existsSync(acPath)) {
        try {
          const acData = JSON.parse(fs.readFileSync(acPath, 'utf8'));
          lastCompactTs = acData.last_compact_ts || 0;
        } catch (e) { /* ignore corrupted file */ }
      }

      if ((now - lastCompactTs) >= AUTOCOMPACT_COOLDOWN) {
        // Target pane: TMUX_PANE is set by tmux for processes running inside a pane.
        // Fall back to metrics.tmux_pane if the statusline bridge writes it.
        const tmuxPane = process.env.TMUX_PANE || (metrics.tmux_pane) || null;

        if (tmuxPane) {
          try {
            execSync(`tmux send-keys -t ${tmuxPane} '/compact' Enter`, {
              stdio: 'ignore',
              timeout: 3000
            });
            fs.writeFileSync(acPath, JSON.stringify({ last_compact_ts: now }));
            autoCompactFired = true;
          } catch (e) {
            // tmux send-keys failed — non-fatal, continue with warning only
          }
        }
      }
    }

    // ── Standard warning debounce ──────────────────────────────────────────
    // Emit immediately on first warning, then debounce subsequent ones
    // Severity escalation (WARNING -> CRITICAL) bypasses debounce
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      // Update counter and exit without warning
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      process.exit(0);
    }

    // Reset debounce counter
    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    // Build warning message
    let message;
    if (isCritical) {
      message = `CONTEXT MONITOR CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'STOP new work immediately. Save state NOW and inform the user that context is nearly exhausted. ' +
        'If using GSA, run /gsa:pause-work to save execution state.';
    } else {
      message = `CONTEXT MONITOR WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'Begin wrapping up current task. Do not start new complex work. ' +
        'If using GSA, consider /gsa:pause-work to save state.';
    }

    // Append auto-compact note if it fired this cycle
    if (autoCompactFired) {
      message += ` [Auto-compact triggered at ${remaining}% context remaining]`;
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // Silent fail -- never block tool execution
    process.exit(0);
  }
});
