import { useQuery } from '@tanstack/react-query';

import { BackendBridgeTransaction, useWalletStore } from '@app/store';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';

export const KEY_BRIDGE_TX = `bridge_transactions`;

interface FetchBridgeArgs {
    latestWalletTxId?: number;
}

export function useFetchBridgeTxHistory({ latestWalletTxId }: FetchBridgeArgs) {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);

    return useQuery<BackendBridgeTransaction[]>({
        queryKey: [KEY_BRIDGE_TX, `address: ${walletAddress}`, `latestWalletTxId: ${latestWalletTxId}`],
        queryFn: async () => {
            const res = await fetchBridgeTransactionsHistory(walletAddress);
            console.debug(res);

            return res;
        },
        placeholderData: [],
        initialData: [],
    });
}
