import { useCallback, useEffect, useRef, useState } from 'react';
import useWalletStore from '@app/store/walletStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

const TIMER_VALUE = 15 * 1000; // 15s
export default function useBalanceInfo() {
    const handleVisual = useVisualisation();
    const [balanceChangeBlock, setBalanceChangeBlock] = useState<number | null>(null);

    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const block_height = useBaseNodeStatusStore((s) => s.block_height);

    const {
        setEarnings,
        setDisplayBlockHeight,
        setTimerPaused,
        postBlockAnimation,
        setPostBlockAnimation,
        setShowFailAnimation,
        timerPaused,
    } = useMiningStore((s) => s);

    const blockHeightRef = useRef(block_height);
    const prevBalanceRef = useRef(balance);

    const handleEarnings = useCallback(() => {
        setTimerPaused(true);
        const hasChanges = prevBalanceRef.current !== balance;
        const diff = hasChanges ? balance - previousBalance : 0;
        const hasEarnings = Boolean(diff && diff > 0);
        if (hasEarnings) {
            setEarnings(diff);
        }
        setShowFailAnimation(!hasEarnings);
        handleVisual(!hasEarnings ? 'fail' : 'success');
        prevBalanceRef.current = previousBalance;
    }, [balance, handleVisual, previousBalance, setEarnings, setShowFailAnimation, setTimerPaused]);

    const resetStates = useCallback(() => {
        setPostBlockAnimation(false);
        setDisplayBlockHeight(blockHeightRef.current);
        setEarnings(undefined);
    }, [setDisplayBlockHeight, setEarnings, setPostBlockAnimation]);

    useEffect(() => {
        if (prevBalanceRef.current !== previousBalance) {
            setBalanceChangeBlock(block_height);
        }
    }, [block_height, previousBalance]);

    useEffect(() => {
        if ((block_height && block_height !== blockHeightRef.current) || !!balanceChangeBlock) {
            const timer = balanceChangeBlock === block_height ? 1 : TIMER_VALUE;
            blockHeightRef.current = block_height;
            const timeout = setTimeout(() => {
                handleEarnings();
                setBalanceChangeBlock(null);
            }, timer);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [balanceChangeBlock, block_height, handleEarnings]);

    useEffect(() => {
        if (postBlockAnimation && !timerPaused) {
            const blockTimeout = setTimeout(() => {
                resetStates();
            }, 1000);

            return () => {
                clearTimeout(blockTimeout);
            };
        }
    }, [postBlockAnimation, resetStates, timerPaused]);
}
