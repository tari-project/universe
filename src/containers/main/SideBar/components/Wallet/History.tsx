import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ListLabel } from './HistoryItem.styles';
import { HistoryContainer, HistoryPadding } from './Wallet.styles';
import HistoryItem from './HistoryItem';
import { memo } from 'react';

const container = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 326,
    },
};

const History = () => {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const transactions = useWalletStore((s) => s.transactions);
    const fetchMoreTransactions = useWalletStore((s) => s.fetchMoreTransactions);

    return (
        <HistoryContainer initial="hidden" animate="visible" exit="hidden" variants={container}>
            <HistoryPadding id="history-padding">
                <ListLabel>{t('recent-wins')}</ListLabel>
                {isTransactionLoading && !transactions?.length && <CircularProgress />}
                <InfiniteScroll
                    dataLength={transactions?.length || 0}
                    next={fetchMoreTransactions}
                    hasMore={true}
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
