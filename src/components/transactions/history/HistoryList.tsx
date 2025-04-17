import { memo, useCallback, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ListItemWrapper, ListWrapper } from './TxHistory.styles.ts';
import { HistoryListItem } from './ListItem.tsx';
import { fetchTransactionsHistory } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { TransactionInfo } from '@app/types/app-status.ts';

const HistoryList = memo(function HistoryList() {
    const { t } = useTranslation('wallet');
    const is_transactions_history_loading = useWalletStore((s) => s.is_transactions_history_loading);
    const newestTxIdOnInitialFetch = useWalletStore((s) => s.newestTxIdOnInitialFetch);
    const pendingTransactions = useWalletStore((s) => s.pending_transactions);
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const hasMore = useWalletStore((s) => s.has_more_transactions);
    const transactions = useWalletStore((s) => s.transactions);

    const combinedTransactions = useMemo(
        () => [...pendingTransactions, ...transactions] as TransactionInfo[],
        [pendingTransactions, transactions]
    );

    const handleNext = useCallback(async () => {
        if (!is_transactions_history_loading) {
            await fetchTransactionsHistory({ continuation: true, limit: 20 });
        }
    }, [is_transactions_history_loading]);

    const listMarkup = useMemo(() => {
        const latestTxId = combinedTransactions?.[0]?.tx_id;
        const hasNewTx = latestTxId ? newestTxIdOnInitialFetch !== latestTxId : false;
        const initialTxTime = combinedTransactions?.find((tx) => tx.tx_id === newestTxIdOnInitialFetch)?.timestamp;
        return (
            <InfiniteScroll
                dataLength={combinedTransactions?.length || 0}
                next={handleNext}
                hasMore={hasMore}
                loader={<CircularProgress />}
                scrollableTarget="list"
            >
                <ListItemWrapper>
                    {combinedTransactions?.map((tx, i) => {
                        // only show "new" badge under these conditions:
                        // there are new txs is general
                        // it's only of the latest 3
                        // its timestamp is later than the latest transaction on the very first fetch
                        const isNew = hasNewTx && i <= 2 && initialTxTime ? tx.timestamp > initialTxTime : false;
                        return <HistoryListItem key={tx.tx_id} item={tx} index={i} itemIsNew={isNew} />;
                    })}
                </ListItemWrapper>
            </InfiniteScroll>
        );
    }, [combinedTransactions, handleNext, hasMore, newestTxIdOnInitialFetch]);

    const scanningMarkup = walletScanning.is_scanning ? (
        <Typography variant="h6" style={{ textAlign: 'left' }}>
            {walletScanning.is_scanning && walletScanning.total_height > 0
                ? t('wallet-scanning-with-progress', {
                      scanned: walletScanning.scanned_height.toLocaleString(),
                      total: walletScanning.total_height.toLocaleString(),
                      percent: walletScanning.progress.toFixed(1),
                  })
                : t('wallet-is-scanning')}
        </Typography>
    ) : null;

    const isEmpty = !walletScanning.is_scanning && !is_transactions_history_loading && !combinedTransactions?.length;
    const emptyMarkup = isEmpty ? <Typography variant="h6">{t('empty-tx')}</Typography> : null;

    return (
        <ListWrapper id="list">
            {emptyMarkup}
            {scanningMarkup}
            {listMarkup}
        </ListWrapper>
    );
});

export default HistoryList;
