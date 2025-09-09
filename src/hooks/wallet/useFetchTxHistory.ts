import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryClient } from '@app/App/queryClient.ts';
import { BackendBridgeTransaction, useConfigBEInMemoryStore, useWalletStore } from '@app/store';
import { fetchTransactionsHistory } from '@app/store/actions/walletStoreActions';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';
import { mergeTransactionLists, shouldRefetchBridgeItems } from './helpers.ts';

export const KEY_TX = `transactions`;
export const KEY_BRIDGE_TX = `bridge`;

export function useFetchTxHistory() {
    const baseUrl = useConfigBEInMemoryStore((s) => s.bridge_backend_api_url);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const filter = useWalletStore((s) => s.tx_history_filter);

    const queriesEnabled = Boolean(walletAddress?.length);
    const baseQueryKeys = [KEY_TX, `walletAddress: ${walletAddress}`];

    const { data: bridgeTransactions, refetch: refetchBridgeTxs } = useQuery<BackendBridgeTransaction[]>({
        queryKey: [...baseQueryKeys, KEY_BRIDGE_TX],
        queryFn: async () => await fetchBridgeTransactionsHistory(walletAddress),
        enabled: !!baseUrl?.length && queriesEnabled,
    });

    return useInfiniteQuery({
        queryKey: [...baseQueryKeys, `filter: ${filter}`],
        queryFn: async ({ pageParam }) => {
            const limit = 20;
            const offset = limit * (pageParam as number);
            const walletTransactions = await fetchTransactionsHistory({ filter, offset, limit });

            let mergedList = mergeTransactionLists({ walletTransactions, bridgeTransactions });

            if (shouldRefetchBridgeItems({ walletTransactions: mergedList, bridgeTransactions })) {
                await refetchBridgeTxs();
                mergedList = mergeTransactionLists({ walletTransactions, bridgeTransactions });
            }
            return mergedList;
        },
        enabled: queriesEnabled,
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.length === 0) {
                return undefined;
            }
            return lastPageParam + 1;
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
            if (firstPageParam <= 1) {
                return undefined;
            }
            return firstPageParam - 1;
        },
    });
}

export const refreshTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: [KEY_TX] });
};
