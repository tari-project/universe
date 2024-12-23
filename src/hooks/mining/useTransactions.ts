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

    const setItems = useCallback(
        async (newTx: Transaction[]) => {
            const latestTx = newTx[0];
            const latestId = latestTx?.tx_id;
            const hasNewItems = transactions?.find((tx) => tx.tx_id === latestId);
            if (hasNewItems) {
                setTransactions(newTx);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [transactions]
    );

    return useCallback(async () => {
        if (isTransactionLoading || setupProgress < 0.75) return;
        setTransactionsLoading(true);

        try {
            const txs = await invoke('get_transaction_history');
            const sortedTransactions = txs.sort((a, b) => b.timestamp - a.timestamp);
            const mapped = sortedTransactions?.map((tx) => {
                return { ...tx, blockHeight: tx.mined_in_block_height };
            }) as Transaction[];

            if (mapped?.length) {
                await setItems(mapped);
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
