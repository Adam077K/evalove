import { StatusDot } from './StatusDot';
import { ContextBar } from './ContextBar';
import { CostBadge } from './CostBadge';
import { formatElapsed } from '../lib/format';
import type { CeoState } from '../lib/types';

interface Props {
  ceo: CeoState;
}

export function CeoCard({ ceo }: Props) {
  const priorityColors: Record<string, string> = {
    P1: 'text-red bg-red/10',
    P2: 'text-peach bg-peach/10',
    P3: 'text-overlay0 bg-surface0',
  };

  return (
    <div
      className="bg-surface0 rounded-lg p-4 border-l-4 hover:bg-surface1 transition-colors"
      style={{ borderLeftColor: ceo.color }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={ceo.status} />
          <span className="font-semibold text-text">CEO-{ceo.n}</span>
          {ceo.priority && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${priorityColors[ceo.priority] || ''}`}>
              {ceo.priority}
            </span>
          )}
          {ceo.domain && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface1 text-subtext0">
              {ceo.domain}
            </span>
          )}
        </div>
        <CostBadge cost={ceo.costUsd} />
      </div>

      {/* Task */}
      <p className="text-sm text-subtext1 mb-2 truncate">{ceo.task}</p>

      {/* Branch + Commits */}
      <div className="flex items-center gap-3 text-xs text-overlay0 mb-2">
        <span className="font-mono truncate max-w-[180px]">{ceo.branch}</span>
        <span>{ceo.commits} commit{ceo.commits !== 1 ? 's' : ''}</span>
        <span>{formatElapsed(ceo.startTs)}</span>
      </div>

      {/* Context Bar */}
      <ContextBar usedPct={ceo.contextUsedPct} />

      {/* Footer: Messages + Last Commit */}
      <div className="mt-2 flex items-center justify-between text-xs">
        {ceo.messageCount > 0 ? (
          <span className={ceo.blockerCount > 0 ? 'text-red' : 'text-overlay0'}>
            {ceo.messageCount} msg{ceo.messageCount !== 1 ? 's' : ''}
            {ceo.blockerCount > 0 && ` (${ceo.blockerCount} blocker${ceo.blockerCount !== 1 ? 's' : ''})`}
          </span>
        ) : (
          <span />
        )}
        {ceo.lastCommitMsg && (
          <span className="text-overlay0 truncate max-w-[200px]" title={ceo.lastCommitMsg}>
            {ceo.lastCommitMsg}
          </span>
        )}
      </div>
    </div>
  );
}
