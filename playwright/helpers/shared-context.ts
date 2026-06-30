import { test as base, Page, BrowserContext } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from './state';
import { dismissDialogs } from './wait-for';

// Shared browser context and page across all test files.
// The Tauri backend only replays setup-completion events to the first
// WebSocket connection. New browser contexts start with a fresh Zustand
// store where mining modules are NotInitialized, so the Start Mining
// button stays permanently disabled. Reusing one context avoids this.
//
// We store on globalThis so the singleton survives even if this module
// is re-imported by different Playwright projects in the same worker.

const g = globalThis as unknown as {
  __sharedContext?: BrowserContext;
  __sharedPage?: Page;
};

export const test = base.extend<{ sharedPage: Page }>({
  sharedPage: async ({ browser }, use) => {
    if (!g.__sharedPage || g.__sharedPage.isClosed()) {
      if (g.__sharedContext) await g.__sharedContext.close().catch(() => {});
      g.__sharedContext = await browser.newContext();
      g.__sharedPage = await g.__sharedContext.newPage();
      await initReadinessMarker(g.__sharedPage);
      await g.__sharedPage.goto('http://localhost:1420/');
      await waitForTauriReady(g.__sharedPage);
      await dismissDialogs(g.__sharedPage);
    }
    await use(g.__sharedPage);
  },
});

export { expect } from '@playwright/test';
