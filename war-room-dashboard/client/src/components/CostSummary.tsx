import { formatCost } from '../lib/format';
import type { CeoState } from '../lib/types';

interface Props {
  ceos: CeoState[];
  totalCost: number;
}

export function CostSummary({ ceos, totalCost }: Props) {
  return (
    <div className="bg-surface0 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-peach">Cost</h3>
        <span className="text-peach font-mono text-lg font-bold">{formatCost(totalCost)}</span>
      </div>
      <div className="space-y-1">
        {ceos.sort((a, b) => b.costUsd - a.costUsd).map((ceo) => (
          <div key={ceo.n} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ceo.color }} />
              <span className="text-subtext0">CEO-{ceo.n}</span>
            </div>
            <span className="font-mono text-text">{formatCost(ceo.costUsd)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
