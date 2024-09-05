import { useCallback, useEffect, useRef, useState } from 'react';
import { useWalletStore } from '@app/store/walletStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

const TIMER_VALUE = 15 * 1000; // 15s
export default function useBalanceInfo() {
    const handleVisual = useVisualisation();

    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const balanceDiff = useWalletStore((state) => state.balanceDiff);
    const block_height = useBaseNodeStatusStore((s) => s.block_height);

    const [balanceChangeBlock, setBalanceChangeBlock] = useState<number | null>(null);

    const {
        setEarnings,
        setDisplayBlockHeight,
        setTimerPaused,
        postBlockAnimation,
        setPostBlockAnimation,
        timerPaused,
    } = useMiningStore((s) => s);

    const blockHeightRef = useRef(block_height);
    const prevBalanceRef = useRef(balance);

    const handleEarnings = useCallback(() => {
        setTimerPaused(true);
        const hasChanges = prevBalanceRef.current !== balance;

        if (hasChanges) {
            console.info('New Balance:', balance);
            console.info('Previous Balance:', previousBalance);
            console.info('Diff/Earnings:', balanceDiff);

            prevBalanceRef.current = balance;
        }

        const diff = hasChanges ? balance - previousBalance : 0;
        const hasEarnings = Boolean(diff && diff > 0 && diff === balanceDiff);

        if (hasEarnings) {
            setEarnings(diff);
        }
        handleVisual(!hasEarnings ? 'fail' : 'success');
    }, [balance, balanceDiff, handleVisual, previousBalance, setEarnings, setTimerPaused]);

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
