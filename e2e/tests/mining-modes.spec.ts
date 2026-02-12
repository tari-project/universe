import { test, expect } from '../helpers/shared-page';
import {
  waitForNodeSynced,
  waitForBlockHeight,
  stopCpuMining,
  clickStartMining,
  clickMiningMode,
  clickCustomSave,
  setSliderValue,
  getCustomModeDetails,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';

test.describe('Mining Modes', () => {
  test.afterEach(async ({ sharedPage: page }) => {
    await stopCpuMining(page);
  });

  test('can mine in Eco mode', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickMiningMode(page, 'Eco');
    await clickStartMining(page);
    const height = await waitForBlockHeight(page, 1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  test('can mine in Ludicrous mode', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickMiningMode(page, 'Ludicrous');
    await clickStartMining(page);
    const height = await waitForBlockHeight(page, 1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  test('custom settings persist across mode toggles', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickMiningMode(page, 'Custom');
    await setSliderValue(page, sel.mode.cpuSlider, 50);
    await setSliderValue(page, sel.mode.gpuSlider, 60);
    await clickCustomSave(page);

    await page.waitForTimeout(500);

    await clickMiningMode(page, 'Eco');
    await clickMiningMode(page, 'Custom');

    const details = await getCustomModeDetails(page);
    expect(details).toContain('CPU 50%');
    expect(details).toContain('GPU 60%');
  });
});
