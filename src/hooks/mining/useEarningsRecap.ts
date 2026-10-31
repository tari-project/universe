import { handleWinRecap, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export default function useEarningsRecap() {
    const hasRecapIds = useBlockchainVisualisationStore((s) => s.recapIds.length > 0);

    useEffect(() => {
        if (!hasRecapIds) return;

        let cancelled = false;
        let unlistenFn: UnlistenFn | null = null;

        listen<string>('tauri://focus', () => {
            if (cancelled || document?.visibilityState !== 'visible') return;
            const recapIds = useBlockchainVisualisationStore.getState().recapIds;
            if (!recapIds.length) return;

            const transactions = useWalletStore.getState().wallet_transactions;
            const missedWins = transactions.filter((tx) => tx.source === 'coinbase' && recapIds.includes(tx.id));
            if (missedWins.length > 0) {
                const totalEarnings = missedWins.reduce((earnings, cur) => earnings + cur.amount, 0);
                handleWinRecap({ count: missedWins.length, totalEarnings });
            }
        }).then((unlisten) => {
            if (cancelled) {
                unlisten();
            } else {
                unlistenFn = unlisten;
            }
        });

        return () => {
            cancelled = true;
            unlistenFn?.();
        };
    }, [hasRecapIds]);
}
