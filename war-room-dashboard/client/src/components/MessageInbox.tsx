import { formatTime } from '../lib/format';

interface MessageEntry {
  ts: number;
  type: string;
  msg: string;
}

interface Props {
  ceoN: number;
  messages: MessageEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  blocker: 'text-red bg-red/10',
  task: 'text-peach bg-peach/10',
  merge_ready: 'text-green bg-green/10',
  question: 'text-yellow bg-yellow/10',
  status: 'text-subtext0 bg-surface1',
  info: 'text-subtext0 bg-surface1',
};

export function MessageInbox({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-1">
      {messages.slice(-10).reverse().map((msg, i) => (
        <div key={i} className="flex gap-2 text-xs items-center">
          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${TYPE_COLORS[msg.type] || ''}`}>
            {msg.type.toUpperCase()}
          </span>
          <span className="text-overlay0 shrink-0">{formatTime(msg.ts)}</span>
          <span className="text-subtext1 truncate">{msg.msg}</span>
        </div>
      ))}
    </div>
  );
}
