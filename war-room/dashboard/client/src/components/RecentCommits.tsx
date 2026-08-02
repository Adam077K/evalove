import { formatTimeAgo } from '../lib/format';
import type { CommitEntry } from '../lib/types';

interface Props {
  commits: CommitEntry[];
}

export function RecentCommits({ commits }: Props) {
  return (
    <div className="bg-surface0 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-peach mb-3">Recent Commits</h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {commits.length === 0 ? (
          <p className="text-overlay0 text-xs">No commits yet</p>
        ) : (
          commits.map((c, i) => (
            <div key={i} className="flex gap-2 text-xs items-start">
              <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-text truncate">{c.message}</span>
              <span className="text-overlay0 shrink-0">{formatTimeAgo(c.ts)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
