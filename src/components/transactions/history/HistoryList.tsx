import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ListItemWrapper, ListWrapper } from './TxHistory.styles.ts';
import { HistoryListItem } from './ListItem.tsx';
import { useTranslation } from 'react-i18next';
import { TransactionInfo } from '@app/types/app-status.ts';
import ListLoadingAnimation from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/ListLoadingAnimation.tsx';

import { PlaceholderItem } from './ListItem.styles.ts';
import { LoadingText } from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/styles.ts';
import { TransactionDetails } from '@app/components/transactions/history/details/TransactionDetails.tsx';
import { invoke } from '@tauri-apps/api/core';
import { fetchTransactions } from '@app/store/actions/walletStoreActions.ts';
import { TxHistoryFilter } from './FilterSelect.tsx';

export type TransactionDetailsItem = TransactionInfo & { dest_address_emoji?: string };

const TX_FETCH_LIMIT = 20;
const IS_NEW_TIMEOUT = 15 * 60 * 1000; // 15min

const HistoryList = memo(function HistoryList({ filter }: { filter: TxHistoryFilter }) {
    const { t } = useTranslation('wallet');
    const [isFetchingTxs, setIsFetchingTxs] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [detailsItem, setDetailsItem] = useState<TransactionDetailsItem | null>(null);
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const transactions = useWalletStore((state) => state.tx_history);

    useEffect(() => {
        setHasMore(true);
    }, [filter]);

    const handleNext = useCallback(async () => {
        if (isFetchingTxs) return;
        setIsFetchingTxs(true);
        try {
            const offset = transactions.length;
            const txs = await fetchTransactions({ filter, offset, limit: TX_FETCH_LIMIT });
            setHasMore(txs.length >= offset + TX_FETCH_LIMIT);
        } catch (error) {
            console.error('Failed to fetch transaction history:', error);
        } finally {
            setIsFetchingTxs(false);
        }
    }, [filter, isFetchingTxs, transactions]);

    const handleDetailsChange = useCallback(async (tx: TransactionInfo | null) => {
        if (!tx) {
            setDetailsItem(null);
            return;
        }
        const dest_address_emoji = await invoke('parse_tari_address', { address: tx.dest_address })
            .then((result) => result?.emoji_string)
            .catch(() => undefined);
        // Specify order here
        setDetailsItem({
            source_address: tx.source_address,
            dest_address: tx.dest_address,
            dest_address_emoji,
            tx_id: tx.tx_id,
            status: tx.status,
            amount: tx.amount,
            timestamp: tx.timestamp,
            payment_id: tx.payment_id,
            message: tx.message,
            mined_in_block_height: tx.mined_in_block_height,
            direction: tx.direction,
            fee: tx.fee,
            is_cancelled: tx.is_cancelled,
            excess_sig: tx.excess_sig,
        });
    }, []);

    const listMarkup = useMemo(() => {
        // Calculate how many placeholder items we need to add
        const transactionsCount = transactions?.length || 0;
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
                    {transactions?.map((tx, i) => {
                        const isNew = Date.now() - tx.timestamp * 1000 < IS_NEW_TIMEOUT;
                        return (
                            <HistoryListItem
                                key={tx.tx_id}
                                item={tx}
                                index={i}
                                itemIsNew={isNew}
                                setDetailsItem={handleDetailsChange}
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
    }, [transactions, handleNext, hasMore, handleDetailsChange]);

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

    const isEmpty = !walletScanning.is_scanning && !transactions?.length;
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
