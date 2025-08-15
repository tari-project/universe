import { useQuery } from '@tanstack/react-query';

import { BackendBridgeTransaction, useConfigBEInMemoryStore, useWalletStore } from '@app/store';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';

export const KEY_BRIDGE_TX = `bridge_transactions`;

export function useFetchBridgeTxHistory() {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const baseUrl = useConfigBEInMemoryStore((s) => s.bridge_backend_api_url);

    return useQuery<BackendBridgeTransaction[]>({
        queryKey: [KEY_BRIDGE_TX, `address: ${walletAddress}`],
        queryFn: async () => await fetchBridgeTransactionsHistory(walletAddress),
        initialData: [],
        enabled: !!baseUrl?.length,
    });
}
