import { memo, useCallback, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ListItemWrapper, ListWrapper } from './TxHistory.styles.ts';
import { HistoryListItem } from './ListItem.tsx';
import { fetchTransactionsHistory } from '@app/store';
import { useTranslation } from 'react-i18next';
import { TransactionInfo } from '@app/types/app-status.ts';
import ListLoadingAnimation from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/ListLoadingAnimation.tsx';

import { PlaceholderItem } from './ListItem.styles.ts';
import { LoadingText } from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/styles.ts';
import { TransactionDetails } from '@app/components/transactions/history/details/TransactionDetails.tsx';
import { getTxTypeByStatus } from '@app/utils/getTxStatus.ts';

export const FILTER_TYPES = ['rewards', 'transactions'];
type FilterTuple = typeof FILTER_TYPES;
export type ItemFilter = FilterTuple[number];

const HistoryList = memo(function HistoryList({ filter }: { filter: ItemFilter }) {
    const { t } = useTranslation('wallet');
    const is_transactions_history_loading = useWalletStore((s) => s.is_transactions_history_loading);
    const newestTxIdOnInitialFetch = useWalletStore((s) => s.newestTxIdOnInitialFetch);
    const pendingTransactions = useWalletStore((s) => s.pending_transactions);
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const hasMore = useWalletStore((s) => s.has_more_transactions);
    const transactions = useWalletStore((s) => s.transactions);

    const [detailsItem, setDetailsItem] = useState<TransactionInfo | null>(null);

    const combinedTransactions = useMemo(() => {
        const combined = [...pendingTransactions, ...transactions] as TransactionInfo[];

        return combined.filter((tx) => {
            const isMined = getTxTypeByStatus(tx) === 'mined';

            if (filter === 'rewards' && isMined) {
                return tx;
            }

            if (filter === 'transactions' && !isMined) {
                return tx;
            }
        });
    }, [filter, pendingTransactions, transactions]);

    const handleNext = useCallback(async () => {
        if (!is_transactions_history_loading) {
            await fetchTransactionsHistory({ continuation: true, limit: 20 });
        }
    }, [is_transactions_history_loading]);

    const listMarkup = useMemo(() => {
        const latestTxId = combinedTransactions?.[0]?.tx_id;
        const hasNewTx = latestTxId ? newestTxIdOnInitialFetch !== latestTxId : false;
        const initialTxTime = combinedTransactions?.find((tx) => tx.tx_id === newestTxIdOnInitialFetch)?.timestamp;

        // Calculate how many placeholder items we need to add
        const transactionsCount = combinedTransactions?.length || 0;
        const placeholdersNeeded = Math.max(0, 5 - transactionsCount);

        return (
            <InfiniteScroll
                dataLength={transactionsCount}
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
                        return (
                            <HistoryListItem
                                key={tx.tx_id}
                                item={tx}
                                index={i}
                                itemIsNew={isNew}
                                setDetailsItem={setDetailsItem}
                            />
                        );
                    })}

                    {/* fill the list with placeholders if there are less than 4 entries */}
                    {Array.from({ length: placeholdersNeeded }).map((_, index) => (
                        <PlaceholderItem key={`placeholder-${index}`} />
                    ))}

                    {/* added last placeholder so the user can scroll above the bottom mask */}
                    <PlaceholderItem />
                </ListItemWrapper>
            </InfiniteScroll>
        );
    }, [combinedTransactions, handleNext, hasMore, newestTxIdOnInitialFetch]);

    const baseMarkup = walletScanning.is_scanning ? (
        <ListLoadingAnimation
            loadingText={
                walletScanning.is_scanning && walletScanning.total_height > 0
                    ? t('wallet-scanning-with-progress', {
                          scanned: walletScanning.scanned_height.toLocaleString(),
                          total: walletScanning.total_height.toLocaleString(),
                          percent: walletScanning.progress.toFixed(1),
                      })
                    : t('wallet-is-scanning')
            }
        />
    ) : (
        listMarkup
    );

    const isEmpty = !walletScanning.is_scanning && !combinedTransactions?.length;
    const emptyMarkup = isEmpty ? <LoadingText>{t('empty-tx')}</LoadingText> : null;

    return (
        <>
            <ListWrapper id="list">
                {emptyMarkup}
                {baseMarkup}
            </ListWrapper>

            {detailsItem && (
                <TransactionDetails
                    item={detailsItem}
                    expanded={Boolean(detailsItem)}
                    handleClose={() => setDetailsItem(null)}
                />
            )}
        </>
    );
});

export default HistoryList;
