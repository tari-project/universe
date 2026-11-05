import { test as base } from '../fixtures';
import { waitForTauriReady, waitForAppReady } from '../state';
import { dismissDialogs, stopMiningDirect } from '../wait-for';

// The managed page inherits the L2 config's tracing, video and screenshot options.
export const test = base.extend({
    appPage: async ({ page }, use) => {
        try {
            await page.goto('http://localhost:1420/');
            await waitForTauriReady(page);
            await waitForAppReady(page);
            await dismissDialogs(page);
            await use(page);
        } finally {
            await stopMiningDirect(page);
        }
    },
});

export { expect } from '@playwright/test';
