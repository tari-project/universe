import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useInView } from 'motion/react';

import { useWalletStore } from '@app/store';

import { TransactionInfo } from '@app/types/app-status.ts';

import { useFetchTxHistory } from '@app/hooks/wallet/useFetchTxHistory.ts';

import ListLoadingAnimation from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/ListLoadingAnimation.tsx';
import { LoadingText } from '@app/containers/navigation/components/Wallet/ListLoadingAnimation/styles.ts';

import { HistoryListItem } from './ListItem.tsx';
import { PlaceholderItem } from './ListItem.styles.ts';
import { ListItemWrapper, ListWrapper } from './List.styles.ts';
import { setDetailsItem } from '@app/store/actions/walletStoreActions.ts';

export default function List() {
    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);

    const lastItemRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(lastItemRef);

    const { data, fetchNextPage, isFetching, isFetchingNextPage } = useFetchTxHistory();
    const transactions = data?.pages.flatMap((p) => p);
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

    useEffect(() => {
        if (isInView && !isFetching && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [fetchNextPage, isFetching, isFetchingNextPage, isInView]);

    // Calculate how many placeholder items we need to add
    const transactionsCount = transactions?.length || 0;
    const placeholdersNeeded = Math.max(0, 5 - transactionsCount);

    const listMarkup = (
        <ListItemWrapper>
            {transactions?.map((tx, i) => {
                return (
                    <HistoryListItem
                        key={tx.tx_id}
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

            {/* added last placeholder so the user can scroll above the bottom mask */}
            <PlaceholderItem ref={lastItemRef} />
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

    const isEmpty = !walletScanning.is_scanning && !transactions?.length;
    const emptyMarkup = isEmpty ? <LoadingText>{t('empty-tx')}</LoadingText> : null;
    return (
        <>
            <ListWrapper>
                {emptyMarkup}
                {baseMarkup}
            </ListWrapper>
        </>
    );
}
