#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PKG_DIR = path.resolve(__dirname, '..');
const { version } = require('../package.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const flags = {
  claude:       has('--claude'),
  cursor:       has('--cursor'),
  antigravity:  has('--antigravity') || has('--ag'),
  all:          has('--all'),
  global:       has('--global') || has('-g'),
  force:        has('--force'),
  dryRun:       has('--dry-run'),
  help:         has('--help') || has('-h'),
  version:      has('--version') || has('-v'),
};

if (flags.all) {
  flags.claude = flags.cursor = flags.antigravity = true;
}

const interactive = !flags.claude && !flags.cursor && !flags.antigravity;

// ── Colors ────────────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
};

const log = {
  info:    (msg) => console.log(`${c.blue}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`),
  warn:    (msg) => console.log(`  ${c.yellow}⚠${c.reset} ${msg}`),
  error:   (msg) => console.error(`${c.red}✗${c.reset} ${msg}`),
  dry:     (msg) => console.log(`  ${c.dim}[dry]${c.reset} ${msg}`),
  section: (title) => console.log(`\n${c.bold}${c.cyan}▸ ${title}${c.reset}`),
};

// ── File helpers ──────────────────────────────────────────────────────────────
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db', '.gitkeep']);

function copyDir(src, dest, force, dryRun) {
  // Resolve symlinks so both real dirs and symlinked dirs are traversed
  const realSrc = fs.existsSync(src) ? fs.realpathSync(src) : null;
  if (!realSrc) {
    log.warn(`Source not found: ${rel(src)}`);
    return;
  }
  for (const entry of fs.readdirSync(realSrc, { withFileTypes: true })) {
    if (SKIP_FILES.has(entry.name)) continue;
    const srcPath = path.join(realSrc, entry.name);
    const destPath = path.join(dest, entry.name);
    // Follow symlinks when checking type
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!dryRun) fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath, force, dryRun);
    } else {
      copyFile(srcPath, destPath, force, dryRun);
    }
  }
}

