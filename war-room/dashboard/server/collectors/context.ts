import { readFileSync, existsSync } from 'fs';

export function collectContext(sessionId: string): number | null {
  if (!sessionId) return null;
  const bridge = `/tmp/claude-ctx-${sessionId}.json`;
  if (!existsSync(bridge)) return null;
  try {
    const d = JSON.parse(readFileSync(bridge, 'utf-8'));
    if (typeof d.used_pct === 'number') return d.used_pct;
    if (typeof d.remaining_percentage === 'number') return 100 - d.remaining_percentage;
    return null;
  } catch { return null; }
}
