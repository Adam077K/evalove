import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../config';

export interface SubagentInfo {
  id: string;
  parentId: string;
  ceoN: number;
  layer: 2 | 3;
  role: string;
  status: 'spawning' | 'active' | 'idle' | 'done';
  description: string;
  spawnedAt: number;
  color: string;
}

const LEAD_ROLES = new Set([
  'build-lead', 'research-lead', 'design-lead', 'qa-lead', 'devops-lead',
  'data-lead', 'product-lead', 'growth-lead', 'business-lead',
]);

function encodePath(p: string): string {
  return '-' + p.replace(/^\//, '').replace(/\//g, '-');
}

function deriveColor(hexColor: string, layer: 2 | 3): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const factor = layer === 2 ? 0.25 : 0.45;
  return `rgb(${Math.round(r + (255 - r) * factor)},${Math.round(g + (255 - g) * factor)},${Math.round(b + (255 - b) * factor)})`;
}

// Cache to avoid re-parsing unchanged files
const cache = new Map<string, { mtime: number; agents: SubagentInfo[] }>();

export function collectSubagents(sessionId: string, worktreePath: string, ceoN: number, ceoColor: string): SubagentInfo[] {
  if (!sessionId) return [];

  // Find session JSONL
  const encodedWt = encodePath(worktreePath);
  const encodedMain = encodePath(CONFIG.projectDir);
  const wtCandidate = join(CONFIG.claudeProjectsDir, encodedWt, `${sessionId}.jsonl`);
  const mainCandidate = join(CONFIG.claudeProjectsDir, encodedMain, `${sessionId}.jsonl`);

  const jsonlPath = existsSync(wtCandidate) ? wtCandidate : existsSync(mainCandidate) ? mainCandidate : '';
  if (!jsonlPath) return [];

  // Check cache
  const stat = statSync(jsonlPath);
  const cached = cache.get(jsonlPath);
  if (cached && cached.mtime === stat.mtimeMs) return cached.agents;

  // Skip huge files
  if (stat.size > 20 * 1024 * 1024) return [];

  const content = readFileSync(jsonlPath, 'utf-8');
  const lines = content.split('\n');

  // Track agent tool calls
  const agentCalls = new Map<string, { role: string; description: string; spawnedAt: number }>();
  const completedCalls = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const d = JSON.parse(line);

      // Detect Agent tool_use in assistant messages
      if (d.type === 'assistant' && d.message?.content) {
        for (const block of d.message.content) {
          if (block.type === 'tool_use' && block.name === 'Agent') {
            const input = block.input || {};
            const role = input.subagent_type || input.name || 'general-purpose';
            const description = input.description || input.prompt?.slice(0, 50) || '';
            agentCalls.set(block.id, {
              role: (role as string).toLowerCase(),
              description,
              spawnedAt: Math.floor(Date.now() / 1000), // approximate
            });
          }
        }
      }

      // Detect tool_result (agent completed)
      if (d.type === 'tool_result' || (d.type === 'human' && d.message?.content)) {
        const content = d.message?.content || d.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'tool_result' && agentCalls.has(block.tool_use_id)) {
              completedCalls.add(block.tool_use_id);
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  // Build subagent list
  const agents: SubagentInfo[] = [];
  for (const [id, info] of agentCalls) {
    const isLead = LEAD_ROLES.has(info.role);
    const layer: 2 | 3 = isLead ? 2 : 3;
    const isDone = completedCalls.has(id);

    agents.push({
      id,
      parentId: `ceo-${ceoN}`,
      ceoN,
      layer,
      role: info.role,
      status: isDone ? 'done' : 'active',
      description: info.description,
      spawnedAt: info.spawnedAt,
      color: deriveColor(ceoColor, layer),
    });
  }

  // Filter: only show active subagents (not completed ones)
  const activeAgents = agents.filter(a => a.status !== 'done');

  cache.set(jsonlPath, { mtime: stat.mtimeMs, agents: activeAgents });
  return activeAgents;
}
