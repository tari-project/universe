import { useInfiniteQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@app/types/app-status.ts';
import { queryClient } from '@app/App/queryClient.ts';

import { useWalletStore } from '@app/store';
import { fetchTransactionsHistory } from '@app/store/actions/walletStoreActions';

export const KEY_TX = `transactions`;

export function useFetchTxHistory() {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning.is_scanning);
    const filter = useWalletStore((s) => s.tx_history_filter);

    return useInfiniteQuery<TransactionInfo[]>({
        queryKey: [KEY_TX, `address: ${walletAddress}`, `filter: ${filter}`],
        queryFn: async ({ pageParam }) => {
            const limit = 20;
            const offset = limit * (pageParam as number);

            return await fetchTransactionsHistory({ filter, offset, limit });
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
