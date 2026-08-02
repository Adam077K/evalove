import { useStore } from './store';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;

// Fetch initial state via REST (fallback if WS is slow)
export async function fetchInitialState() {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      useStore.getState().setState(data);
      console.log('[REST] Initial state loaded:', data.ceos?.length, 'CEOs');
    }
  } catch (e) {
    console.error('[REST] Failed to fetch initial state:', e);
  }
}

export function connectWs() {
  // Fetch state immediately via REST while WS connects
  fetchInitialState();

  // Connect directly to the Bun server WS (port 4200), bypassing Vite's proxy
  // which has compatibility issues with Bun's WebSocket implementation
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const wsPort = window.location.port === '4201' ? '4200' : window.location.port;
  const wsUrl = `${protocol}//${host}:${wsPort}/ws`;
  console.log('[WS] Connecting to', wsUrl);

  try {
    ws = new WebSocket(wsUrl);
  } catch (e) {
    console.error('[WS] Failed to create WebSocket:', e);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[WS] Connected');
    useStore.getState().setConnected(true);
    reconnectDelay = 1000;
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state') {
        useStore.getState().setState(msg.data);
      }
    } catch (e) {
      console.error('[WS] Parse error:', e);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected, reconnecting...');
    useStore.getState().setConnected(false);
    scheduleReconnect();
  };

  ws.onerror = (e) => {
    console.error('[WS] Error:', e);
    ws?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connectWs();
    reconnectDelay = Math.min(reconnectDelay * 2, 10000);
  }, reconnectDelay);
}

export function disconnectWs() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
}
