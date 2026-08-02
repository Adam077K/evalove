import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config';
import type { CeoState } from './types';

export function collectState(): CeoState[] {
  const registryPath = join(CONFIG.worktreesDir, '.registry');
  if (!existsSync(registryPath)) return [];

  const registry = readFileSync(registryPath, 'utf-8').trim();
  if (!registry) return [];

  const ceos: CeoState[] = [];

  for (const line of registry.split('\n')) {
    const match = line.match(/^ceo-(\d+):(\d+)$/);
    if (!match) continue;

    const n = parseInt(match[1]);
    const startTs = parseInt(match[2]);
    const wtPath = join(CONFIG.worktreesDir, `ceo-${n}-${startTs}`);
    if (!existsSync(wtPath)) continue;

    const task = safeRead(join(CONFIG.worktreesDir, `ceo-${n}.task`));
    const sessionId = safeRead(join(CONFIG.worktreesDir, `ceo-${n}.session`));

    let priority: string | null = null;
    let domain: string | null = null;
    let dependsOn: string | null = null;

    const metaPath = join(CONFIG.worktreesDir, `ceo-${n}.meta`);
    if (existsSync(metaPath)) {
      for (const mline of readFileSync(metaPath, 'utf-8').split('\n')) {
        const eq = mline.indexOf('=');
        if (eq === -1) continue;
        const key = mline.slice(0, eq);
        const val = mline.slice(eq + 1).trim();
        if (key === 'priority' && val) priority = val;
        if (key === 'domain' && val) domain = val;
        if (key === 'depends_on' && val) dependsOn = val;
      }
    }

    ceos.push({
      n, status: 'active', task: task || '\u2014', branch: '',
      worktreePath: wtPath, startTs, sessionId,
      commits: 0, lastCommitMsg: '', changedFiles: [],
      costUsd: 0, contextUsedPct: null, model: 'claude-sonnet-4-6',
      priority, domain, dependsOn,
      messageCount: 0, blockerCount: 0,
      color: CONFIG.ceoColors[(n - 1) % CONFIG.ceoColors.length],
    });
  }
  return ceos;
}

function safeRead(path: string): string {
  try { return existsSync(path) ? readFileSync(path, 'utf-8').trim() : ''; }
  catch { return ''; }
}
