export interface SubagentInfo {
  id: string;
  role: string;
  status: 'active' | 'idle' | 'done' | 'dead';
  task?: string;
  description?: string;
  color: string;
}

export interface CeoState {
  n: number;
  status: 'active' | 'idle' | 'done' | 'dead';
  task: string;
  branch: string;
  worktreePath: string;
  startTs: number;
  sessionId: string;
  commits: number;
  lastCommitMsg: string;
  changedFiles: string[];
  costUsd: number;
  contextUsedPct: number | null;
  model: string;
  priority: string | null;
  domain: string | null;
  dependsOn: string | null;
  messageCount: number;
  blockerCount: number;
  color: string;
  subagents?: SubagentInfo[];
}

export interface EventEntry {
  ts: number;
  event: string;
  details: string;
}

export interface CommitEntry {
  ceoN: number;
  ts: number;
  message: string;
  color: string;
}

export interface FileConflict {
  file: string;
  ceos: number[];
}

export interface WarRoomState {
  isRunning: boolean;
  ceos: CeoState[];
  totalCostUsd: number;
  recentCommits: CommitEntry[];
  fileConflicts: FileConflict[];
  recentEvents: EventEntry[];
}
