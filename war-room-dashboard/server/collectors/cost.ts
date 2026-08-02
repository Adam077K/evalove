import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config';

interface CostData {
  costUsd: number;
  model: string;
}

const cache = new Map<string, { mtime: number; data: CostData }>();

function encodePath(p: string): string {
  return '-' + p.replace(/^\//, '').replace(/\//g, '-');
}

function detectTier(model: string): 'sonnet' | 'opus' | 'haiku' {
  const m = model.toLowerCase();
  if (m.includes('opus')) return 'opus';
  if (m.includes('haiku')) return 'haiku';
  return 'sonnet';
}

export function collectCost(sessionId: string, worktreePath: string): CostData {
  if (!sessionId) return { costUsd: 0, model: '' };

  const wtCandidate = join(CONFIG.claudeProjectsDir, encodePath(worktreePath), `${sessionId}.jsonl`);
  const mainCandidate = join(CONFIG.claudeProjectsDir, encodePath(CONFIG.projectDir), `${sessionId}.jsonl`);

  const jsonlPath = existsSync(wtCandidate) ? wtCandidate : existsSync(mainCandidate) ? mainCandidate : '';
  if (!jsonlPath) return { costUsd: 0, model: '' };

  const stat = statSync(jsonlPath);
  const cached = cache.get(jsonlPath);
  if (cached && cached.mtime === stat.mtimeMs) return cached.data;
  if (stat.size > 20 * 1024 * 1024) return { costUsd: 0, model: '' };

  let inp = 0, out = 0, cc = 0, cr = 0, model = 'claude-sonnet-4-6';

  for (const line of readFileSync(jsonlPath, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const d = JSON.parse(line);
      if (d.type !== 'assistant') continue;
      const msg = d.message || {};
      if (msg.model) model = msg.model;
      const u = msg.usage || {};
      inp += u.input_tokens || 0;
      out += u.output_tokens || 0;
      cc += u.cache_creation_input_tokens || 0;
      cr += u.cache_read_input_tokens || 0;
    } catch { continue; }
  }

  const p = CONFIG.pricing[detectTier(model)];
  const costUsd = (inp / 1e6) * p.input + (out / 1e6) * p.output + (cc / 1e6) * p.cache_creation + (cr / 1e6) * p.cache_read;

  const data = { costUsd, model };
  cache.set(jsonlPath, { mtime: stat.mtimeMs, data });
  return data;
}
