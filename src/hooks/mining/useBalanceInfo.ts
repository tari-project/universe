import useWalletStore from '@app/store/walletStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useCallback, useEffect, useRef } from 'react';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

export default function useBalanceInfo() {
    const handleVisual = useVisualisation();

    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const toggleTimerPaused = useMiningStore((s) => s.toggleTimerPaused);

    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const balanceRef = useRef(balance);
    const blockHeightRef = useRef(block_height);

    const getEarnings = useCallback(async () => {
        try {
            const change = balanceRef.current !== balance;
            if (change) {
                balanceRef.current = balance;
                const diff = balance - previousBalance;
                if (diff && diff > 0) {
                    return diff;
                }
            }
        } catch {
            console.error('no beuno');
        }
    }, [balance, previousBalance]);

    const handleNewBlock = useCallback(
        async (newBlock: number) => {
            toggleTimerPaused();
            const earnings = await getEarnings();
            if (earnings) {
                setEarnings(earnings);
            }
            blockHeightRef.current = newBlock;

            return () => {
                handleVisual(earnings ? 'success' : 'fail');
                toggleTimerPaused();
            };
        },
        [getEarnings, handleVisual, setEarnings, toggleTimerPaused]
    );

    useEffect(() => {
        if (block_height && block_height !== blockHeightRef.current) {
            const p = handleNewBlock(block_height);
            return () => {
                p.then((x) => x());
            };
        }
    }, [block_height, getEarnings, handleNewBlock]);
}
