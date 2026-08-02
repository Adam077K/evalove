interface Props {
  usedPct: number | null;
}

export function ContextBar({ usedPct }: Props) {
  if (usedPct === null) return <span className="text-overlay0 text-xs">ctx: —</span>;

  let barColor = 'bg-green';
  if (usedPct > 60) barColor = 'bg-yellow';
  if (usedPct > 80) barColor = 'bg-peach';
  if (usedPct > 95) barColor = 'bg-red';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-overlay0 w-8">{usedPct}%</span>
      <div className="flex-1 h-1.5 bg-surface0 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${usedPct}%` }} />
      </div>
    </div>
  );
}
