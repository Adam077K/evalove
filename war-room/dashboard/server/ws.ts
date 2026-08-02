import type { ServerWebSocket } from 'bun';

export type WsData = { id: string };

class WsBroadcaster {
  private clients = new Set<ServerWebSocket<WsData>>();

  add(ws: ServerWebSocket<WsData>) {
    this.clients.add(ws);
  }

  remove(ws: ServerWebSocket<WsData>) {
    this.clients.delete(ws);
  }

  broadcast(type: string, data: unknown) {
    const msg = JSON.stringify({ type, data, ts: Date.now() });
    for (const ws of this.clients) {
      try {
        ws.send(msg);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

export const broadcaster = new WsBroadcaster();
