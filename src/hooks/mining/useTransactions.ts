import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api';

export default function useFetchTx() {
    const setError = useAppStateStore((s) => s.setError);
    const setTransactionsLoading = useWalletStore((s) => s.setTransactionsLoading);
    const setTransactions = useWalletStore((s) => s.setTransactions);
    return useCallback(async () => {
        setTransactionsLoading(true);
        try {
            const txs = await invoke('get_transaction_history');
            const sortedTransactions = txs.sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(sortedTransactions);
        } catch (error) {
            setError('Could not get transaction history');
            console.error('Could not get transaction history: ', error);
        } finally {
            setTransactionsLoading(false);
        }
    }, [setError, setTransactions, setTransactionsLoading]);
}
