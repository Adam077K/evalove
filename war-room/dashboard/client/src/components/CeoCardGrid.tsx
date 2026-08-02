import { CeoCard } from './CeoCard';
import type { CeoState } from '../lib/types';

interface Props {
  ceos: CeoState[];
}

export function CeoCardGrid({ ceos }: Props) {
  if (ceos.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-overlay0">
        No active CEOs
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {ceos.sort((a, b) => a.n - b.n).map((ceo) => (
        <CeoCard key={ceo.n} ceo={ceo} />
      ))}
    </div>
  );
}
