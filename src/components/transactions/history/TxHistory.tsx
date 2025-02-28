import { memo, useCallback, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { initialFetchTx, useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import HistoryItem from './HistoryItem';
import { ListWrapper } from './TxHistory.styles.ts';

const TXHistory = () => {
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
                {transactions.map((tx) => (
                    <HistoryItem key={tx.tx_id} item={tx} />
                ))}
            </InfiniteScroll>
        </ListWrapper>
    );
};

export default memo(TXHistory);
