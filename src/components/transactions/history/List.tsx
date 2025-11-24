import { useCallback, useEffect, RefObject } from 'react';
import { useOnInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import { CombinedBridgeWalletTransaction, useWalletStore } from '@app/store';

import { useFetchTxHistory } from '@app/hooks/wallet/useFetchTxHistory.ts';

import { HistoryListItem } from './ListItem.tsx';
import { PlaceholderItem } from './ListItem.styles.ts';
import { EmptyText, ListItemWrapper, ListWrapper } from './List.styles.ts';
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
    const walletIsLoading = useWalletStore((s) => s.isLoading);
    const { data, fetchNextPage, isFetchingNextPage, isFetching, hasNextPage } = useFetchTxHistory();

    // TODO clean up
    const walletLoading = walletImporting || walletScanning?.is_scanning || isFetching || walletIsLoading;

    useEffect(() => {
        const el = targetRef?.current;
        if (!el) return;
        const onScroll = () => setIsScrolled(el.scrollTop > 1);
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [targetRef, setIsScrolled]);

    const ref = useOnInView((inView) => {
        if (inView && hasNextPage && !isFetching) {
            void fetchNextPage({ cancelRefetch: false });
        }
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
                return <HistoryListItem key={itemKey} item={tx} index={i} setDetailsItem={handleDetailsChange} />;
            })}

            {/* fill the list with placeholders if there are less than 4 entries */}
            {Array.from({ length: placeholdersNeeded }).map((_, index) => (
                <PlaceholderItem key={`placeholder-${index}`} />
            ))}
            {isFetchingNextPage || isFetching ? <LoadingDots /> : null}
        </ListItemWrapper>
    );

    const isEmpty = !walletLoading && !transactions?.length;
    const emptyMarkup = isEmpty ? <EmptyText>{t('empty-tx')}</EmptyText> : null;
    return (
        <ListWrapper>
            {emptyMarkup}
            {listMarkup}
            {/*added placeholder so the scroll can trigger fetch*/}
            {!walletScanning?.is_scanning ? <PlaceholderItem ref={ref} $isLast /> : null}
        </ListWrapper>
    );
}
