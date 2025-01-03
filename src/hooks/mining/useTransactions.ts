import { ALREADY_FETCHING } from '@app/App/sentryIgnore';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export default function useFetchTx() {
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const setTransactionsLoading = useWalletStore((s) => s.setTransactionsLoading);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const setTransactions = useWalletStore((s) => s.setTransactions);

    return useCallback(async () => {
        if (isTransactionLoading || setupProgress < 0.75) return;
        setTransactionsLoading(true);

        try {
            const txs = await invoke('get_transaction_history', { continuation: false, itemsLength: 20 });
            const sortedTransactions = txs.sort((a, b) => b.timestamp - a.timestamp);
            if (sortedTransactions?.length) {
                setTransactions(sortedTransactions);
            }
            setTransactionsLoading(false);
        } catch (error) {
            setTransactionsLoading(false);

            if (error !== ALREADY_FETCHING.HISTORY) {
                console.error('Could not get transaction history: ', error);
            }
        } finally {
            setTransactionsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTransactionLoading, setupProgress]);
}
