export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function formatElapsed(startTs: number): string {
  const elapsed = Math.floor(Date.now() / 1000) - startTs;
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
  return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
}

export function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatTimeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000) - ts;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
