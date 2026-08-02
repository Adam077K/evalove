import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();

export const CONFIG = {
  port: 4200,
  clientDevPort: 4201,
  projectStateDir: join(HOME, '.{{project_name}}'),
  projectDir: join(HOME, 'VibeCoding', '{{PROJECT_NAME}}'),
  worktreesDir: join(HOME, 'VibeCoding', '{{PROJECT_NAME}}', '.worktrees'),
  claudeProjectsDir: join(HOME, '.claude', 'projects'),
  tmuxSession: '{{project_name}}',
  intervals: {
    state: 2000,
    tmux: 3000,
    events: 1000,
    context: 2000,
    git: 5000,
    cost: 10000,
    messages: 3000,
  },
  pricing: {
    sonnet: { input: 3.0, output: 15.0, cache_creation: 3.75, cache_read: 0.30 },
    opus: { input: 5.0, output: 25.0, cache_creation: 6.25, cache_read: 0.50 },
    haiku: { input: 1.0, output: 5.0, cache_creation: 1.25, cache_read: 0.10 },
  },
  ceoColors: ['#cba6f7', '#a6e3a1', '#89b4fa', '#f9e2af', '#f38ba8', '#94e2d5'],
} as const;
