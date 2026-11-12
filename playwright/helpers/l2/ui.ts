import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { sel } from '../selectors';

export const BURN_XTM = 5;
export const BURN_MICRO = BURN_XTM * 1_000_000;
export const SEND_MICRO = 1_000_000;
export const RECEIVE_MICRO = 250_000;
export const CONVERT_MICRO = 400_000;

export async function openL2(page: Page): Promise<void> {
    if (await page.locator(sel.l2.wallet).isVisible()) return;
    const button = page.locator(sel.l2.open);
    if ((await button.getAttribute('data-active')) !== 'true') await button.click();
    await expect(page.locator(sel.l2.wallet)).toBeVisible({ timeout: 120_000 });
}

export async function l2Address(page: Page): Promise<string> {
    const address = await page.locator(sel.l2.address).getAttribute('title');
    if (!address) throw new Error('L2 wallet has no visible address');
    return address;
}

export async function l2Balance(page: Page): Promise<number> {
    const balance = await page.locator(sel.l2.balance).getAttribute('data-balance');
    if (balance === null || !Number.isSafeInteger(Number(balance))) throw new Error(`Invalid L2 balance: ${balance}`);
    return Number(balance);
}

/** The account's revealed and confidential balances in micro TARI, as the panel shows them. */
export async function l2Split(page: Page): Promise<{ revealed: number; confidential: number }> {
    const balance = page.locator(sel.l2.balance);
    const read = async (side: 'revealed' | 'confidential') => {
        const value = await balance.getAttribute(`data-${side}`);
        if (value === null || !Number.isSafeInteger(Number(value)))
            throw new Error(`Invalid L2 ${side} balance: ${value}`);
        return Number(value);
    };
    return { revealed: await read('revealed'), confidential: await read('confidential') };
}
