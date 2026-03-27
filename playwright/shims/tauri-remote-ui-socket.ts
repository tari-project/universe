let ws: WebSocket | null = null;
let wsReady: Promise<void> | null = null;
const filterCollection: Record<number, (data: { status: string; payload: unknown }) => void> = {};

type EventListener = (data: any) => void;
const eventListeners: EventListener[] = [];

let connecting = false;
let lastAttempt = 0;
const MIN_RETRY_MS = 2000;

function rejectAllInFlight(reason: string) {
  for (const id of Object.keys(filterCollection)) {
    try { filterCollection[Number(id)]({ status: 'error', payload: reason }); } catch {}
    delete filterCollection[Number(id)];
  }
}

function initWebSocket() {
  if (
    ((window as any).__TAURI_INTERNALS__ && (window as any).__TAURI_INTERNALS__.invoke) ||
    ((window as any).__TAURI__ && (window as any).__TAURI__.invoke)
  ) {
    return;
  }

  if (ws || wsReady || connecting) return;

  const now = Date.now();
  if (now - lastAttempt < MIN_RETRY_MS) return;
  lastAttempt = now;
  connecting = true;

  console.info('[SHIM] Connecting to ws://127.0.0.1:9515/remote_ui_ws');

  const socket = new WebSocket('ws://127.0.0.1:9515/remote_ui_ws');

  wsReady = new Promise<void>((resolve, reject) => {
    socket.onopen = () => {
      console.info('[SHIM] Remote Connected.');
      ws = socket;
      connecting = false;
      resolve();
    };
    socket.onclose = (e) => {
      console.info(`[SHIM] WS closed: code=${e.code} wasClean=${e.wasClean}`);
      rejectAllInFlight('WebSocket closed');
      ws = null;
      wsReady = null;
      connecting = false;
      lastAttempt = Date.now();
      // Don't reject — silently reconnect after a delay
      resolve();
      setTimeout(() => initWebSocket(), MIN_RETRY_MS);
    };
    socket.onerror = () => {
      console.error('[SHIM] WS error');
      rejectAllInFlight('WebSocket error');
      ws = null;
      wsReady = null;
      connecting = false;
      lastAttempt = Date.now();
      reject(new Error('WebSocket connection failed'));
    };
    socket.onmessage = ({ data }) => {
      try {
        const json_data = JSON.parse(data);
        if (json_data.id && filterCollection[json_data.id]) {
          try {
            filterCollection[json_data.id](JSON.parse(json_data.payload));
          } catch {
            filterCollection[json_data.id]({ status: 'error', payload: 'Invalid payload JSON' });
          }
          delete filterCollection[json_data.id];
        }
        // Forward events to registered listeners (snapshot to avoid splice-during-iteration)
        for (const listener of [...eventListeners]) {
          try { listener(json_data); } catch {}
        }
      } catch (e) {
        console.error('[SHIM] Failed to parse WebSocket message:', e);
      }
    };
  });
}

function addEventCallback(listener: EventListener) {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx >= 0) eventListeners.splice(idx, 1);
  };
}

// Expose a test helper to inject synthetic events into the listener pipeline
(window as any).__PLAYWRIGHT_DISPATCH_EVENT__ = (event: string, payload: unknown) => {
  const data = { event, payload };
  for (const listener of [...eventListeners]) {
    try { listener(data); } catch {}
  }
};

export { filterCollection, initWebSocket, ws, wsReady, addEventCallback };
