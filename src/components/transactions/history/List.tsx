import { useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { BackendBridgeTransaction, useWalletStore } from '@app/store';

import { TransactionInfo } from '@app/types/app-status.ts';

import { useFetchTxHistory } from '@app/hooks/wallet/useFetchTxHistory.ts';

import ListLoadingAnimation from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/ListLoadingAnimation.tsx';
import { LoadingText } from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/styles.ts';

import { HistoryListItem } from './ListItem.tsx';
import { PlaceholderItem } from './ListItem.styles.ts';
import { ListItemWrapper, ListWrapper } from './List.styles.ts';
import { setDetailsItem } from '@app/store/actions/walletStoreActions.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { getTimestampFromTransaction, isBridgeTransaction, isTransactionInfo } from './helpers.ts';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { BridgeHistoryListItem } from '@app/components/transactions/history/BridgeListItem.tsx';

export function List() {
    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const bridgeTransactions = useWalletStore((s) => s.bridge_transactions);
    const coldWalletAddress = useWalletStore((s) => s.cold_wallet_address);
    const { data, fetchNextPage, isFetchingNextPage, isFetching, hasNextPage } = useFetchTxHistory();

    const { ref } = useInView({
        initialInView: false,
        onChange: () => hasNextPage && fetchNextPage(),
    });

    const baseTx = data?.pages.flatMap((p) => p) || [];

    const combinedTransactions = ([...baseTx, ...bridgeTransactions] as (TransactionInfo | UserTransactionDTO)[]).sort(
        (a, b) => {
            return getTimestampFromTransaction(b) - getTimestampFromTransaction(a);
        }
    );

    const adjustedTransactions = combinedTransactions.reduce(
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

    // Calculate how many placeholder items we need to add
    const transactionsCount = adjustedTransactions?.length || 0;
    const placeholdersNeeded = Math.max(0, 5 - transactionsCount);
    const listMarkup = (
        <ListItemWrapper>
            {adjustedTransactions?.map((tx, i) => {
                if (isTransactionInfo(tx)) {
                    return (
                        <HistoryListItem
                            key={`item-${i}-${tx.tx_id}`}
                            item={tx}
                            index={i}
                            itemIsNew={false}
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
                            setDetailsItem={() => setDetailsItem(tx)}
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
            {isFetchingNextPage || isFetching ? <LoadingDots /> : null}
        </ListItemWrapper>
    );

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
    const isLoading = walletScanning.is_scanning || !adjustedTransactions?.length;
    const emptyMarkup = isEmpty ? <LoadingText>{t('empty-tx')}</LoadingText> : null;
    return (
        <>
            <ListWrapper>
                {emptyMarkup}
                {baseMarkup}
                {/*added placeholder so the scroll can trigger fetch*/}
                {!isLoading ? <PlaceholderItem ref={ref} $isLast /> : null}
            </ListWrapper>
        </>
    );
}
