import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { TransactionInfo } from '@app/types/app-status.ts';
import * as Sentry from '@sentry/react';

export default function useFetchTx() {
    const transactions = useWalletStore((s) => s.transactions);
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const setTransactionsLoading = useWalletStore((s) => s.setTransactionsLoading);

    const setTransactions = useWalletStore((s) => s.setTransactions);
    const setError = useAppStateStore((s) => s.setError);

    const setItems = useCallback(
        async (newTx: TransactionInfo[]) => {
            const latestTx = newTx[0];
            const latestId = latestTx?.tx_id;
            const hasNewItems = !transactions?.find((tx) => tx.tx_id === latestId);

            if (hasNewItems) {
                setTransactions(newTx);
            }
        },
        [setTransactions, transactions]
    );

    return useCallback(async () => {
        if (isTransactionLoading) return;
        setTransactionsLoading(true);
        try {
            const txs = await invoke('get_transaction_history');
            const sortedTransactions = txs.sort((a, b) => b.timestamp - a.timestamp);

            if (sortedTransactions?.length) {
                await setItems(sortedTransactions);
            }
        } catch (error) {
            Sentry.captureException(error);
            setError('Could not get transaction history');
            console.error('Could not get transaction history: ', error);
        } finally {
            setTransactionsLoading(false);
        }
    }, [isTransactionLoading, setError, setItems, setTransactionsLoading]);
}
