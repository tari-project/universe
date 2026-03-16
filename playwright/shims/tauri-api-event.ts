import { initWebSocket, wsReady, addEventCallback } from './tauri-remote-ui-socket';

export type UnlistenFn = () => void;

export type EventCallback = (event: unknown) => void;

export const TauriEvent = {
  WINDOW_RESIZED: 'tauri://resize',
  WINDOW_MOVED: 'tauri://move',
  WINDOW_CLOSE_REQUESTED: 'tauri://close-requested',
  WINDOW_DESTROYED: 'tauri://destroyed',
  WINDOW_FOCUS: 'tauri://focus',
  WINDOW_BLUR: 'tauri://blur',
  WINDOW_SCALE_FACTOR_CHANGED: 'tauri://scale-change',
  WINDOW_THEME_CHANGED: 'tauri://theme-changed',
  WINDOW_CREATED: 'tauri://window-created',
  WEBVIEW_CREATED: 'tauri://webview-created',
} as const;

export async function listen(
  event: string,
  handler: (data: unknown) => void,
  _options?: unknown
): Promise<UnlistenFn> {
  if (
    ((window as any).__TAURI_INTERNALS__ && (window as any).__TAURI_INTERNALS__.invoke) ||
    ((window as any).__TAURI__ && (window as any).__TAURI__.invoke)
  ) {
    throw new Error('Not expected to reach native path in headless mode');
  }

  initWebSocket();
  if (wsReady) {
    await wsReady;
  }

  const remove = addEventCallback((data: any) => {
    if (data.event === event) {
      handler(data);
    }
  });

  return remove;
}

export async function once(
  event: string,
  handler: (data: unknown) => void,
  options?: unknown
): Promise<UnlistenFn> {
  const unlisten = await listen(event, (data) => {
    handler(data);
    unlisten();
  }, options);
  return unlisten;
}

export async function emit(event: string, payload?: unknown): Promise<void> {
  console.info(`[SHIM] emit event: ${event}`);
}

export async function emitTo(
  target: string | { kind: string; label?: string },
  event: string,
  payload?: unknown
): Promise<void> {
  console.info(`[SHIM] emitTo: ${event} -> ${JSON.stringify(target)}`);
}
