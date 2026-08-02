# war-room/ — Multi-CEO tmux templates

Source of truth for the multi-CEO tmux war-room. Installed into a new project
by `bin/install-war-room.sh` (called from `bin/init-from-template.sh` or `~/bin/newproject`).

## What gets installed

| Template | Installed location | Purpose |
|---|---|---|
| `bin/PROJECT_NAME.tmpl` | `~/bin/<project_name>` | Main launcher (2768 LOC bash). Subcommands: `[N]`, `add`, `done N`, `kill`, `ls`, `task N "label"`, `grid`, `restore`, `--bare`, `send`, `broadcast`, `diff N`, `merge N`, `inbox`, `files`, `history`, `log`, `cost`, `events`, `brief`. |
| `tmux/PROJECT_NAME-hq.tmpl` | `~/.tmux/scripts/<project_name>-hq.sh` | HQ dashboard render loop (Catppuccin-themed status pane) |
| `tmux/PROJECT_NAME-status.tmpl` | `~/.tmux/scripts/<project_name>-status.sh` | Status bar right-side script (CEO count + time) |
| `tmux/PROJECT_NAME-scratchpad.tmpl` | `~/.tmux/scripts/<project_name>-scratchpad.sh` | Per-CEO 9-line context panel at pane bottom |
| `tmux/PROJECT_NAME-colors.tmpl` | `~/.tmux/scripts/<project_name>-colors.sh` | Catppuccin Mocha color palette (sourced by other scripts) |
| `dashboard/` | `<project_dir>/war-room-dashboard/` | Hono+Vite+WebSocket live web dashboard. Reads tmux state + per-CEO cost/context/messages/blockers. `bun install && bun run dev` → http://localhost:4200 |
| _(created)_ | `~/.<project_name>/` | Runtime state dir: `last.json` snapshot, `snapshots/`, `events.jsonl`, `messages/ceo-N.jsonl` |

## Placeholders

Three are substituted at install time:
- `{{PROJECT_NAME}}` → display name (e.g. `Acme`)
- `{{project_name}}` → command + slug (e.g. `acme`) — used in `SESSION=`, paths, filenames
- `{{PROJECT_NAME_UPPER}}` → all-caps banner strings (e.g. `ACME`)

## Re-install / update

Safe to re-run. Existing installs are overwritten in place; runtime state in
`~/.<project>/` is preserved.

```bash
cd <project_dir>
bash bin/install-war-room.sh <project_name> [PROJECT_NAME]
```

## Provenance

Templated from Beamix's live war-room stack on 2026-05-25. The Beamix-specific
versions remain at `~/bin/beamix`, `~/.tmux/scripts/beamix-*.sh`,
`~/.beamix/`, and `~/VibeCoding/Beamix/war-room-dashboard/` — those are the
live Beamix install, not the template. Edit them only for Beamix-specific
changes; merge generic improvements back into `war-room/` here.
