import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config';
import type { EventEntry } from './types';

let lastSize = 0;

export function collectEvents(): EventEntry[] {
  const path = join(CONFIG.projectStateDir, 'events.jsonl');
  if (!existsSync(path)) return [];

  const size = statSync(path).size;
  if (size <= lastSize) return [];
  lastSize = size;

  return parseEventsFile(path);
}

export function getRecentEvents(limit = 50): EventEntry[] {
  const path = join(CONFIG.projectStateDir, 'events.jsonl');
  if (!existsSync(path)) return [];

  const events = parseEventsFile(path);
  return events.slice(-limit);
}

function parseEventsFile(path: string): EventEntry[] {
  const events: EventEntry[] = [];
  try {
    for (const line of readFileSync(path, 'utf-8').trim().split('\n')) {
      try {
        const d = JSON.parse(line);
        events.push({ ts: d.ts || 0, event: d.event || 'unknown', details: d.details || '' });
      } catch { continue; }
    }
  } catch { /* file read error */ }
  return events;
}
