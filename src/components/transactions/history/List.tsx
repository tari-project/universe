import { useCallback, useEffect, useMemo, useRef, RefObject } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { CombinedBridgeWalletTransaction, useMiningMetricsStore, useWalletStore } from '@app/store';

import { useFetchTxHistory } from '@app/hooks/wallet/useFetchTxHistory.ts';

import ListLoadingAnimation from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/ListLoadingAnimation.tsx';
import { LoadingText } from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/styles.ts';

import { HistoryListItem } from './ListItem.tsx';
import { PlaceholderItem } from './ListItem.styles.ts';
import { ListItemWrapper, ListWrapper } from './List.styles.ts';
import { setDetailsItem } from '@app/store/actions/walletStoreActions.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { convertWalletTransactionToCombinedTransaction } from './helpers.ts';
import { TariAddressType } from '@app/types/events-payloads.ts';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';

interface Props {
    setIsScrolled: (isScrolled: boolean) => void;
    targetRef: RefObject<HTMLDivElement> | null;
}

export function List({ setIsScrolled, targetRef }: Props) {
    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const bridgeTransactions = useWalletStore((s) => s.bridge_transactions);
    const currentBlockHeight = useMiningMetricsStore((s) => s.base_node_status.block_height);
    const coldWalletAddress = useWalletStore((s) => s.cold_wallet_address);
    const tariAddress = useWalletStore((s) => s.tari_address_base58);
    const tx_history_filter = useWalletStore((s) => s.tx_history_filter);
    const tariAddressType = useWalletStore((s) => s.tari_address_type);
    const { data, fetchNextPage, isFetchingNextPage, isFetching, hasNextPage } = useFetchTxHistory();
    const isFetchBridgeTransactionsFailed = useRef(false);
    const convertedTransactions: RefObject<CombinedBridgeWalletTransaction[]> = useRef([]);
    const lastTransactionFilter = useRef(tx_history_filter);

    useEffect(() => {
        const el = targetRef?.current;
        if (!el) return;
        const onScroll = () => setIsScrolled(el.scrollTop > 1);
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [targetRef, setIsScrolled]);

    const { ref } = useInView({
        initialInView: false,
        onChange: () => hasNextPage && fetchNextPage(),
    });

    const latestTxId = data?.pages?.[0]?.[0]?.tx_id;
    const baseTx = useMemo(() => {
        const latestConvertedTxId = convertedTransactions.current[0]?.walletTransactionDetails.txId;
        if (latestTxId && latestTxId != latestConvertedTxId) {
            convertedTransactions.current = [];
        }
        // We are caching converted transactions to avoid re-converting all of them on every execution
        // If someone have 200 transactions it is more efficient to convert only new ~20 then 200
        const sanitizedData = data?.pages.flatMap((page) => page) || [];
        const startingIndex =
            lastTransactionFilter.current === tx_history_filter ? convertedTransactions.current.length : 0;
        const newTransactions = sanitizedData.slice(startingIndex);
        const converted = newTransactions.map((transaction) =>
            convertWalletTransactionToCombinedTransaction(transaction)
        );

        if (lastTransactionFilter.current !== tx_history_filter) {
            convertedTransactions.current = [];
            lastTransactionFilter.current = tx_history_filter;
        }

        convertedTransactions.current = [...convertedTransactions.current, ...converted];
        return convertedTransactions.current;
    }, [latestTxId, data?.pages.length, tx_history_filter]); // Re-run only when the number of pages changes

    useEffect(() => {
        const isThereANewBridgeTransaction = baseTx.find(
            (tx) =>
                tx.destinationAddress === coldWalletAddress &&
                !bridgeTransactions.some(
                    (bridgeTx) => bridgeTx.paymentId === tx.paymentId && Number(bridgeTx.tokenAmount) === tx.tokenAmount
                )
        );

        const isThereEmptyBridgeTransactionAndFoundInWallet = baseTx.find(
            (tx) => tx.destinationAddress === coldWalletAddress && bridgeTransactions.length === 0
        );

        if (
            tariAddressType === TariAddressType.Internal &&
            !isFetchBridgeTransactionsFailed.current &&
            (isThereANewBridgeTransaction || isThereEmptyBridgeTransactionAndFoundInWallet)
        ) {
            fetchBridgeTransactionsHistory().catch(() => {
                if (!isFetchBridgeTransactionsFailed.current) {
                    isFetchBridgeTransactionsFailed.current = true;
                }
            });
        }
    }, [baseTx, bridgeTransactions, coldWalletAddress, currentBlockHeight, tariAddress, tariAddressType]);

    const adjustedTransactions: CombinedBridgeWalletTransaction[] = useMemo(() => {
        const extendedTransactions: CombinedBridgeWalletTransaction[] = [...baseTx];
        bridgeTransactions.forEach((bridgeTx) => {
            // If the bridge transaction has no paymentId, we try to find it by tokenAmount and destinationAddress which should equal the cold wallet address
            // This supports older transactions that might not have a paymentId
            const depracatedWalletTransactionIndex = extendedTransactions.findIndex(
                (tx) =>
                    !bridgeTx.paymentId &&
                    tx.tokenAmount === Number(bridgeTx.tokenAmount) &&
                    tx.destinationAddress === coldWalletAddress
            );

            // Currently we can find the bridge transaction by paymentId
            const originalWalletBridgeTransactionIndex = extendedTransactions.findIndex(
                (tx) => tx.paymentId === bridgeTx.paymentId
            );

            // Index found by paymentId should be always preferred, but if it is not found we use the deprecated method if exists
            const walletBridgeTransactionIndex =
                originalWalletBridgeTransactionIndex >= 0
                    ? originalWalletBridgeTransactionIndex
                    : depracatedWalletTransactionIndex;

            // Don't process if we can't find the transaction in the wallet transactions
            if (walletBridgeTransactionIndex < 0) return;

            extendedTransactions[walletBridgeTransactionIndex] = {
                ...extendedTransactions[walletBridgeTransactionIndex],
                bridgeTransactionDetails: {
                    status: bridgeTx.status,
                    transactionHash: bridgeTx.transactionHash,
                    amountAfterFee: bridgeTx.amountAfterFee,
                },
            };
        });

        return extendedTransactions;
    }, [baseTx, bridgeTransactions]);

    const handleDetailsChange = useCallback(async (transaction: CombinedBridgeWalletTransaction | null) => {
        if (!transaction || !transaction.walletTransactionDetails) {
            setDetailsItem(null);
            return;
        }
        const dest_address_emoji = await invoke('parse_tari_address', { address: transaction.destinationAddress })
            .then((result) => result?.emoji_string)
            .catch(() => undefined);

        setDetailsItem({
            ...transaction,
            walletTransactionDetails: {
                ...transaction.walletTransactionDetails,
                destAddressEmoji: dest_address_emoji,
            },
        });
    }, []);

    // Calculate how many placeholder items we need to add
    const transactionsCount = adjustedTransactions?.length || 0;
    const placeholdersNeeded = Math.max(0, 5 - transactionsCount);
    const listMarkup = (
        <ListItemWrapper>
            {adjustedTransactions?.map((tx, i) => {
                return (
                    <HistoryListItem
                        key={`item-${i}-${tx.walletTransactionDetails.txId}`}
                        item={tx}
                        index={i}
                        itemIsNew={false}
                        setDetailsItem={handleDetailsChange}
                    />
                );
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
