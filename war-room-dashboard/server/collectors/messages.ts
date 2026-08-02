import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config';

export function collectMessages(ceoN: number): { count: number; blockerCount: number } {
  const path = join(CONFIG.projectStateDir, 'messages', `ceo-${ceoN}.jsonl`);
  if (!existsSync(path)) return { count: 0, blockerCount: 0 };
  try {
    const lines = readFileSync(path, 'utf-8').trim().split('\n').filter(Boolean);
    let blockers = 0;
    for (const line of lines) {
      try { if (JSON.parse(line).type === 'blocker') blockers++; } catch { /* skip */ }
    }
    return { count: lines.length, blockerCount: blockers };
  } catch { return { count: 0, blockerCount: 0 }; }
}
