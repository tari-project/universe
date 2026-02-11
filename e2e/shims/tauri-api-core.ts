import { initWebSocket, wsReady, ws, filterCollection } from './tauri-remote-ui-socket';

let msg_id = 0;

async function _invoke(cmd: string, args?: Record<string, unknown>, options?: unknown): Promise<unknown> {
  if (
    ((window as any).__TAURI_INTERNALS__ && (window as any).__TAURI_INTERNALS__.invoke) ||
    ((window as any).__TAURI__ && (window as any).__TAURI__.invoke)
  ) {
    return (window as any).__TAURI_INTERNALS__.invoke(cmd, args, options);
  }

  initWebSocket();
  if (wsReady) {
    await wsReady;
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    return new Promise((resolve, reject) => {
      const id = ++msg_id;
      const msg = { id, cmd, args, options };
      const clear = setTimeout(() => {
        delete filterCollection[id];
        reject(new Error(`Invoke Timeout. cmd : ${cmd}`));
      }, 30000);
      filterCollection[id] = ({ status, payload }) => {
        clearTimeout(clear);
        if (status === 'success') {
          resolve(payload);
        } else {
          reject(payload);
        }
      };
      ws!.send(JSON.stringify(msg));
    });
  } else {
    throw new Error('No WebSocket or Tauri IPC available to invoke');
  }
}

export const invoke = _invoke;

(window as any).__E2E_INVOKE__ = _invoke;
