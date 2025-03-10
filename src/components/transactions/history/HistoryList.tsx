import { memo, useCallback, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { initialFetchTxs, useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ListItemWrapper, ListWrapper } from './TxHistory.styles.ts';
import { ListItem } from './ListItem.tsx';

interface HistoryListProps {
    winsOnly?: boolean;
}
const HistoryList = ({ winsOnly = false }: HistoryListProps) => {
    const is_transactions_history_loading = useWalletStore((s) => s.is_transactions_history_loading);
    const transactions = useWalletStore((s) => s.transactions);
    const fetchTransactions = useWalletStore((s) => s.fetchTransactions);
    const hasMore = useWalletStore((s) => s.has_more_transactions);

    useEffect(() => {
        initialFetchTxs();
    }, []);
    const handleNext = useCallback(() => {
        if (!is_transactions_history_loading && transactions.length) {
            fetchTransactions({ lastTxId: transactions[transactions.length - 1].tx_id, limit: 20 });
        }
    }, [fetchTransactions, is_transactions_history_loading, transactions]);

    return (
        <ListWrapper id="list">
            <InfiniteScroll
                dataLength={transactions?.length || 0}
                next={handleNext}
                hasMore={hasMore}
                loader={<CircularProgress />}
                scrollableTarget="list"
            >
                <ListItemWrapper>
                    {transactions.map((tx, index) => (
                        <ListItem key={tx.tx_id} item={tx} index={index} showReplay={winsOnly} />
                    ))}
                </ListItemWrapper>
            </InfiniteScroll>
        </ListWrapper>
    );
};

export default memo(HistoryList);
