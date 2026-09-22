import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { List } from './List';

const { history, wallet } = vi.hoisted(() => ({
    history: {
        data: undefined as { pages: unknown[][] } | undefined,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
        isFetching: false,
        isPending: true,
        isLoading: false,
        hasNextPage: false,
    },
    wallet: {
        wallet_scanning: { is_scanning: false },
        is_wallet_importing: false,
        isLoading: false,
    },
}));

vi.mock('@app/hooks/wallet/useFetchTxHistory.ts', () => ({ useFetchTxHistory: () => history }));
vi.mock('@app/store', () => ({ useWalletStore: (selector: (state: typeof wallet) => unknown) => selector(wallet) }));
vi.mock('@app/store/actions/walletStoreActions.ts', () => ({ setDetailsItem: vi.fn() }));
vi.mock('react-intersection-observer', () => ({ useOnInView: () => vi.fn() }));
vi.mock('./ListItem.tsx', () => ({ HistoryListItem: () => <div data-testid="transaction" /> }));
vi.mock('@app/components/elements/loaders/LoadingDots.tsx', () => ({
    default: () => <div data-testid="loading-dots" />,
}));

const list = () => <List setIsScrolled={vi.fn()} targetRef={null} />;

function finishLoading(pages: unknown[][] = [[]]) {
    Object.assign(history, { data: { pages }, isPending: false, isLoading: false, isFetching: false });
}

describe('transaction history loading', () => {
    beforeEach(() => {
        Object.assign(history, {
            data: undefined,
            isFetchingNextPage: false,
            isFetching: false,
            isPending: true,
            isLoading: false,
            hasNextPage: false,
        });
        Object.assign(wallet, {
            wallet_scanning: { is_scanning: false },
            is_wallet_importing: false,
            isLoading: false,
        });
    });

    it('waits for the first result before showing the empty state', () => {
        const { rerender } = render(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();

        Object.assign(history, { isFetching: true, isLoading: true });
        rerender(list());
        expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();

        finishLoading();
        rerender(list());
        expect(screen.getByTestId('tx-list-empty')).toBeInTheDocument();
        expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();
    });

    it('keeps the empty pill mounted throughout repeated background refreshes', () => {
        finishLoading();
        const { rerender } = render(list());
        const pill = screen.getByTestId('tx-list-empty');

        for (const isFetching of [true, false, true, false]) {
            history.isFetching = isFetching;
            rerender(list());
            expect(screen.getByTestId('tx-list-empty')).toBe(pill);
            expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();
        }
    });

    it('keeps transactions mounted during refreshes and shows a loader for pagination', () => {
        finishLoading([[{ paymentId: 'tx-1' }]]);
        const { rerender } = render(list());
        const transaction = screen.getByTestId('transaction');

        history.isFetching = true;
        rerender(list());
        expect(screen.getByTestId('transaction')).toBe(transaction);
        expect(screen.queryByTestId('loading-dots')).not.toBeInTheDocument();

        history.isFetchingNextPage = true;
        rerender(list());
        expect(screen.getByTestId('transaction')).toBe(transaction);
        expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('hides the old empty state when a different wallet starts loading', () => {
        finishLoading();
        const { rerender } = render(list());
        expect(screen.getByTestId('tx-list-empty')).toBeInTheDocument();

        Object.assign(history, { data: undefined, isPending: true, isLoading: true, isFetching: true });
        rerender(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();
        expect(screen.getByTestId('loading-dots')).toBeInTheDocument();
    });

    it('waits for wallet scanning and importing to finish before showing the empty state', () => {
        finishLoading();
        wallet.wallet_scanning.is_scanning = true;
        const { rerender } = render(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();

        wallet.wallet_scanning.is_scanning = false;
        wallet.is_wallet_importing = true;
        rerender(list());
        expect(screen.queryByTestId('tx-list-empty')).not.toBeInTheDocument();

        wallet.is_wallet_importing = false;
        rerender(list());
        expect(screen.getByTestId('tx-list-empty')).toBeInTheDocument();
    });
});
