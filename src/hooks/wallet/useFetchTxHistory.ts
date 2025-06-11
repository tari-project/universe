import { invoke } from '@tauri-apps/api/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@app/types/app-status.ts';
import { queryClient } from '@app/App/queryClient.ts';

import { useWalletStore } from '@app/store';

export const KEY_TX = `transactions`;

export function useFetchTxHistory() {
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning.is_scanning);
    return useInfiniteQuery<TransactionInfo[]>({
        queryKey: [KEY_TX],
        queryFn: async ({ pageParam }) => {
            const limit = 20;
            const offset = limit * (pageParam as number);

            return await invoke('get_transactions_history', { offset, limit });
        },
        initialPageParam: 0,
        getNextPageParam: (_lastPage, _allPages, _lastPageParam, _allPageParams) => {
            return (_lastPageParam as number) + 1;
        },
        enabled: !isWalletScanning,
    });
}

export const refreshTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: [KEY_TX] });
};
