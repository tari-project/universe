let ws: WebSocket | null = null;
let wsReady: Promise<void> | null = null;
const filterCollection: Record<number, (data: { status: string; payload: unknown }) => void> = {};

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

  console.info('[E2E-SHIM] Connecting to ws://127.0.0.1:9515/remote_ui_ws');
  
  const socket = new WebSocket('ws://127.0.0.1:9515/remote_ui_ws');

  wsReady = new Promise<void>((resolve, reject) => {
    socket.onopen = () => {
      console.info('[E2E-SHIM] Remote Connected.');
      ws = socket;
      connecting = false;
      resolve();
    };
    socket.onclose = (e) => {
      console.info(`[E2E-SHIM] WS closed: code=${e.code} wasClean=${e.wasClean}`);
      ws = null;
      wsReady = null;
      connecting = false;
      lastAttempt = Date.now();
    };
    socket.onerror = () => {
      console.error('[E2E-SHIM] WS error');
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
    };
  });
}

export { filterCollection, initWebSocket, ws, wsReady };
