import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { CONFIG } from './config';
import { initDb } from './db';
import { broadcaster, type WsData } from './ws';
import { createApiRoutes } from './routes/api';
import { collectState } from './collectors/state';
import { collectTmuxStatus, isTmuxRunning } from './collectors/tmux';
import { collectGitData } from './collectors/git';
import { getRecentEvents } from './collectors/events';
import { collectCost } from './collectors/cost';
import { collectContext } from './collectors/context';
import { collectMessages } from './collectors/messages';
import type { WarRoomState, CeoState } from './collectors/types';

const app = new Hono();
initDb();

app.use('/api/*', cors({ origin: `http://localhost:${CONFIG.clientDevPort}` }));
app.route('/api', createApiRoutes());

if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './client/dist' }));
}

let currentState: WarRoomState = {
  isRunning: false, ceos: [], totalCostUsd: 0,
  recentCommits: [], fileConflicts: [], recentEvents: [],
};

async function runCollectors() {
  const running = await isTmuxRunning();

  if (running) {
    const ceos = collectState();
    const statuses = await collectTmuxStatus();
    const gitData = await collectGitData(ceos);

    for (const ceo of ceos) {
      ceo.status = statuses.get(ceo.n) || 'active';
      const cost = collectCost(ceo.sessionId, ceo.worktreePath);
      ceo.costUsd = cost.costUsd;
      if (cost.model) ceo.model = cost.model;
      ceo.contextUsedPct = collectContext(ceo.sessionId);
      const msgs = collectMessages(ceo.n);
      ceo.messageCount = msgs.count;
      ceo.blockerCount = msgs.blockerCount;
    }

    currentState = {
      isRunning: true, ceos,
      totalCostUsd: ceos.reduce((s, c) => s + c.costUsd, 0),
      recentCommits: gitData.recentCommits,
      fileConflicts: gitData.fileConflicts,
      recentEvents: getRecentEvents(30),
    };
  } else {
    currentState = {
      isRunning: false, ceos: [], totalCostUsd: 0,
      recentCommits: [], fileConflicts: [],
      recentEvents: getRecentEvents(30),
    };
  }

  broadcaster.broadcast('state', currentState);
}

app.get('/api/state', (c) => c.json(currentState));

// Initial load + interval
setTimeout(runCollectors, 500);
setInterval(runCollectors, CONFIG.intervals.state);

console.log(`\n  \u{1F3AF} {{PROJECT_NAME}} War Room Dashboard`);
console.log(`  \u2192 http://localhost:${CONFIG.port}`);
console.log(`  \u2192 WebSocket: ws://localhost:${CONFIG.port}/ws\n`);

export default {
  port: CONFIG.port,
  fetch(req: Request, server: any) {
    if (new URL(req.url).pathname === '/ws') {
      const ok = server.upgrade(req, { data: { id: crypto.randomUUID() } });
      if (ok) return undefined;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    return app.fetch(req);
  },
  websocket: {
    open(ws: import('bun').ServerWebSocket<WsData>) {
      broadcaster.add(ws);
      ws.send(JSON.stringify({ type: 'state', data: currentState, ts: Date.now() }));
    },
    close(ws: import('bun').ServerWebSocket<WsData>) {
      broadcaster.remove(ws);
    },
    message() {},
  },
};
