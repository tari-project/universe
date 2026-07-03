import { Page } from '@playwright/test';
import { sel } from './selectors';

/** Wait until the Tauri invoke shim is installed (page JS has booted). */
export async function waitForTauriReady(page: Page, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const ready = await page.evaluate(() => {
        return typeof (window as any).__PLAYWRIGHT_INVOKE__ === 'function';
      });
      if (ready) return;
    } catch {
      // page not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Tauri invoke not available after ${timeout}ms`);
}

/**
 * Wait until the main app UI has rendered (splashscreen gone). The state
 * replay delivers CloseSplashscreen and the config events right after the
 * page's WebSocket connects, so this resolves within a few seconds.
 */
export async function waitForAppReady(page: Page, timeout = 60_000) {
  await page.locator(sel.sidebar.mineButton).waitFor({ state: 'visible', timeout });
}
