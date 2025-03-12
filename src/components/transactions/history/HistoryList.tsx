import { memo, useCallback, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ListItemWrapper, ListWrapper } from './TxHistory.styles.ts';
import { HistoryListItem } from './ListItem.tsx';
import { initialFetchTxs, fetchTransactionsHistory } from '@app/store';
import { useTranslation } from 'react-i18next';

interface HistoryListProps {
    winsOnly?: boolean;
}
const HistoryList = ({ winsOnly = false }: HistoryListProps) => {
    const { t } = useTranslation('wallet');
    const is_transactions_history_loading = useWalletStore((s) => s.is_transactions_history_loading);
    const transactions = useWalletStore((s) => s.transactions);
    const hasMore = useWalletStore((s) => s.has_more_transactions);

    useEffect(() => {
        initialFetchTxs();
    }, []);

    const handleNext = useCallback(async () => {
        if (!is_transactions_history_loading) {
            await fetchTransactionsHistory({ continuation: true, limit: 20 });
        }
    }, [is_transactions_history_loading]);

    return (
        <ListWrapper id="list">
            {!is_transactions_history_loading && !transactions.length && t('empty-tx')}
            <InfiniteScroll
                dataLength={transactions?.length || 0}
                next={handleNext}
                hasMore={hasMore}
                loader={<CircularProgress />}
                scrollableTarget="list"
            >
                <ListItemWrapper>
                    {transactions.map((tx, index) => (
                        <HistoryListItem key={tx.tx_id} item={tx} index={index} showReplay={winsOnly} />
                    ))}
                </ListItemWrapper>
            </InfiniteScroll>
        </ListWrapper>
    );
};

export default memo(HistoryList);
