import { memo, useCallback, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { initialFetchTx, useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ListItemWrapper, ListWrapper } from './TxHistory.styles.ts';
import { ListItem } from './ListItem.tsx';

interface HistoryListProps {
    winsOnly?: boolean;
}
const HistoryList = ({ winsOnly = false }: HistoryListProps) => {
    const is_reward_history_loading = useWalletStore((s) => s.is_reward_history_loading);
    const transactions = useWalletStore((s) => s.coinbase_transactions);
    const fetchCoinbaseTransactions = useWalletStore((s) => s.fetchCoinbaseTransactions);
    const hasMore = useWalletStore((s) => s.has_more_coinbase_transactions);

    useEffect(() => {
        initialFetchTx();
    }, []);
    const handleNext = useCallback(() => {
        if (!is_reward_history_loading) {
            fetchCoinbaseTransactions(true, 20);
        }
    }, [fetchCoinbaseTransactions, is_reward_history_loading]);

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
