import { test, expect } from '../helpers/fixtures';
import {
  openMiningSidebar,
  waitForMiningReady,
  clickStartMining,
  waitForMiningActive,
  clickStopMining,
  waitForMiningStopped,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';
import type { Page } from '@playwright/test';

/**
 * Open the pause dropdown and click one of its options. Mirrors the
 * convergence loop of clickStopMining: the dropdown is toggled by the
 * pause button and can render slower than the click under load.
 */
async function clickPauseOption(page: Page, optionSelector: string) {
  await openMiningSidebar(page);
  const pauseButton = page.locator(sel.mining.pauseButton);
  const option = page.locator(optionSelector);

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await option.isVisible().catch(() => false)) {
      await option.click({ timeout: 5_000 });
      return;
    }
    await pauseButton.click({ timeout: 10_000, force: true }).catch(() => {});
    const visible = await option.waitFor({ state: 'visible', timeout: 5_000 }).then(
      () => true,
      () => false
    );
    if (visible) {
      await option.click({ timeout: 5_000 });
      return;
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Pause option ${optionSelector} did not appear within 60s`);
}

interface PickerTime {
  hour12: number; // 1-12
  minute: number; // 0-55, multiple of 5
  period: 'AM' | 'PM';
}

function toPickerTime(date: Date): PickerTime {
  const h = date.getHours();
  const minute = Math.floor(date.getMinutes() / 5) * 5;
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
}

/**
 * Drive one TimePicker. The option grid renders three fixed columns
 * (12 hours, 12 five-minute steps, AM/PM), so options are addressed by
 * index — no dependence on the text formatting.
 */
async function setTimePicker(page: Page, pickerSelector: string, time: PickerTime) {
  const trigger = page.locator(`${pickerSelector} [tabindex="0"]`).first();
  await trigger.click({ timeout: 5_000 });

  const options = page.locator('[role="option"]');
  await options.first().waitFor({ state: 'visible', timeout: 5_000 });

  await options.nth(time.hour12 - 1).click({ timeout: 5_000 });
  await options.nth(12 + time.minute / 5).click({ timeout: 5_000 });
  await options.nth(24 + (time.period === 'AM' ? 0 : 1)).click({ timeout: 5_000 });

  // Close the floating options (click-outside dismiss).
  await page.keyboard.press('Escape');
  await options
    .first()
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .catch(() => {});
}

/** Open the scheduler modal from the mining sidebar. */
async function openScheduler(page: Page) {
  await openMiningSidebar(page);
  const openBtn = page.locator(sel.scheduler.open);
  await openBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await openBtn.dispatchEvent('click');
  await page.locator(sel.scheduler.save).waitFor({ state: 'visible', timeout: 10_000 });
}

async function closeScheduler(page: Page) {
  const cancel = page.locator(sel.scheduler.cancel);
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click({ timeout: 5_000 });
  }
  await page.locator(sel.scheduler.save).waitFor({ state: 'hidden', timeout: 10_000 });
}

/** Remove any saved schedule so no timed transition leaks into later tests. */
async function deleteScheduleIfAny(page: Page) {
  await openScheduler(page);
  const del = page.locator(sel.scheduler.delete);
  if (await del.isVisible().catch(() => false)) {
    await del.click({ timeout: 5_000 });
    await del.waitFor({ state: 'hidden', timeout: 10_000 });
  }
  await closeScheduler(page);
}

test.describe('Pause Mining', () => {
  test('timed pause shows a resume countdown; Resume restarts immediately', async ({ appPage: page }) => {
    test.setTimeout(480_000);
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    // --- Pause for 2 hours ---
    await clickPauseOption(page, sel.mining.pauseFor(2));

    // Mining stops and the button flips to Resume with a countdown chip.
    await waitForMiningStopped(page, 60_000);
    const resumeButton = page.locator(sel.mining.resumeButton);
    await expect(resumeButton).toBeVisible({ timeout: 30_000 });
    const chip = page.locator(sel.mining.resumeCountdown);
    await expect(chip).toBeVisible({ timeout: 30_000 });
    expect((await chip.textContent())?.trim()).toBeTruthy();

    // --- Resume does not wait out the timer ---
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);
    await expect(chip).not.toBeVisible({ timeout: 30_000 });

    // Leave the backend quiet.
    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });

  test('"Pause until restart" fully stops mining (no countdown)', async ({ appPage: page }) => {
    test.setTimeout(480_000);
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    await clickPauseOption(page, sel.mining.stopOption);
    await waitForMiningStopped(page, 60_000);

    // A stop is not a timed pause: no countdown chip, and the button is
    // plain Start.
    await expect(page.locator(sel.mining.resumeCountdown)).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator(sel.mining.startButton)).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('Schedule Mining', () => {
  test('save, pause toggle, replace and delete a schedule', async ({ appPage: page }) => {
    test.setTimeout(300_000);
    await waitForMiningReady(page, 120_000);

    // A 5-minute window six hours in the past: real times exercise the
    // pickers but the window cannot fire during the test run.
    const start = toPickerTime(new Date(Date.now() - 6 * 3600 * 1000));
    const end = toPickerTime(new Date(Date.now() - 6 * 3600 * 1000 + 5 * 60 * 1000));

    await openScheduler(page);
    await setTimePicker(page, sel.scheduler.startTime, start);
    await setTimePicker(page, sel.scheduler.endTime, end);
    await page.locator(sel.scheduler.save).click({ timeout: 5_000 });

    // The saved schedule renders as the "current" item with a delete CTA.
    await expect(page.locator(sel.scheduler.delete)).toBeVisible({ timeout: 10_000 });
    await closeScheduler(page);

    // The sidebar button now shows the scheduled state with a pause toggle.
    const pauseToggle = page.locator(sel.scheduler.pauseToggle);
    await expect(pauseToggle).toBeVisible({ timeout: 10_000 });
    await expect(pauseToggle).toBeChecked();

    // Pause the schedule and re-activate it.
    await pauseToggle.locator('..').click({ timeout: 5_000 });
    await expect(pauseToggle).not.toBeChecked({ timeout: 10_000 });
    await pauseToggle.locator('..').click({ timeout: 5_000 });
    await expect(pauseToggle).toBeChecked({ timeout: 10_000 });

    // Only one schedule exists: saving again replaces it (still exactly
    // one "current" item / delete CTA).
    await openScheduler(page);
    const laterStart = toPickerTime(new Date(Date.now() - 5 * 3600 * 1000));
    await setTimePicker(page, sel.scheduler.startTime, laterStart);
    await page.locator(sel.scheduler.save).click({ timeout: 5_000 });
    await expect(page.locator(sel.scheduler.delete)).toHaveCount(1, { timeout: 10_000 });

    // Delete removes it and the sidebar returns to the setup state.
    await page.locator(sel.scheduler.delete).click({ timeout: 5_000 });
    await expect(page.locator(sel.scheduler.delete)).not.toBeVisible({ timeout: 10_000 });
    await closeScheduler(page);
    await expect(pauseToggle).not.toBeVisible({ timeout: 10_000 });
  });

  // @heavy: waits out a real 5-minute schedule boundary (twice) to see the
  // start and end edges fire. Nightly/manual lane only.
  test('scheduled window starts and stops mining at its edges @heavy', async ({ appPage: page }) => {
    test.setTimeout(1_200_000);
    await waitForMiningReady(page, 120_000);
    await waitForMiningStopped(page, 30_000);

    // Next 5-minute boundary at least 90s out, so saving comfortably
    // precedes the start edge.
    const boundaryMs = Math.ceil((Date.now() + 90_000) / 300_000) * 300_000;
    const start = toPickerTime(new Date(boundaryMs));
    const end = toPickerTime(new Date(boundaryMs + 5 * 60 * 1000));

    try {
      await openScheduler(page);
      await setTimePicker(page, sel.scheduler.startTime, start);
      await setTimePicker(page, sel.scheduler.endTime, end);
      await page.locator(sel.scheduler.save).click({ timeout: 5_000 });
      await expect(page.locator(sel.scheduler.delete)).toBeVisible({ timeout: 10_000 });
      await closeScheduler(page);

      // --- Start edge: mining begins on its own ---
      const untilStart = boundaryMs - Date.now() + 120_000;
      await waitForMiningActive(page, untilStart);

      // --- End edge: mining stops on its own ---
      await waitForMiningStopped(page, 7 * 60_000);
    } finally {
      await deleteScheduleIfAny(page);
    }
  });
});
