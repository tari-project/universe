import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import InfiniteScroll from 'react-infinite-scroll-component';

import HistoryItem from './HistoryItem';
import { memo, useCallback } from 'react';
import { ListWrapper } from '@app/components/transactions/TxHistory.styles.ts';

const TXHistory = () => {
    const is_reward_history_loading = useWalletStore((s) => s.is_reward_history_loading);
    const transactions = useWalletStore((s) => s.coinbase_transactions);
    const fetchCoinbaseTransactions = useWalletStore((s) => s.fetchCoinbaseTransactions);
    const hasMore = useWalletStore((s) => s.has_more_coinbase_transactions);

    const handleNext = useCallback(() => {
        fetchCoinbaseTransactions(true, 20);
    }, [fetchCoinbaseTransactions]);

    return (
        <ListWrapper id="list">
            {is_reward_history_loading && !transactions?.length && <CircularProgress />}

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
