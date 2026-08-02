import type { FileConflict } from '../lib/types';

interface Props {
  conflicts: FileConflict[];
}

export function FileConflicts({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-red/10 border border-red/20 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-red mb-2">
        File Conflicts ({conflicts.length})
      </h3>
      <div className="space-y-1">
        {conflicts.map((c, i) => (
          <div key={i} className="text-xs flex gap-2">
            <span className="text-red font-mono truncate">{c.file}</span>
            <span className="text-subtext0 shrink-0">
              CEO-{c.ceos.join(', CEO-')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
