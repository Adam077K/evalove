import { formatCost } from '../lib/format';

interface Props {
  cost: number;
}

export function CostBadge({ cost }: Props) {
  return (
    <span className="text-peach font-mono text-sm font-medium">
      {formatCost(cost)}
    </span>
  );
}
