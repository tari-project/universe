import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryClient } from '@app/App/queryClient.ts';
import {
    BackendBridgeTransaction,
    CombinedBridgeWalletTransaction,
    useConfigBEInMemoryStore,
    useWalletStore,
} from '@app/store';
import { fetchTransactionsHistory } from '@app/store/actions/walletStoreActions';
import { convertWalletTransactionToCombinedTransaction } from '@app/components/transactions/history/helpers.ts';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';

export const KEY_TX = `transactions`;
export const KEY_BRIDGE_TX = `bridge`;

export function useFetchTxHistory() {
    const baseUrl = useConfigBEInMemoryStore((s) => s.bridge_backend_api_url);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const coldWalletAddress = useWalletStore((s) => s.cold_wallet_address);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const filter = useWalletStore((s) => s.tx_history_filter);

    const { data: bridgeTransactions } = useQuery<BackendBridgeTransaction[]>({
        queryKey: [KEY_TX, KEY_BRIDGE_TX, `walletAddress: ${walletAddress}`],
        queryFn: async () => {
            return await fetchBridgeTransactionsHistory(walletAddress);
        },
        enabled: !!baseUrl?.length && !!walletAddress?.length,
        initialData: [],
    });

    return useInfiniteQuery({
        queryKey: [KEY_TX, `filter: ${filter}`, `walletAddress: ${walletAddress}`],
        queryFn: async ({ pageParam }) => {
            const limit = 20;
            const offset = limit * (pageParam as number);
            return await fetchTransactionsHistory({ filter, offset, limit });
        },
        select: (data) => {
            const txs = data.pages.flatMap((p) => p) || [];
            const converted = txs.map(convertWalletTransactionToCombinedTransaction);

            const extendedTransactions: CombinedBridgeWalletTransaction[] = [...converted];
            bridgeTransactions?.forEach((bridgeTx) => {
                // If the bridge transaction has no paymentId, we try to find it by tokenAmount and destinationAddress which should equal the cold wallet address
                // This supports older transactions that might not have a paymentId
                const depracatedWalletTransactionIndex = extendedTransactions.findIndex(
                    (tx) =>
                        !bridgeTx.paymentId &&
                        tx.tokenAmount === Number(bridgeTx.tokenAmount) &&
                        tx.destinationAddress === coldWalletAddress
                );

                // Currently we can find the bridge transaction by paymentId
                const originalWalletBridgeTransactionIndex = extendedTransactions.findIndex(
                    (tx) => tx.paymentId === bridgeTx.paymentId
                );

                // Index found by paymentId should be always preferred, but if it is not found we use the deprecated method if exists
                const walletBridgeTransactionIndex =
                    originalWalletBridgeTransactionIndex >= 0
                        ? originalWalletBridgeTransactionIndex
                        : depracatedWalletTransactionIndex;

                // Don't process if we can't find the transaction in the wallet transactions
                if (walletBridgeTransactionIndex < 0) return;

                extendedTransactions[walletBridgeTransactionIndex] = {
                    ...extendedTransactions[walletBridgeTransactionIndex],
                    bridgeTransactionDetails: {
                        status: bridgeTx.status,
                        transactionHash: bridgeTx.transactionHash,
                        amountAfterFee: bridgeTx.amountAfterFee,
                    },
                };
            });
            return { ...data, pages: extendedTransactions };
        },
        initialPageParam: 0,
        getNextPageParam: (_lastPage, _allPages, _lastPageParam, _allPageParams) => {
            return (_lastPageParam as number) + 1;
        },
        enabled: !isWalletScanning && !!walletAddress?.length,
    });
}

export const refreshTransactions = async () => {
    await queryClient.invalidateQueries({ queryKey: [KEY_TX] });
};
