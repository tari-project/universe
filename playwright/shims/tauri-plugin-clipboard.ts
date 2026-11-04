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
