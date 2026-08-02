import { CONFIG } from '../config';

async function run(cmd: string[]): Promise<{ ok: boolean; stdout: string }> {
  try {
    const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' });
    const stdout = await new Response(proc.stdout).text();
    const code = await proc.exited;
    return { ok: code === 0, stdout };
  } catch {
    return { ok: false, stdout: '' };
  }
}

export async function isTmuxRunning(): Promise<boolean> {
  const r = await run(['tmux', 'has-session', '-t', CONFIG.tmuxSession]);
  return r.ok;
}

export async function collectTmuxStatus(): Promise<Map<number, 'active' | 'idle' | 'dead'>> {
  const statuses = new Map<number, 'active' | 'idle' | 'dead'>();

  if (!(await isTmuxRunning())) return statuses;

  const wResult = await run(['tmux', 'list-windows', '-t', CONFIG.tmuxSession, '-F', '#{window_name}']);
  if (!wResult.ok) return statuses;

  const windows = wResult.stdout.trim().split('\n').filter(w => w.startsWith('CEO-'));

  for (const wname of windows) {
    const n = parseInt(wname.replace('CEO-', ''));
    if (isNaN(n)) continue;

    const dead = await run(['tmux', 'display-message', '-t', `${CONFIG.tmuxSession}:${wname}.1`, '-p', '#{pane_dead}']);
    if (dead.stdout.trim() === '1') { statuses.set(n, 'dead'); continue; }

    const cap = await run(['tmux', 'capture-pane', '-t', `${CONFIG.tmuxSession}:${wname}`, '-p', '-S', '-3']);
    const lines = cap.stdout.replace(/\s+$/gm, '');
    statuses.set(n, /(?:❯ |> )$/.test(lines) ? 'idle' : 'active');
  }
  return statuses;
}
