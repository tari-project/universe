import { useInfiniteQuery } from '@tanstack/react-query';
import { queryClient } from '@app/App/queryClient.ts';
import { CombinedBridgeWalletTransaction, useWalletStore } from '@app/store';
import { fetchTransactionsHistory } from '@app/store/actions/walletStoreActions';
import { convertWalletTransactionToCombinedTransaction } from '@app/components/transactions/history/helpers.ts';

export const KEY_TX = `transactions`;

export function useFetchTxHistory() {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning.is_scanning);
    const filter = useWalletStore((s) => s.tx_history_filter);

    return useInfiniteQuery<CombinedBridgeWalletTransaction[]>({
        queryKey: [KEY_TX, `address: ${walletAddress}`, `filter: ${filter}`],
        queryFn: async ({ pageParam }) => {
            const limit = 20;
            const offset = limit * (pageParam as number);
            console.debug(`called from HOOK`);
            const res = await fetchTransactionsHistory({ filter, offset, limit });

            return res.map(convertWalletTransactionToCombinedTransaction);
        },
        initialPageParam: 0,
        getNextPageParam: (_lastPage, _allPages, _lastPageParam, _allPageParams) => {
            return (_lastPageParam as number) + 1;
        },
        enabled: !isWalletScanning,
        initialData: { pages: [], pageParams: [0] },
    });
}

export const refreshTransactions = async () => {
    console.debug('REFRESH');
    // await queryClient.invalidateQueries({ queryKey: [KEY_TX] });
};
