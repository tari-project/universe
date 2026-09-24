import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
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
            name: 'default',
            address: 'otl_esm_test',
            component_address: 'component_test',
            public_key: 'ab'.repeat(32),
            is_default: true,
            balance: { revealed: 1_000_000, confidential: 2_000_000 },
            history: [{ id: 1, transaction_id: null, amount: 3_000_000, source: 'scan', timestamp: 1 }],
            transactions: [],
        },
    ],
};

const serve = (state: L2WalletState) =>
    vi
        .mocked(invoke)
        .mockImplementation((async (cmd: string) => (cmd === 'l2_get_state' ? state : undefined)) as typeof invoke);

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

    it('shows the wallet once L2 is enabled', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-balance')).toHaveTextContent('3');
        expect(screen.getAllByTestId('l2-history-row')).toHaveLength(1);
        expect(screen.queryByTestId('l2-enable')).not.toBeInTheDocument();
    });
});
