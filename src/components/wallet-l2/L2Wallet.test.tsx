import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
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
