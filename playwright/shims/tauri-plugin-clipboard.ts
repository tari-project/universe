let _clipboard = '';

export async function writeText(text: string) {
  _clipboard = text;
  (window as any).__PLAYWRIGHT_CLIPBOARD__ = text;
}

export async function readText() {
  return _clipboard;
}

export async function clear() {
  _clipboard = '';
  (window as any).__PLAYWRIGHT_CLIPBOARD__ = '';
}

// src/utils/clipboard.ts writes through the webview's Clipboard API before the plugin,
// so route that through the same recorder or specs would read an empty clipboard.
if (typeof navigator !== 'undefined' && navigator.clipboard) {
  navigator.clipboard.writeText = writeText;
  navigator.clipboard.readText = readText;
}
