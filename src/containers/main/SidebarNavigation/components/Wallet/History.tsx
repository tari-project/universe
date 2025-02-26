import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ListLabel } from './HistoryItem.styles';
import { HistoryContainer, HistoryPadding } from './Wallet.styles';
import HistoryItem from './HistoryItem';
import { memo, useCallback } from 'react';

const container = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 306,
    },
};

const History = () => {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const is_reward_history_loading = useWalletStore((s) => s.is_reward_history_loading);
    const transactions = useWalletStore((s) => s.coinbase_transactions);
    const fetchCoinbaseTransactions = useWalletStore((s) => s.fetchCoinbaseTransactions);
    const hasMore = useWalletStore((s) => s.has_more_coinbase_transactions);

    const handleNext = useCallback(() => {
        fetchCoinbaseTransactions(true, 20);
    }, [fetchCoinbaseTransactions]);

    return (
        <HistoryContainer initial="hidden" animate="visible" exit="hidden" variants={container}>
            <HistoryPadding id="history-padding">
                <ListLabel>{t('recent-wins')}</ListLabel>
                {is_reward_history_loading && !transactions?.length && <CircularProgress />}
                <InfiniteScroll
                    dataLength={transactions?.length || 0}
                    next={handleNext}
                    hasMore={hasMore}
                    loader={<CircularProgress />}
                    scrollableTarget="history-padding"
                >
                    {transactions.map((tx) => (
                        <HistoryItem key={tx.tx_id} item={tx} />
                    ))}
                </InfiniteScroll>
            </HistoryPadding>
        </HistoryContainer>
    );
};

export default memo(History);
