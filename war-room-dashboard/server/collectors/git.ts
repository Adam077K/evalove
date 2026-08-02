import type { CeoState, CommitEntry, FileConflict } from './types';

async function gitCmd(wtPath: string, args: string[]): Promise<string> {
  try {
    const proc = Bun.spawn(['git', '-C', wtPath, ...args], { stdout: 'pipe', stderr: 'pipe' });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    return out.trim();
  } catch { return ''; }
}

export async function collectGitData(ceos: CeoState[]): Promise<{
  recentCommits: CommitEntry[];
  fileConflicts: FileConflict[];
}> {
  const allCommits: CommitEntry[] = [];
  const fileOwners = new Map<string, number[]>();

  for (const ceo of ceos) {
    if (!ceo.worktreePath) continue;

    ceo.branch = (await gitCmd(ceo.worktreePath, ['branch', '--show-current'])) || '\u2014';
    ceo.commits = parseInt(await gitCmd(ceo.worktreePath, ['rev-list', '--count', 'main..HEAD'])) || 0;
    ceo.lastCommitMsg = await gitCmd(ceo.worktreePath, ['log', '-1', '--pretty=format:%s']);

    const files = (await gitCmd(ceo.worktreePath, ['diff', '--name-only', 'main...HEAD'])).split('\n').filter(Boolean);
    ceo.changedFiles = files;

    for (const f of files) {
      const owners = fileOwners.get(f) || [];
      owners.push(ceo.n);
      fileOwners.set(f, owners);
    }

    const log = await gitCmd(ceo.worktreePath, ['log', 'main..HEAD', '--pretty=format:%ct|%s', '--max-count=3']);
    for (const line of log.split('\n').filter(Boolean)) {
      const sep = line.indexOf('|');
      if (sep === -1) continue;
      allCommits.push({ ceoN: ceo.n, ts: parseInt(line.slice(0, sep)) || 0, message: line.slice(sep + 1), color: ceo.color });
    }
  }

  allCommits.sort((a, b) => b.ts - a.ts);

  const fileConflicts: FileConflict[] = [];
  for (const [file, owners] of fileOwners) {
    if (owners.length > 1) fileConflicts.push({ file, ceos: owners });
  }

  return { recentCommits: allCommits.slice(0, 10), fileConflicts };
}
