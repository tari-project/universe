import { useCallback, useEffect, RefObject } from 'react';
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

interface ListProps {
    setIsScrolled: (isScrolled: boolean) => void;
    targetRef: RefObject<HTMLDivElement> | null;
}

export function List({ setIsScrolled, targetRef }: ListProps) {
    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const walletImporting = useWalletStore((s) => s.is_wallet_importing);
    const { data, fetchNextPage, isFetchingNextPage, isFetching, hasNextPage } = useFetchTxHistory();

    const walletLoading = walletImporting || walletScanning?.is_scanning;

    useEffect(() => {
        const el = targetRef?.current;
        if (!el) return;
        const onScroll = () => setIsScrolled(el.scrollTop > 1);
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [targetRef, setIsScrolled]);

    const { ref } = useInView({
        initialInView: false,
        onChange: () => hasNextPage && !isFetching && fetchNextPage({ cancelRefetch: false }),
    });
    const transactions = data?.pages.flatMap((page) => page) || [];

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
    const transactionsCount = transactions?.length || 0;
    const placeholdersNeeded = Math.max(0, 5 - transactionsCount);
    const listMarkup = (
        <ListItemWrapper>
            {transactions?.map((tx, i) => {
                const txId = tx.walletTransactionDetails?.txId || tx.paymentId;
                const hash = tx.bridgeTransactionDetails?.transactionHash;
                const hasNoId = !txId && !hash?.length;

                const itemKey = `ListItem_${txId}-${hash}-${hasNoId ? i : ''}`;
                return (
                    <HistoryListItem
                        key={itemKey}
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
    const isEmpty = !walletLoading && !transactions?.length;
    const emptyMarkup = isEmpty ? <LoadingText>{t('empty-tx')}</LoadingText> : null;
    return (
        <>
            <ListWrapper>
                {emptyMarkup}
                {baseMarkup}
                {/*added placeholder so the scroll can trigger fetch*/}
                {!walletScanning?.is_scanning ? <PlaceholderItem ref={ref} $isLast /> : null}
            </ListWrapper>
        </>
    );
}