function copyFile(src, dest, force, dryRun) {
  if (!fs.existsSync(src)) {
    log.warn(`Source not found: ${rel(src)}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log.warn(`Skip (exists): ${rel(dest)}`);
    return;
  }
  if (dryRun) {
    log.dry(rel(dest));
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  log.success(rel(dest));
}

// Copy a file with string replacements applied to its content (text files only)
function copyFileAdapted(src, dest, force, dryRun, replacements) {
  if (!fs.existsSync(src)) { log.warn(`Source not found: ${rel(src)}`); return; }
  if (fs.existsSync(dest) && !force) { log.warn(`Skip (exists): ${rel(dest)}`); return; }
  if (dryRun) { log.dry(rel(dest)); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let content = fs.readFileSync(src, 'utf8');
  for (const [from, to] of Object.entries(replacements)) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(dest, content, 'utf8');
  log.success(rel(dest));
}

// Recursively copy a directory, applying text replacements to every file
function copyDirAdapted(src, dest, force, dryRun, replacements) {
  const realSrc = fs.existsSync(src) ? fs.realpathSync(src) : null;
  if (!realSrc) { log.warn(`Source not found: ${rel(src)}`); return; }
  for (const entry of fs.readdirSync(realSrc, { withFileTypes: true })) {
    if (SKIP_FILES.has(entry.name)) continue;
    const srcPath = path.join(realSrc, entry.name);
    const destPath = path.join(dest, entry.name);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!dryRun) fs.mkdirSync(destPath, { recursive: true });
      copyDirAdapted(srcPath, destPath, force, dryRun, replacements);
    } else {
      copyFileAdapted(srcPath, destPath, force, dryRun, replacements);
    }
  }
}

function createTemplate(dest, content, dryRun) {
  if (fs.existsSync(dest)) return; // Never overwrite memory files
  if (dryRun) { log.dry(rel(dest)); return; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  log.success(rel(dest));
}

function rel(p) {
  return path.relative(process.cwd(), p);
}

// ── Install targets ───────────────────────────────────────────────────────────
function installClaude(targetDir, force, dryRun) {
  log.section('Claude Code');
  const src = path.join(PKG_DIR, '.claude');
  const dest = path.join(targetDir, '.claude');

  copyDir(path.join(src, 'agents'),        path.join(dest, 'agents'),        force, dryRun);
  copyDir(path.join(src, 'commands'),      path.join(dest, 'commands'),      force, dryRun);
  copyDir(path.join(src, 'get-shit-done'), path.join(dest, 'get-shit-done'), force, dryRun);
  copyDir(path.join(src, 'hooks'),         path.join(dest, 'hooks'),         force, dryRun);

  copyFile(path.join(src, 'package.json'), path.join(dest, 'package.json'), force, dryRun);
  copyFile(path.join(src, 'settings.json'), path.join(dest, 'settings.json'), false, dryRun);

  // Root files (don't overwrite existing)
  copyFile(path.join(PKG_DIR, 'CLAUDE.md'),      path.join(targetDir, 'CLAUDE.md'),      false, dryRun);
  copyFile(path.join(PKG_DIR, 'AGENTS.md'),      path.join(targetDir, 'AGENTS.md'),      false, dryRun);
  copyFile(path.join(PKG_DIR, 'SKILLS_SOURCE.md'), path.join(targetDir, 'SKILLS_SOURCE.md'), false, dryRun);

  // skills — placeholder dir; install 426+ skills here via antigravity-awesome-skills
  const skillsDest = path.join(dest, 'skills');
  if (!dryRun) fs.mkdirSync(skillsDest, { recursive: true });
  log.info(`Skills not bundled (55MB+). Install to .claude/skills/ with:`);
  log.info(`  ${c.cyan}npx antigravity-awesome-skills --path ${skillsDest}${c.reset}`);

  // Empty memory templates
  const mem = path.join(dest, 'memory');
  const templates = [
    ['DECISIONS.md',   '# Architecture & Strategy Decisions\n\n*Updated by agents when making decisions that affect others.*\n\n---\n'],
    ['CODEBASE-MAP.md','# Codebase Map\n\n*Updated by Scout after audits.*\n\n---\n'],
    ['USER-INSIGHTS.md','# User Insights\n\n*Updated by Rex after user research.*\n\n---\n'],
  ];
  for (const [file, content] of templates) {
    createTemplate(path.join(mem, file), content, dryRun);
  }
}

function installCursor(targetDir, force, dryRun) {
  log.section('Cursor');
  copyDir(
    path.join(PKG_DIR, '.cursor', 'rules'),
    path.join(targetDir, '.cursor', 'rules'),
    force, dryRun
  );
}

function installAntigravity(targetDir, force, dryRun) {
  log.section('Antigravity / Cursor / Windsurf  (.agent/)');
  const dest = path.join(targetDir, '.agent');

  // agents — copy from .claude/agents/ (source of truth) and translate paths:
  //   .claude/skills/  → .agent/skills/
  //   .claude/memory/  → .agent/memory/
  //   .claude/agents/  → .agent/agents/
  const AGENT_PATH_MAP = {
    '.claude/skills/':  '.agent/skills/',
    '.claude/memory/':  '.agent/memory/',
    '.claude/agents/':  '.agent/agents/',
  };
  copyDirAdapted(
    path.join(PKG_DIR, '.claude', 'agents'),
    path.join(dest, 'agents'),
    force, dryRun, AGENT_PATH_MAP
  );

  // workflows and rules — straight copy (referenced via .claude/ paths; Claude Code feature)
  copyDir(path.join(PKG_DIR, '.agent', 'workflows'), path.join(dest, 'workflows'), force, dryRun);
  copyDir(path.join(PKG_DIR, '.agent', 'rules'),     path.join(dest, 'rules'),     force, dryRun);

  // memory — empty templates (never overwrite existing)
  const memTemplates = [
    ['DECISIONS.md',    '# Architecture & Strategy Decisions\n\n*Updated by agents when making decisions that affect others.*\n\n---\n'],
    ['CODEBASE-MAP.md', '# Codebase Map\n\n*Updated by Scout after audits.*\n\n---\n'],
    ['USER-INSIGHTS.md','# User Insights\n\n*Updated by Rex after user research.*\n\n---\n'],
  ];
  for (const [file, content] of memTemplates) {
    createTemplate(path.join(dest, 'memory', file), content, dryRun);
  }

  // skills — installed separately (too large for npm package)
  const skillsDest = path.join(dest, 'skills');
  if (!dryRun) fs.mkdirSync(skillsDest, { recursive: true });
  log.info(`Skills not bundled (55MB+). Install separately:`);
  log.info(`  ${c.cyan}npx antigravity-awesome-skills --path ${skillsDest}${c.reset}`);
}

// ── Help ──────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${c.bold}${c.cyan}GSA Startup Kit${c.reset} v${version}
AI Agent Kit for Claude Code, Cursor & Antigravity

${c.bold}USAGE${c.reset}
  npx gsa-startup-kit [options]

${c.bold}TARGET${c.reset}
  ${c.cyan}--claude${c.reset}        Install for Claude Code  (.claude/)
  ${c.cyan}--cursor${c.reset}        Install for Cursor       (.cursor/rules/)
  ${c.cyan}--antigravity${c.reset}   Install for Antigravity  (.agent/)
  ${c.cyan}--all${c.reset}           Install for all tools

${c.bold}OPTIONS${c.reset}
  ${c.cyan}--global, -g${c.reset}    Install to home directory (all projects)
  ${c.cyan}--local, -l${c.reset}     Install to current project (default)
  ${c.cyan}--force${c.reset}         Overwrite existing files
  ${c.cyan}--dry-run${c.reset}       Preview without making changes
  ${c.cyan}--version, -v${c.reset}   Show version
  ${c.cyan}--help, -h${c.reset}      Show this help

${c.bold}EXAMPLES${c.reset}
  npx gsa-startup-kit                    # interactive
  npx gsa-startup-kit --claude --local   # Claude Code, current project
  npx gsa-startup-kit --all              # all tools
  npx gsa-startup-kit --cursor --force   # Cursor, overwrite existing
  npx gsa-startup-kit --claude --global  # Claude Code, all projects
`);
}

// ── Interactive ───────────────────────────────────────────────────────────────
async function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function runInteractive(targetDir) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\n${c.bold}${c.cyan}GSA Startup Kit${c.reset} v${version}`);
  console.log(`${c.dim}AI Agent Kit for Claude Code, Cursor & Antigravity${c.reset}\n`);

  const toolAnswer = await ask(rl,
    `Which tool?\n  ${c.cyan}1${c.reset} Claude Code  ${c.cyan}2${c.reset} Cursor  ${c.cyan}3${c.reset} Antigravity  ${c.cyan}4${c.reset} All\n→ `
  );
  const forceAnswer = await ask(rl, `Overwrite existing files? ${c.dim}(y/N)${c.reset} `);
  rl.close();

  const toolMap = { '1': 'claude', '2': 'cursor', '3': 'antigravity', '4': 'all', 'all': 'all' };
  const tool = toolMap[toolAnswer.trim().toLowerCase()] || 'all';
  const force = forceAnswer.trim().toLowerCase() === 'y';

  if (tool === 'claude'      || tool === 'all') installClaude(targetDir,      force, false);
  if (tool === 'cursor'      || tool === 'all') installCursor(targetDir,      force, false);
  if (tool === 'antigravity' || tool === 'all') installAntigravity(targetDir, force, false);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (flags.version) { console.log(`gsa-startup-kit v${version}`); return; }
  if (flags.help)    { printHelp(); return; }

  if (flags.dryRun) {
    console.log(`\n${c.yellow}Dry run — no files will be written${c.reset}`);
  }

  const targetDir = flags.global
    ? (process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH)
    : process.cwd();

  if (interactive) {
    await runInteractive(targetDir);
  } else {
    if (flags.claude)       installClaude(targetDir,      flags.force, flags.dryRun);
    if (flags.cursor)       installCursor(targetDir,      flags.force, flags.dryRun);
    if (flags.antigravity)  installAntigravity(targetDir, flags.force, flags.dryRun);
  }

  if (!flags.dryRun) {
    console.log(`\n${c.green}${c.bold}Done!${c.reset} Open in Claude Code, Cursor, or Antigravity.\n`);
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
