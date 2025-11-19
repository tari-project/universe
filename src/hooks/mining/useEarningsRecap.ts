import { handleWinRecap, useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useCallback, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { OutputType } from '@app/types/app-status';

export default function useEarningsRecap() {
    const recapIds = useBlockchainVisualisationStore((s) => s.recapIds);
    const transactions = useWalletStore((s) => s.wallet_transactions);
    const coinbase_transactions = useMemo(() => {
        return transactions.filter((tx) =>
            tx.operations.some((op) => op.recieved_output_details?.output_type === OutputType.Coinbase)
        );
    }, [transactions]);

    const getMissedEarnings = useCallback(() => {
        if (recapIds.length && coinbase_transactions.length) {
            const missedWins = coinbase_transactions.filter((tx) => recapIds.includes(tx.id));
            const count = missedWins.length;
            if (count > 0) {
                const totalEarnings = missedWins.reduce((earnings, cur) => earnings + cur.transaction_balance, 0);
                handleWinRecap({ count, totalEarnings });
            }
        }
    }, [recapIds, coinbase_transactions]);

    useEffect(() => {
        const listener = listen<string>('tauri://focus', () => {
            const documentIsVisible = document?.visibilityState === 'visible' || false;
            if (documentIsVisible) {
                getMissedEarnings();
            }
        });

        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [getMissedEarnings, recapIds]);
}
