import { invoke } from '@tauri-apps/api/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@app/types/app-status.ts';
import { useWalletStore } from '@app/store';

const KEY_TX = `transactions`;

export function useFetchTxHistory() {
    const walletScanning = useWalletStore((s) => s.wallet_scanning.is_scanning);
    return useInfiniteQuery<TransactionInfo[]>({
        queryKey: [KEY_TX],
        queryFn: async ({ pageParam }) => {
            const limit = 6;
            const offset = limit * (pageParam as number);
            return await invoke('get_transactions_history', { offset, limit });
        },
        enabled: !walletScanning,
        initialPageParam: 0,
        getNextPageParam: (_lastPage, _allPages, _lastPageParam, _allPageParams) => {
            return (_lastPageParam as number) + 1;
        },
    });
}
