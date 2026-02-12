import { Page } from '@playwright/test';

export async function waitForTauriReady(page: Page, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const ready = await page.evaluate(() => {
        return typeof (window as any).__E2E_INVOKE__ === 'function';
      });
      if (ready) return;
    } catch {
      // page not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Tauri invoke not available after ${timeout}ms`);
}

export async function initReadinessMarker(_page: Page) {
  // no-op: readiness is detected in waitForTauriReady via __E2E_INVOKE__
}
