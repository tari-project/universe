import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import type { L2Account, L2WalletState } from '@app/types/events-payloads.ts';
import L2Wallet from './L2Wallet';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const CLAIM_KEY = 'cd'.repeat(32);
const scanned = { scanned_height: 1, total_height: 1, progress: 100, is_initial_scan_complete: true };

const makeAccount = (revealed = 1_000_000, confidential = 2_000_000): L2Account => ({
    name: 'default',
    address: 'otl_loc_test',
    component_address: 'component_test',
    public_key: CLAIM_KEY,
    is_default: true,
    balance: { revealed, confidential, total: String(revealed + confidential) },
    history: [],
    transactions: [],
});

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

describe('L2Wallet balance refresh (#3608)', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useL2WalletStore.setState({ ...initialState }, true);
        useWalletStore.setState({ is_pin_locked: true, wallet_scanning: scanned });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('hides the refresh button in the pre-launch state without an account', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_default_claim_public_key'
                ? CLAIM_KEY
                : cmd === 'l2_claimable_burns'
                  ? []
                  : undefined) as typeof invoke);
        render(<L2Wallet />);

        const burn = await screen.findByTestId('l2-burn-button');
        await vi.waitFor(() => expect(burn).toBeEnabled());
        expect(screen.queryByTestId('l2-refresh-balance')).not.toBeInTheDocument();
        expect(invoke).not.toHaveBeenCalledWith('l2_refresh_balance');
    });

    it('triggers an initial refresh when opened with an account and updates store state', async () => {
        const updatedAccount = makeAccount(5_000_000, 2_000_000);
        const refreshedState: L2WalletState = {
            enabled: true,
            locked: false,
            seed_source: 'l1',
            accounts: [updatedAccount],
        };
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_refresh_balance'
                ? refreshedState
                : cmd === 'l2_claimable_burns'
                  ? []
                  : undefined) as typeof invoke);

        render(<L2Wallet account={makeAccount()} />);

        await vi.waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_refresh_balance'));
        await vi.waitFor(() => expect(useL2WalletStore.getState().accounts[0]?.balance.revealed).toBe(5_000_000));
    });

    it('shows busy state while refreshing and debounces rapid manual clicks', async () => {
        let now = 10_000;
        vi.spyOn(Date, 'now').mockImplementation(() => now);

        const resolvers: ((state: L2WalletState) => void)[] = [];
        vi.mocked(invoke).mockImplementation(((cmd: string) => {
            if (cmd === 'l2_refresh_balance') {
                return new Promise<L2WalletState>((resolve) => {
                    resolvers.push(resolve);
                });
            }
            if (cmd === 'l2_claimable_burns') return Promise.resolve([]);
            return Promise.resolve(undefined);
        }) as typeof invoke);

        render(<L2Wallet account={makeAccount()} />);
        const button = screen.getByTestId('l2-refresh-balance');

        // Initial refresh on open puts the button into busy/disabled state.
        await vi.waitFor(() => expect(resolvers).toHaveLength(1));
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');

        await act(async () => {
            resolvers[0]({
                enabled: true,
                locked: false,
                seed_source: 'l1',
                accounts: [makeAccount(4_000_000, 2_000_000)],
            });
        });

        await vi.waitFor(() => expect(button).toBeEnabled());
        expect(button).toHaveAttribute('aria-busy', 'false');

        // First manual click starts a refresh.
        fireEvent.click(button);
        expect(resolvers).toHaveLength(2);
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');

        await act(async () => {
            resolvers[1]({
                enabled: true,
                locked: false,
                seed_source: 'l1',
                accounts: [makeAccount(6_000_000, 2_000_000)],
            });
        });
        await vi.waitFor(() => expect(button).toBeEnabled());

        // Rapid second click within the 1s debounce window is ignored.
        now += 300;
        fireEvent.click(button);
        expect(resolvers).toHaveLength(2);

        // Click after the debounce window triggers a new refresh.
        now += 800;
        fireEvent.click(button);
        expect(resolvers).toHaveLength(3);

        await act(async () => {
            resolvers[2]({
                enabled: true,
                locked: false,
                seed_source: 'l1',
                accounts: [makeAccount(8_000_000, 2_000_000)],
            });
        });
        await vi.waitFor(() => expect(button).toBeEnabled());
        expect(useL2WalletStore.getState().accounts[0]?.balance.revealed).toBe(8_000_000);
    });

    it('re-enables the refresh button cleanly when l2_refresh_balance rejects', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'l2_refresh_balance') throw new Error('indexer unreachable');
            if (cmd === 'l2_claimable_burns') return [];
            return undefined;
        }) as typeof invoke);

        render(<L2Wallet account={makeAccount()} />);
        const button = screen.getByTestId('l2-refresh-balance');

        await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled());
        await vi.waitFor(() => expect(button).toBeEnabled());
        expect(button).toHaveAttribute('aria-busy', 'false');
    });
});
