import { useQuery } from '@tanstack/react-query';

import { BackendBridgeTransaction, useWalletStore } from '@app/store';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';

export const KEY_BRIDGE_TX = `bridge_transactions`;

export function useFetchBridgeTxHistory() {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning.is_scanning);

    return useQuery<BackendBridgeTransaction[]>({
        queryKey: [KEY_BRIDGE_TX, `address: ${walletAddress}`],
        queryFn: async () => {
            let txs: BackendBridgeTransaction[] = [];
            txs = await fetchBridgeTransactionsHistory(walletAddress);

            return txs;
        },
        placeholderData: [],
        initialData: [],
        enabled: !isWalletScanning,
    });
}
