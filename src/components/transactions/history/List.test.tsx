import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@app/test/test-utils';
import { List } from './List';

const { wallet } = vi.hoisted(() => ({
    wallet: {
        wallet_transactions: [] as unknown[],
        transaction_history_filter: 'all-activity',
        wallet_scanning: { is_initial_scan_complete: true },
        is_wallet_importing: false,
        wallet_transactions_loaded: false,
    },
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue([]) }));
vi.mock('@app/store', () => ({
    useWalletStore: Object.assign((selector: (state: typeof wallet) => unknown) => selector(wallet), {
        getState: () => wallet,
        setState: (partial: Partial<typeof wallet>) => Object.assign(wallet, partial),
    }),
}));
vi.mock('@app/store/actions/walletStoreActions.ts', () => ({
    setSelectedTransactionId: vi.fn(),
    handleWalletTransactionsFound: vi.fn(),
}));
vi.mock('virtua', () => ({ VList: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('./transactionHistoryItem/HistoryItem.tsx', () => ({
    HistoryListItem: ({ isStalled }: { isStalled?: boolean }) => (
        <div data-testid="transaction" data-stalled={String(Boolean(isStalled))} />
    ),
}));

const list = () => <List setIsScrolled={vi.fn()} />;
const invokeMock = () => invoke as unknown as Mock<(cmd: string) => Promise<unknown>>;

describe('transaction history empty state', () => {
    beforeEach(() => {
        Object.assign(wallet, {
            wallet_transactions: [],
            wallet_scanning: { is_initial_scan_complete: true },
            is_wallet_importing: false,
            wallet_transactions_loaded: false,
        });
        vi.mocked(invoke).mockClear();
    });

    it('only asks the backend for the history once per session', async () => {
        const { unmount } = render(list());
        await vi.waitFor(() => expect(wallet.wallet_transactions_loaded).toBe(true));
        unmount();

        render(list());
        expect(invokeMock().mock.calls.filter(([cmd]) => cmd === 'get_wallet_transaction_history')).toHaveLength(1);
    });

    it('shows the empty state once there is nothing to wait for', () => {
        render(list());
        expect(screen.getByTestId('tx-list-empty')).toBeInTheDocument();
    });

    it('waits for wallet scanning and importing to finish before showing the empty state', () => {
        wallet.wallet_scanning.is_initial_scan_complete = false;
        const { rerender } = render(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();

        wallet.wallet_scanning.is_initial_scan_complete = true;
        wallet.is_wallet_importing = true;
        rerender(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();

        wallet.is_wallet_importing = false;
        rerender(list());
        expect(screen.getByTestId('tx-list-empty')).toBeInTheDocument();
    });

    it('marks a stalled transaction in its row', async () => {
        // 14 is still in the stalled list from before it was mined.
        wallet.wallet_transactions = [
            { id: 12, source: 'Transfer', status: 'pending' },
            { id: 13, source: 'Transfer', status: 'pending' },
            { id: 14, source: 'Transfer', status: 'unconfirmed' },
        ];
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'get_stalled_transactions'
                ? [
                      { tx_id: '12', amount: 5, burn_commitment: null },
                      { tx_id: '14', amount: 5, burn_commitment: null },
                  ]
                : []) as typeof invoke);
        render(list());

        await vi.waitFor(() =>
            expect(screen.getAllByTestId('transaction').map((row) => row.dataset.stalled)).toEqual([
                'true',
                'false',
                'false',
            ])
        );
        invokeMock().mockResolvedValue([]);
    });

    it('looks for stalled transactions only when the pending ones change, and not while scanning', async () => {
        const stalledCalls = () => invokeMock().mock.calls.filter(([cmd]) => cmd === 'get_stalled_transactions');
        wallet.wallet_scanning.is_initial_scan_complete = false;
        wallet.wallet_transactions = [{ id: 12, source: 'Transfer', status: 'pending' }];
        const { rerender } = render(list());
        expect(stalledCalls()).toHaveLength(0);

        wallet.wallet_scanning.is_initial_scan_complete = true;
        rerender(list());
        await vi.waitFor(() => expect(stalledCalls()).toHaveLength(1));

        // A scan batch replaces the array; the pending ones stay the same.
        wallet.wallet_transactions = [
            { id: 12, source: 'Transfer', status: 'pending' },
            { id: 13, source: 'Coinbase', status: 'confirmed' },
        ];
        rerender(list());
        expect(stalledCalls()).toHaveLength(1);

        wallet.wallet_transactions = [{ id: 12, source: 'Transfer', status: 'rejected' }];
        rerender(list());
        await vi.waitFor(() => expect(stalledCalls()).toHaveLength(2));
    });

    it('hides the empty state when transactions exist', () => {
        wallet.wallet_transactions = [{ id: 'tx-1', source: 'Received' }];
        render(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();
        expect(screen.getByTestId('transaction')).toBeInTheDocument();
    });
});
