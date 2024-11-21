import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useCallback, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export default function useEarningsRecap() {
    const recapIds = useBlockchainVisualisationStore((s) => s.recapIds);
    const handleWinRecap = useBlockchainVisualisationStore((s) => s.handleWinRecap);
    const transactions = useWalletStore((s) => s.transactions);

    const getMissedEarnings = useCallback(() => {
        if (recapIds.length && transactions.length) {
            const missedWins = transactions.filter((tx) => recapIds.includes(tx.tx_id));

            const count = missedWins.length;
            if (count > 0) {
                const totalEarnings = missedWins.reduce((earnings, cur) => earnings + cur.amount, 0);
                handleWinRecap({ count, totalEarnings });
            }
        }
    }, [handleWinRecap, recapIds, transactions]);

    useEffect(() => {
        const listener = listen<string>('tauri://focus', async (event) => {
            const minimized = await appWindow?.isMinimized();
            const documentIsVisible = document?.visibilityState === 'visible' || false;

            if (documentIsVisible && !minimized && event.windowLabel == 'main') {
                getMissedEarnings();
            }
        });

        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [getMissedEarnings, recapIds]);
}
