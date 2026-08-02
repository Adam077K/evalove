#!/usr/bin/env node
// .claude/hooks/schema-lint.js — Beamix agent file schema lint
//
// Validates .claude/agents/*.md (top-level only — NOT war-room/ which uses
// the bespoke Routine schema acceptable per 07b §4) against the canonical
// 07b-AGENT-TEMPLATE.md spec.
//
// Usage:
//   node .claude/hooks/schema-lint.js                          # lint all top-level agents
//   node .claude/hooks/schema-lint.js .claude/agents/cto.md    # lint one file
//   node .claude/hooks/schema-lint.js --json                   # JSON output for CI
//
// Exit codes:
//   0 = all files pass
//   1 = any file fails (CI-blocking)
//   2 = script error
//
// Authored 2026-05-16 as Phase 1-followup of the agent rethink.

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = (() => {
  // Walk up from cwd until we find .claude/agents
  let p = process.cwd();
  while (p && p !== '/') {
    if (fs.existsSync(path.join(p, '.claude', 'agents'))) return p;
    p = path.dirname(p);
  }
  return process.cwd();
})();

const AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
const MANIFEST_PATH = path.join(REPO_ROOT, '.claude', 'skills', 'MANIFEST.json');

// ── 07b template checks ────────────────────────────────────────────────────

const REQUIRED_FRONTMATTER = [
  'name',
  'description',
  'model',
  'tools',
  'maxTurns',
  'color',
  'isolation',
  'mcpServers',
  'skills',
  'risk_tier_default',
];
// escalates_to + escalates_when are required for non-personas
// return_contract + pre_flight_reads are required for everyone

const VALID_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
const VALID_ISOLATION = ['worktree', 'none'];
const VALID_TIERS = ['trivial', 'lite', 'full', 'irreversible'];

// 8 mandatory body sections (## level-2 headers)
const MANDATORY_SECTIONS = [
  '## Identity & mission',
  '## Workflow position',
  '## Key distinctions',
  '## Pre-flight reads',
  '## Operating procedure',
  // Section 6: one of three (QA gate hand-off / Output evidence / Output format)
  '## Return contract',
  '## Anti-patterns',
];
const SECTION_6_OPTIONS = [
  '## QA gate hand-off',
  '## Output evidence',
  '## Output format',
];

// ── Minimal YAML frontmatter parser (no deps) ──────────────────────────────
// Handles simple `key: value`, `key: [...]`, `key:\n  - item`, multi-line `key: >`/`|`
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const fm = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || line.startsWith('#')) { i++; continue; }
    const kv = line.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/i);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();
    // Inline array: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      i++;
      continue;
    }
    // Multi-line string: > or |
    if (val === '>' || val === '|' || val === '|-' || val === '>-') {
      const lines2 = [];
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) { lines2.push(lines[i].trim()); i++; }
      fm[key] = lines2.join(' ');
      continue;
    }
    // Block list:   key:\n    - item\n    - item
    if (val === '') {
      const items = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, ''));
        i++;
      }
      // Could also be nested object — for our schema we only need the list form
      if (items.length > 0) { fm[key] = items; continue; }
      // Otherwise nested object — consume sub-lines (simple)
      const sub = {};
      while (i < lines.length && /^\s+\S/.test(lines[i])) {
        const sk = lines[i].match(/^\s+([a-z_][a-z0-9_]*)\s*:\s*(.*)$/i);
        if (sk) {
          let sv = sk[2].trim();
          if (sv.startsWith('[') && sv.endsWith(']')) {
            sv = sv.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          }
          sub[sk[1]] = sv;
        }
        i++;
      }
      fm[key] = sub;
      continue;
    }
    // Inline scalar
    const num = Number(val);
    fm[key] = Number.isFinite(num) && /^-?\d+$/.test(val) ? num : val.replace(/^["']|["']$/g, '');
    i++;
  }
  return fm;
}

// ── Load skill manifest ────────────────────────────────────────────────────
let LIVE_SKILLS = null;
function loadSkills() {
  if (LIVE_SKILLS) return LIVE_SKILLS;
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    LIVE_SKILLS = new Set((m.skills || []).map((s) => s.name));
  } catch (err) {
    LIVE_SKILLS = null;
  }
  return LIVE_SKILLS;
}

