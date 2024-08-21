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

    const setDisplayBlockHeight = useMiningStore((s) => s.setDisplayBlockHeight);

    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const prevBalanceRef = useRef(previousBalance);
    const blockHeightRef = useRef(block_height);

    const getEarnings = useCallback(async () => {
        try {
            const change = previousBalance !== balance && prevBalanceRef.current !== previousBalance;
            if (change) {
                const diff = balance - previousBalance;
                console.log(`diff= ${diff}`);
                if (diff && diff > 0) {
                    return diff;
                } else {
                    return undefined;
                }
            } else {
                return undefined;
            }
        } catch {
            console.error('no beuno');
            return undefined;
        } finally {
            prevBalanceRef.current = previousBalance;
        }
    }, [balance, previousBalance]);

    useEffect(() => {
        console.log('blocks', block_height, blockHeightRef.current);
        if (block_height && block_height !== blockHeightRef.current) {
            const timeout = setTimeout(() => {
                getEarnings().then((earnings) => {
                    console.log(earnings);
                    if (earnings) {
                        setEarnings(earnings);
                    }
                    handleVisual(earnings ? 'success' : 'fail');
                    blockHeightRef.current = block_height;
                    setDisplayBlockHeight(blockHeightRef.current);
                });
            }, 10 * 1000);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [block_height, getEarnings, handleVisual, setDisplayBlockHeight, setEarnings]);
}
