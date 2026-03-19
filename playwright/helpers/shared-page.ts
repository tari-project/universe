import { test as base, Page, BrowserContext } from '@playwright/test';
import { waitForTauriReady, initReadinessMarker } from './state';
import { dismissDialogs } from './wait-for';

/**
 * Worker-scoped shared page fixture.
 *
 * The Tauri remote-ui backend panics (AlreadyClosed) when a WebSocket
 * connection is closed. This permanently kills the event forwarding
 * thread, so subsequent WebSocket connections never receive pushed
 * events (like UpdateAppModuleStatus). Without those events the
 * frontend never marks mining modules as Initialized and the mining
 * button stays disabled.
 *
 * Workaround: all tests in the worker share a single BrowserContext
 * and Page. The page navigates once, connects one WebSocket, and
 * keeps it alive for the entire test run. This is safe because
 * workers: 1 means all tests run sequentially in one worker.
 */

type WorkerFixtures = {
  sharedContext: BrowserContext;
  sharedPage: Page;
};

export const test = base.extend<{}, WorkerFixtures>({
  sharedContext: [async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: 'http://localhost:1420',
    });
    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  sharedPage: [async ({ sharedContext }, use) => {
    const page = await sharedContext.newPage();
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await dismissDialogs(page);
    await use(page);
    // Don't close — context.close() handles it
  }, { scope: 'worker' }],
});

export { expect } from '@playwright/test';
