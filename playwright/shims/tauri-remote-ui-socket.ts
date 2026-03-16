let ws: WebSocket | null = null;
let wsReady: Promise<void> | null = null;
const filterCollection: Record<number, (data: { status: string; payload: unknown }) => void> = {};

type EventListener = (data: any) => void;
const eventListeners: EventListener[] = [];

let connecting = false;
let lastAttempt = 0;
const MIN_RETRY_MS = 2000;

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
      ws = null;
      wsReady = null;
      connecting = false;
      lastAttempt = Date.now();
    };
    socket.onerror = () => {
      console.error('[SHIM] WS error');
      ws = null;
      wsReady = null;
      connecting = false;
      lastAttempt = Date.now();
    };
    socket.onmessage = ({ data }) => {
      const json_data = JSON.parse(data);
      if (json_data.id && filterCollection[json_data.id]) {
        filterCollection[json_data.id](JSON.parse(json_data.payload));
      }
      // Forward events to registered listeners
      for (const listener of eventListeners) {
        try { listener(json_data); } catch {}
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

export { filterCollection, initWebSocket, ws, wsReady, addEventCallback };
