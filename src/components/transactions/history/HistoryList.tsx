import { memo, useCallback, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { BackendBridgeTransaction, useWalletStore } from '@app/store/useWalletStore';
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
import { invoke } from '@tauri-apps/api/core';

export type TransactionDetailsItem = TransactionInfo & { dest_address_emoji?: string };
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import {
    findByTransactionId,
    findFirstNonBridgeTransaction,
    getTimestampFromTransaction,
    isBridgeTransaction,
    isTransactionInfo,
} from './helpers.ts';
import { BridgeHistoryListItem } from './BridgeListItem.tsx';

const HistoryList = memo(function HistoryList() {
    const { t } = useTranslation('wallet');
    const is_transactions_history_loading = useWalletStore((s) => s.is_transactions_history_loading);
    const newestTxIdOnInitialFetch = useWalletStore((s) => s.newestTxIdOnInitialFetch);
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const hasMore = useWalletStore((s) => s.has_more_transactions);
    const transactions = useWalletStore((s) => s.transactions);
    const bridgeTransactions = useWalletStore((s) => s.bridge_transactions);
    const coldWalletAddress = useWalletStore((s) => s.cold_wallet_address);

    const [detailsItem, setDetailsItem] = useState<TransactionDetailsItem | BackendBridgeTransaction | null>(null);

    const combinedTransactions = useMemo(
        () =>
            ([...transactions, ...bridgeTransactions] as (TransactionInfo | UserTransactionDTO)[]).sort((a, b) => {
                return getTimestampFromTransaction(b) - getTimestampFromTransaction(a);
            }),
        [transactions, bridgeTransactions]
    );

    const adjustedTransactions = useMemo(() => {
        return combinedTransactions.reduce(
            (acc, tx, index) => {
                if (isBridgeTransaction(tx) && index > 0) {
                    const previousTransactions = acc.slice(-5); // Get up to the last 5 transactions
                    const matchingTransaction = previousTransactions.find(
                        (prevTx) =>
                            isTransactionInfo(prevTx) &&
                            prevTx.amount === Number(tx.tokenAmount) &&
                            prevTx.payment_id === tx.paymentId &&
                            prevTx.dest_address === coldWalletAddress
                    );

                    if (matchingTransaction) {
                        const removedBridgeTransaction = acc.splice(acc.indexOf(matchingTransaction), 1)[0];
                        if (removedBridgeTransaction && isTransactionInfo(removedBridgeTransaction)) {
                            const updatedTransaction: BackendBridgeTransaction = {
                                sourceAddress: removedBridgeTransaction.source_address,
                                destinationAddress: tx.destinationAddress,
                                status: tx.status,
                                createdAt: tx.createdAt,
                                tokenAmount: tx.tokenAmount,
                                amountAfterFee: tx.amountAfterFee,
                                feeAmount: tx.feeAmount,
                                paymentId: tx.paymentId,
                                mined_in_block_height: removedBridgeTransaction.mined_in_block_height,
                            };
                            acc.push(updatedTransaction);
                            return acc;
                        }
                    }
                }
                acc.push(tx);
                return acc;
            },
            [] as (TransactionInfo | UserTransactionDTO)[]
        );
    }, [coldWalletAddress, combinedTransactions]);

    const handleNext = useCallback(async () => {
        if (!is_transactions_history_loading) {
            await fetchTransactionsHistory({ offset: transactions.length, limit: 20 });
        }
    }, [is_transactions_history_loading, transactions.length]);

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
            tx_id: tx.tx_id,
            amount: tx.amount,
            payment_id: tx.payment_id,
            status: tx.status,
            source_address: tx.source_address,
            dest_address: tx.dest_address,
            dest_address_emoji,
            message: tx.message,
            direction: tx.direction,
            fee: tx.fee,
            is_cancelled: tx.is_cancelled,
            excess_sig: tx.excess_sig,
            timestamp: tx.timestamp,
            mined_in_block_height: tx.mined_in_block_height,
        });
    }, []);

    const listMarkup = useMemo(() => {
        const latestTxId = findFirstNonBridgeTransaction(adjustedTransactions)?.tx_id;
        const hasNewTx = latestTxId ? newestTxIdOnInitialFetch !== latestTxId : false;
        const initialTxTime = findByTransactionId(adjustedTransactions, newestTxIdOnInitialFetch)?.timestamp;

        // Calculate how many placeholder items we need to add
        const transactionsCount = adjustedTransactions?.length || 0;
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
                    {adjustedTransactions?.map((tx, i) => {
                        // only show "new" badge under these conditions:
                        // there are new txs is general
                        // it's only of the latest 3
                        // its timestamp is later than the latest transaction on the very first fetch

                        if (isTransactionInfo(tx)) {
                            const isNew = hasNewTx && i <= 2 && initialTxTime ? tx.timestamp > initialTxTime : false;
                            return (
                                <HistoryListItem
                                    key={tx.tx_id}
                                    item={tx}
                                    index={i}
                                    itemIsNew={isNew}
                                    setDetailsItem={handleDetailsChange}
                                />
                            );
                        }

                        if (isBridgeTransaction(tx)) {
                            return (
                                <BridgeHistoryListItem
                                    key={tx.createdAt}
                                    item={tx}
                                    index={i}
                                    itemIsNew={i === 0}
                                    setDetailsItem={setDetailsItem}
                                />
                            );
                        }

                        // If we reach here, it means the transaction is neither a TransactionInfo nor a UserTransactionDTO
                        console.warn('Unexpected transaction type:', tx);
                        return null; // or handle accordingly
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
    }, [adjustedTransactions, handleDetailsChange, handleNext, hasMore, newestTxIdOnInitialFetch]);

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

    const isEmpty = !walletScanning.is_scanning && !adjustedTransactions?.length;
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
