import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import type { L2Account } from '@app/types/events-payloads.ts';
import L2Wallet from './L2Wallet';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const CLAIM_KEY = 'cd'.repeat(32);
const scanned = { scanned_height: 1, total_height: 1, progress: 100, is_initial_scan_complete: true };

describe('L2Wallet burn button PIN state (#3518)', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_default_claim_public_key'
                ? CLAIM_KEY
                : cmd === 'l2_claimable_burns'
                  ? []
                  : undefined) as typeof invoke);
        useWalletStore.setState({ wallet_scanning: scanned });
    });

    it('enables Burn with no PIN hint when a PIN is set', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        render(<L2Wallet />);

        const burn = await screen.findByTestId('l2-burn-button');
        await vi.waitFor(() => expect(burn).toBeEnabled());
        expect(burn).not.toHaveAttribute('aria-label');
    });

    it('disables Burn with the PIN-required hint when no PIN is set', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        render(<L2Wallet />);

        const burn = await screen.findByTestId('l2-burn-button');
        expect(burn).toBeDisabled();
        expect(burn).toHaveAttribute('aria-label', 'burn.pin-required');
    });

    it('disables Burn without the PIN-required hint while the PIN state is unknown', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        render(<L2Wallet />);

        const burn = await screen.findByTestId('l2-burn-button');
        expect(burn).toBeDisabled();
        expect(burn).not.toHaveAttribute('aria-label');
    });
});

describe('L2Wallet shield and unshield', () => {
    const account = (revealed: number, confidential: number): L2Account => ({
        name: 'default',
        address: 'otl_esm_own',
        component_address: 'component_own',
        public_key: CLAIM_KEY,
        is_default: true,
        balance: { revealed, confidential, total: `${revealed + confidential}` },
        history: [],
        transactions: [],
    });

    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_claimable_burns' ? [] : undefined) as typeof invoke);
        useWalletStore.setState({ wallet_scanning: scanned, is_pin_locked: true });
    });

    // The activity list loads waiting claims after it mounts, so let that settle inside act().
    async function renderSettled(ui: Parameters<typeof render>[0]) {
        const rendered = render(ui);
        await act(() => Promise.resolve());
        return rendered;
    }

    it('offers each only when that side has funds', async () => {
        const { unmount } = await renderSettled(<L2Wallet account={account(5_000_000, 0)} />);
        expect(screen.getByTestId('l2-shield-button')).toBeEnabled();
        expect(screen.getByTestId('l2-unshield-button')).toBeDisabled();
        unmount();

        await renderSettled(<L2Wallet account={account(0, 3_000_000)} />);
        expect(screen.getByTestId('l2-shield-button')).toBeDisabled();
        expect(screen.getByTestId('l2-unshield-button')).toBeEnabled();
    });

    it('offers neither without a PIN, which the backend would refuse', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        await renderSettled(<L2Wallet account={account(5_000_000, 3_000_000)} />);
        expect(screen.getByTestId('l2-shield-button')).toBeDisabled();
        expect(screen.getByTestId('l2-unshield-button')).toBeDisabled();
    });

    it('hides both before the wallet has an account', async () => {
        render(<L2Wallet />);
        await screen.findByTestId('l2-burn-button');
        expect(screen.queryByTestId('l2-shield-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('l2-unshield-button')).not.toBeInTheDocument();
    });

    it.each([
        ['l2-shield-button', 'l2-shield-modal', 'l2.shield.available 5.000000 TARI'],
        ['l2-unshield-button', 'l2-unshield-modal', 'l2.unshield.available 3.000000 TARI'],
    ])('%s opens its modal showing that side of the balance', async (button, modal, available) => {
        await renderSettled(<L2Wallet account={account(5_000_000, 3_000_000)} />);
        fireEvent.click(screen.getByTestId(button));
        expect(await screen.findByTestId(modal)).toBeInTheDocument();
        expect(screen.getByText(available)).toBeInTheDocument();
    });

    it('exposes the split for end-to-end checks', async () => {
        await renderSettled(<L2Wallet account={account(5_000_000, 3_000_000)} />);
        const balance = screen.getByTestId('l2-balance');
        expect(balance).toHaveAttribute('data-revealed', '5000000');
        expect(balance).toHaveAttribute('data-confidential', '3000000');
    });
});
