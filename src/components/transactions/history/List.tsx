import { useCallback, useEffect, useMemo, RefObject } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { CombinedBridgeWalletTransaction, useWalletStore } from '@app/store';

import { useFetchTxHistory } from '@app/hooks/wallet/useFetchTxHistory.ts';

import ListLoadingAnimation from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/ListLoadingAnimation.tsx';
import { LoadingText } from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/styles.ts';

import { HistoryListItem } from './ListItem.tsx';
import { PlaceholderItem } from './ListItem.styles.ts';
import { ListItemWrapper, ListWrapper } from './List.styles.ts';
import { setDetailsItem } from '@app/store/actions/walletStoreActions.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

import { useFetchBridgeTxHistory } from '@app/hooks/wallet/useFetchBridgeTxHistory.ts';

interface Props {
    setIsScrolled: (isScrolled: boolean) => void;
    targetRef: RefObject<HTMLDivElement> | null;
}

export function List({ setIsScrolled, targetRef }: Props) {
    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const coldWalletAddress = useWalletStore((s) => s.cold_wallet_address);

    const { data, fetchNextPage, isFetchingNextPage, isFetching, hasNextPage } = useFetchTxHistory();
    const { data: bridgeTransactions } = useFetchBridgeTxHistory();

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

    const baseTx = useMemo(() => data?.pages.flatMap((page) => page) || [], [data?.pages]);

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
    }, [baseTx, bridgeTransactions, coldWalletAddress]);

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
