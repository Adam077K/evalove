interface Props {
  status: 'active' | 'idle' | 'done' | 'dead';
}

export function StatusDot({ status }: Props) {
  const colors = {
    active: 'bg-green animate-pulse',
    idle: 'bg-overlay0',
    done: 'bg-teal',
    dead: 'bg-red',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
}
