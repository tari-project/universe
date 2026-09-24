import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, within } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import L2WalletCard from './L2WalletCard';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const enabledState: L2WalletState = {
    enabled: true,
    accounts: [
        {
            name: 'recovered-account-0',
            address: 'otl_esm_test',
            component_address: 'component_test',
            public_key: 'ab'.repeat(32),
            is_default: true,
            balance: { revealed: 1_000_000, confidential: 2_000_000 },
            history: [{ id: 1, transaction_id: null, amount: 1_234_567_890, source: 'scan', timestamp: 1 }],
            transactions: [],
        },
    ],
};

const serve = (state: L2WalletState) =>
    vi
        .mocked(invoke)
        .mockImplementation((async (cmd: string) =>
            cmd === 'l2_get_state' ? state : cmd === 'l2_claimable_burns' ? [] : undefined) as typeof invoke);

describe('L2WalletCard', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useL2WalletStore.setState({ ...initialState }, true);
    });

    it('asks for a PIN and does not touch L2 when none is set', () => {
        useWalletStore.setState({ is_pin_locked: false });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(screen.getByTestId('l2-pin-required')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-wallet')).not.toBeInTheDocument();
        expect(invoke).not.toHaveBeenCalled();
    });

    it('offers Enable Layer 2 when a PIN is set but L2 is off', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(initialState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-enable')).toBeInTheDocument();
        expect(invoke).toHaveBeenCalledWith('l2_get_state');
        expect(screen.queryByTestId('l2-wallet')).not.toBeInTheDocument();
    });

    it('masks amounts the way L1 does when the balance is hidden', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        useUIStore.setState({ hideWalletBalance: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-balance')).toHaveTextContent('******* XTR');
        expect(screen.getByTestId('l2-history-row')).toHaveTextContent('***XTR');
        useUIStore.setState({ hideWalletBalance: false });
    });

    it('shows the wallet once L2 is enabled', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-balance')).toHaveTextContent('3 XTR');
        expect(screen.getAllByTestId('l2-history-row')).toHaveLength(1);
        expect(screen.getByTestId('l2-history-row')).toHaveTextContent('+1.23kXTR');
        expect(screen.queryByTestId('l2-enable')).not.toBeInTheDocument();
    });

    it('names the default account Ootle Wallet, not the recovery name', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByText('l2.account-name')).toBeInTheDocument();
        expect(screen.queryByText('recovered-account-0')).not.toBeInTheDocument();
    });

    it('keeps Burn disabled while the L1 wallet is still scanning', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-burn-button')).toBeDisabled();
    });

    it('opens the burn form with the default account key as the claim key', async () => {
        useWalletStore.setState({
            is_pin_locked: true,
            wallet_scanning: { scanned_height: 1, total_height: 1, progress: 100, is_initial_scan_complete: true },
        });
        serve(enabledState);
        render(<L2WalletCard />);

        fireEvent.click(await screen.findByTestId('l2-burn-button'));
        expect(await screen.findByDisplayValue('ab'.repeat(32))).toBeInTheDocument();
        expect(screen.getByText('burn.claim-key-default')).toBeInTheDocument();
    });

    it('shows View details on a hovered history row', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);
        const row = await screen.findByTestId('l2-history-row');
        fireEvent.mouseEnter(row);
        fireEvent.click(await screen.findByTestId('l2-row-details'));
        expect(await screen.findByText('history.transaction-details')).toBeInTheDocument();
    });

    it('filters the feed between burns and history', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        const burn = {
            commitment: 'aa'.repeat(32),
            claim_public_key: 'ab'.repeat(32),
            amount: 1,
            proof_file: null,
            timestamp: 2,
        };
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_get_state'
                ? enabledState
                : cmd === 'l2_claimable_burns'
                  ? [{ ...burn, status: 'pending' }]
                  : undefined) as typeof invoke);
        render(<L2WalletCard />);
        const pick = async (label: string) => {
            fireEvent.click(within(screen.getByTestId('tx-history-filter')).getByRole('combobox'));
            fireEvent.click(await screen.findByRole('option', { name: label }));
        };

        expect(await screen.findByTestId('l2-claim-row')).toBeInTheDocument();
        expect(screen.getByTestId('l2-history-row')).toBeInTheDocument();

        await pick('transactions');
        expect(screen.queryByTestId('l2-claim-row')).not.toBeInTheDocument();
        expect(screen.getByTestId('l2-history-row')).toBeInTheDocument();

        await pick('l2.filter.waiting-claims');
        expect(await screen.findByTestId('l2-claim-row')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-history-row')).not.toBeInTheDocument();
    });
});
