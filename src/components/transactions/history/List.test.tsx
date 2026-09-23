import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { List } from './List';

const { wallet } = vi.hoisted(() => ({
    wallet: {
        wallet_transactions: [] as unknown[],
        transaction_history_filter: 'all-activity',
        wallet_scanning: { is_initial_scan_complete: true },
        is_wallet_importing: false,
    },
}));

vi.mock('@app/store', () => ({ useWalletStore: (selector: (state: typeof wallet) => unknown) => selector(wallet) }));
vi.mock('@app/store/actions/walletStoreActions.ts', () => ({ setSelectedTransactionId: vi.fn() }));
vi.mock('virtua', () => ({ VList: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('./transactionHistoryItem/HistoryItem.tsx', () => ({
    HistoryListItem: () => <div data-testid="transaction" />,
}));

const list = () => <List setIsScrolled={vi.fn()} />;

describe('transaction history empty state', () => {
    beforeEach(() => {
        Object.assign(wallet, {
            wallet_transactions: [],
            wallet_scanning: { is_initial_scan_complete: true },
            is_wallet_importing: false,
        });
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

    it('hides the empty state when transactions exist', () => {
        wallet.wallet_transactions = [{ id: 'tx-1', source: 'Received' }];
        render(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();
        expect(screen.getByTestId('transaction')).toBeInTheDocument();
    });
});
