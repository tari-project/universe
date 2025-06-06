import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTransactionsHistory } from '@app/store';

import { TransactionInfo } from '@app/types/app-status.ts';

export function useFetchTxHistory() {
    return useInfiniteQuery<TransactionInfo[]>({
        queryKey: ['TransactionInffjdhkfkjdso'],
        queryFn: async ({ pageParam }) => {
            const pageLen = pageParam as number;
            const limit = Math.max(pageLen, 20);
            return await fetchTransactionsHistory({ offset: 0, limit });
        },
        initialPageParam: 1,
        getNextPageParam: (_lastPage, _allPages, lastPageParam, _allPageParams) => {
            return (lastPageParam as number) + 1;
        },
    });
}
