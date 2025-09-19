import { useInfiniteQuery } from '@tanstack/react-query';
import { queryClient } from '@app/App/queryClient.ts';
import { useConfigBEInMemoryStore, useConfigUIStore, useWalletStore } from '@app/store';
import { fetchTransactionsHistory } from '@app/store/actions/walletStoreActions';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';
import { mergeTransactionLists, shouldRefetchBridgeItems } from './helpers.ts';

export const KEY_TX = `transactions`;

async function baseQuery({ pageParam, filter, walletAddress }) {
    const limit = 20;
    const offset = limit * (pageParam as number);
    try {
        const walletTransactions = await fetchTransactionsHistory({ offset, limit, filter });
        let bridgeTransactions = await fetchBridgeTransactionsHistory(walletAddress);
        let mergedList = mergeTransactionLists({ walletTransactions, bridgeTransactions });
        const shouldRefetch = shouldRefetchBridgeItems({ walletTransactions: mergedList, bridgeTransactions });

        if (shouldRefetch) {
            bridgeTransactions = await fetchBridgeTransactionsHistory(walletAddress);
            mergedList = mergeTransactionLists({ walletTransactions, bridgeTransactions });
        }

        return mergedList;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export function useFetchTxHistory() {
    const walletUiMode = useConfigUIStore((s) => s.wallet_ui_mode);
    const baseUrl = useConfigBEInMemoryStore((s) => s.bridge_backend_api_url);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const filter = useWalletStore((s) => s.tx_history_filter);

    const baseQueryKeys = [KEY_TX, { walletAddress, walletUiMode }];
    const queriesEnabled = Boolean(walletAddress?.length && !!baseUrl?.length);

    return useInfiniteQuery({
        queryKey: [...baseQueryKeys, { filter }],
        queryFn: async ({ pageParam }) => await baseQuery({ pageParam, filter, walletAddress }),
        enabled: queriesEnabled,
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage?.length === 0) {
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
        refetchInterval: 1000 * 60 * 15,
        refetchIntervalInBackground: true,
    });
}

export const refreshTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: [KEY_TX] });
};
