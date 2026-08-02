import { Hono } from 'hono';
import { getRecentEvents } from '../collectors/events';

export function createApiRoutes() {
  const api = new Hono();
  api.get('/health', (c) => c.json({ status: 'ok' }));
  api.get('/events', (c) => {
    const limit = parseInt(c.req.query('limit') || '50');
    return c.json(getRecentEvents(limit));
  });
  return api;
}