// ── Body section scan ──────────────────────────────────────────────────────
function scanSections(text) {
  return text.split('\n').filter((l) => /^## [^#]/.test(l)).map((l) => l.trim());
}

// ── Lint one file ──────────────────────────────────────────────────────────
function lintFile(filePath) {
  const checks = [];
  const issues = [];
  let warnings = 0;

  if (!fs.existsSync(filePath)) {
    return { path: filePath, status: 'fail', issues: [`file not found`], checks: [], warnings: 0, lines: 0, sections: 0 };
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n').length;
  const fm = parseFrontmatter(text);

  if (!fm) {
    return { path: filePath, status: 'fail', issues: ['no YAML frontmatter found'], checks: [], warnings: 0, lines, sections: 0 };
  }

  // Frontmatter required fields
  for (const f of REQUIRED_FRONTMATTER) {
    if (fm[f] === undefined || fm[f] === null) {
      issues.push(`frontmatter: missing required field "${f}"`);
    }
  }

  // Filename ↔ name match
  const baseName = path.basename(filePath, '.md');
  if (fm.name && fm.name !== baseName) {
    issues.push(`frontmatter: name="${fm.name}" doesn't match filename "${baseName}"`);
  }

  // Model
  if (fm.model && !VALID_MODELS.includes(fm.model)) {
    issues.push(`frontmatter: model="${fm.model}" not in valid set (${VALID_MODELS.join('|')})`);
  }

  // Tools must be an array
  if (fm.tools !== undefined && !Array.isArray(fm.tools)) {
    issues.push(`frontmatter: tools must be a YAML list, got ${typeof fm.tools}`);
  }

  // maxTurns
  if (typeof fm.maxTurns === 'number' && (fm.maxTurns < 5 || fm.maxTurns > 30)) {
    issues.push(`frontmatter: maxTurns=${fm.maxTurns} outside range [5, 30]`);
  }

  // isolation
  if (fm.isolation && !VALID_ISOLATION.includes(fm.isolation)) {
    issues.push(`frontmatter: isolation="${fm.isolation}" not in (${VALID_ISOLATION.join('|')})`);
  }

  // mcpServers must be a list (possibly empty)
  if (fm.mcpServers !== undefined && !Array.isArray(fm.mcpServers)) {
    issues.push(`frontmatter: mcpServers must be a YAML list`);
  }

  // skills must be a list — verify each name resolves
  if (fm.skills !== undefined) {
    if (!Array.isArray(fm.skills)) {
      issues.push(`frontmatter: skills must be a YAML list`);
    } else {
      const live = loadSkills();
      if (live) {
        for (const s of fm.skills) {
          if (!live.has(s)) issues.push(`frontmatter: skill "${s}" not in MANIFEST.json`);
        }
      } else {
        warnings++;
      }
    }
  }

  // risk_tier_default
  if (fm.risk_tier_default && !VALID_TIERS.includes(fm.risk_tier_default)) {
    issues.push(`frontmatter: risk_tier_default="${fm.risk_tier_default}" not in (${VALID_TIERS.join('|')})`);
  }

  // Layer auto-classification (model + tools)
  const isPersona = filePath.includes('/_personas/') || /persona-/.test(baseName);
  const hasTask = Array.isArray(fm.tools) && fm.tools.includes('Task');
  const isCEO = baseName === 'ceo';
  const isCSuite = !isCEO && hasTask;
  const isWorker = !isPersona && !hasTask;

  // Non-personas: escalates_to + escalates_when required
  if (!isPersona) {
    if (!fm.escalates_to) issues.push('frontmatter: missing escalates_to');
    if (!fm.escalates_when) issues.push('frontmatter: missing escalates_when');
  }
  // Everyone: return_contract + pre_flight_reads required
  if (!fm.return_contract) issues.push('frontmatter: missing return_contract');
  if (!fm.pre_flight_reads) issues.push('frontmatter: missing pre_flight_reads');

  // Body sections
  const sections = scanSections(text);
  for (const required of MANDATORY_SECTIONS) {
    if (!sections.some((s) => s.startsWith(required))) {
      issues.push(`body: missing mandatory section "${required}"`);
    }
  }
  // Section 6: one of three
  if (!sections.some((s) => SECTION_6_OPTIONS.some((opt) => s.startsWith(opt)))) {
    issues.push(`body: missing section 6 (one of: ${SECTION_6_OPTIONS.join(' | ')})`);
  }

  // Worker-specific
  if (isWorker) {
    if (hasTask) issues.push('worker: must NOT have Task tool (anti-bureaucracy)');
    // isolation: workers default to worktree, but read-only workers (researcher,
    // code-reviewer, design-critic, technical-writer) may declare isolation:none.
    // Treat isolation:none as acceptable on workers when they don't write app code.
    const writesAppCode = Array.isArray(fm.tools) && fm.tools.some((t) => ['Write', 'Edit'].includes(t));
    if (fm.isolation !== 'worktree' && fm.isolation !== 'none') {
      issues.push(`worker: isolation must be "worktree" or "none" (got "${fm.isolation}")`);
    }
    if (fm.isolation === 'none' && writesAppCode) {
      // Warning: this worker writes but isn't isolated — risk of cross-worker collision
      warnings++;
      checks.push('worker: isolation=none but worker writes/edits — collision risk if spawned in parallel');
    }
    // Worktree pattern: warn (not fail) when worker declares isolation:worktree
    // but body doesn't show the creation block. Some workers (review/audit/specialist)
    // legitimately work in-place even though isolation:worktree is declared as default.
    if (writesAppCode && fm.isolation === 'worktree' && !/MAIN_REPO=\$\(git worktree list/.test(text)) {
      warnings++;
      checks.push('worker: isolation=worktree but body lacks MAIN_REPO worktree-creation block — either include it or set isolation:none');
    }
    // Deviation Rules language — required for code-writing workers; warning for review/audit workers.
    // Accept any clear escalation/scope-boundary language as evidence the worker knows when to halt.
    const hasDeviationLanguage = /Deviation Rules|auto-fix|BLOCKED on architectural|return BLOCKED|return PARTIAL|architectural decision|DO NOT escalate|escalation criteria|halt and|out of scope/i.test(text);
    if (!hasDeviationLanguage) {
      if (writesAppCode) {
        issues.push('worker: body should mention Deviation Rules (auto-fix vs BLOCK on architectural decisions)');
      } else {
        warnings++;
        checks.push('worker: body should describe when to return BLOCKED vs PARTIAL (review-style equivalent of Deviation Rules)');
      }
    }
  }

  // C-suite-specific (warning, not fail)
  if (isCSuite) {
    if (typeof fm.maxTurns === 'number' && fm.maxTurns < 20) {
      warnings++;
      checks.push(`c-suite: maxTurns=${fm.maxTurns} low — consider 25-30`);
    }
  }

  // Length cap (warning)
  if (isWorker && lines > 350) { warnings++; checks.push(`worker: ${lines} lines (target 200-300)`); }
  if (isCSuite && lines > 500) { warnings++; checks.push(`c-suite: ${lines} lines (target 300-450)`); }
  if (isCEO && lines > 600) { warnings++; checks.push(`ceo: ${lines} lines (target 400-550)`); }

  const status = issues.length === 0 ? 'pass' : 'fail';
  return { path: filePath, status, issues, checks, warnings, lines, sections: sections.length };
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const targets = args.filter((a) => !a.startsWith('--'));

  let files;
  if (targets.length > 0) {
    files = targets;
  } else {
    files = fs.readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(AGENTS_DIR, f));
  }

  const results = files.map(lintFile);
  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const warnCount = results.reduce((s, r) => s + (r.warnings || 0), 0);

  if (jsonMode) {
    process.stdout.write(JSON.stringify({
      version: '1.0',
      summary: { pass: passCount, fail: failCount, warnings: warnCount, total: results.length },
      files: results,
    }, null, 2) + '\n');
  } else {
    for (const r of results) {
      const relPath = path.relative(REPO_ROOT, r.path);
      if (r.status === 'pass') {
        const warn = r.warnings > 0 ? ` (${r.warnings} warning${r.warnings === 1 ? '' : 's'})` : '';
        process.stdout.write(`✓ ${relPath} — ${r.lines} lines, ${r.sections} sections${warn}\n`);
        for (const c of (r.checks || [])) process.stdout.write(`    ${c}\n`);
      } else {
        process.stdout.write(`✗ ${relPath} — FAIL\n`);
        for (const issue of r.issues) process.stdout.write(`    - ${issue}\n`);
      }
    }
    process.stdout.write(`\nSummary: ${passCount} pass · ${failCount} fail · ${warnCount} warnings\n`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

try { main(); } catch (err) {
  process.stderr.write(`schema-lint: script error: ${err.message}\n`);
  process.exit(2);
}
