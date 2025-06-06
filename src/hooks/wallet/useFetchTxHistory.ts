import { invoke } from '@tauri-apps/api/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@app/types/app-status.ts';

export function useFetchTxHistory() {
    return useInfiniteQuery<TransactionInfo[]>({
        queryKey: ['aightbet'],
        queryFn: async ({ pageParam }) => {
            const limit = 6;
            const offset = limit * (pageParam as number);
            return await invoke('get_transactions_history', { offset, limit });
        },
        initialPageParam: 0,
        getNextPageParam: (_lastPage, _allPages, _lastPageParam, _allPageParams) => {
            return (_lastPageParam as number) + 1;
        },
    });
}
