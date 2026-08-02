import { formatTime } from '../lib/format';
import type { EventEntry } from '../lib/types';

const EVENT_COLORS: Record<string, string> = {
  war_room_start: 'text-green',
  war_room_kill: 'text-red',
  war_room_restore: 'text-blue',
  ceo_spawn: 'text-green',
  ceo_add: 'text-green',
  ceo_done: 'text-teal',
  merge_complete: 'text-yellow',
  message_send: 'text-lavender',
  message_broadcast: 'text-lavender',
};

interface Props {
  events: EventEntry[];
}

export function EventTimeline({ events }: Props) {
  return (
    <div className="bg-surface0 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-peach mb-3">Events</h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-overlay0 text-xs">No events</p>
        ) : (
          [...events].reverse().map((evt, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-overlay0 font-mono shrink-0">{formatTime(evt.ts)}</span>
              <span className={`font-medium shrink-0 ${EVENT_COLORS[evt.event] || 'text-subtext0'}`}>
                {evt.event}
              </span>
              <span className="text-subtext0 truncate">{evt.details}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
