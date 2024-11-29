import { ALREADY_FETCHING } from '@app/App/sentryIgnore';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { Transaction } from '@app/types/wallet.ts';

export default function useFetchTx() {
    const transactions = useWalletStore((s) => s.transactions);
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const setTransactionsLoading = useWalletStore((s) => s.setTransactionsLoading);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const setTransactions = useWalletStore((s) => s.setTransactions);
    const setError = useAppStateStore((s) => s.setError);

    const setItems = useCallback(
        async (newTx: Transaction[]) => {
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
        if (isTransactionLoading || setupProgress < 0.75) return;
        setTransactionsLoading(true);

        try {
            const txs = await invoke('get_transaction_history');
            const sortedTransactions = txs.sort((a, b) => b.timestamp - a.timestamp);
            const mapped = sortedTransactions?.map((tx) => {
                const blockHeight = tx.message.split(': ')[1];

                if (blockHeight) {
                    return { ...tx, blockHeight };
                }

                return tx;
            }) as Transaction[];

            if (mapped?.length) {
                await setItems(mapped);
            }
            setTransactionsLoading(false);
        } catch (error) {
            setTransactionsLoading(false);
            setError('Could not get transaction history');
            if (error !== ALREADY_FETCHING.HISTORY) {
                console.error('Could not get transaction history: ', error);
            }
        }
    }, [isTransactionLoading, setError, setItems, setTransactionsLoading, setupProgress]);
}
