import type { CeoState } from '../lib/types';
import { ZONE_TARGETS } from './map';

// CEO office zone names mapped by CEO number (1-6)
const CEO_OFFICE_ZONES: Record<number, string> = {
  1: 'ceo-1',
  2: 'ceo-2',
  3: 'ceo-3',
  4: 'ceo-4',
  5: 'ceo-5',
  6: 'ceo-6',
};

// Map CEO status to office zone
export function getZoneForCeo(ceo: CeoState): string {
  if (ceo.status === 'dead') return 'entrance';
  if (ceo.status === 'done') return 'entrance';
  if (ceo.status === 'idle') return 'coffee';

  if (ceo.status === 'active') {
    const taskLower = (ceo.task || '').toLowerCase();

    if (ceo.contextUsedPct !== null && ceo.contextUsedPct > 50) {
      return CEO_OFFICE_ZONES[ceo.n] ?? 'warroom';
    }

    if (ceo.dependsOn) return 'meeting';

    if (ceo.changedFiles.length > 3) {
      return CEO_OFFICE_ZONES[ceo.n] ?? 'warroom';
    }

    if (
      taskLower.includes('research') ||
      taskLower.includes('search') ||
      taskLower.includes('find')
    ) {
      return 'research';
    }

    if (
      taskLower.includes('test') ||
      taskLower.includes('deploy') ||
      taskLower.includes('run')
    ) {
      return 'devops';
    }

    if (
      taskLower.includes('plan') ||
      taskLower.includes('design') ||
      taskLower.includes('architect')
    ) {
      return 'warroom';
    }

    if (
      taskLower.includes('build') ||
      taskLower.includes('code') ||
      taskLower.includes('implement') ||
      taskLower.includes('fix')
    ) {
      return 'build';
    }

    return CEO_OFFICE_ZONES[ceo.n] ?? 'warroom';
  }

  return 'coffee';
}

// Get a specific target position within a zone — returns percentage coordinates
export function getTargetForCeo(
  ceo: CeoState,
  zone: string,
): { xPct: number; yPct: number } {
  const targets = ZONE_TARGETS.filter((t) => t.zone === zone);
  if (targets.length === 0) return { xPct: 42, yPct: 28 }; // fallback center (war room)

  const idx = (ceo.n - 1) % targets.length;
  return { xPct: targets[idx].xPct, yPct: targets[idx].yPct };
}

// Get zone for a subagent based on its role
export function getZoneForSubagent(role: string): string {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('build') || roleLower.includes('backend') || roleLower.includes('frontend')) {
    return 'build';
  }
  if (roleLower.includes('design')) return 'design';
  if (roleLower.includes('research')) return 'research';
  if (roleLower.includes('qa') || roleLower.includes('test')) return 'meeting';
  if (roleLower.includes('devops') || roleLower.includes('deploy') || roleLower.includes('infra')) {
    return 'devops';
  }
  if (roleLower.includes('meet') || roleLower.includes('plan')) return 'meeting';

  return 'warroom';
}
