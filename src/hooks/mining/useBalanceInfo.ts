import { useCallback, useEffect, useRef, useState } from 'react';
import useWalletStore from '@app/store/walletStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

const TIMER_VALUE = 15 * 1000; // 15s
export default function useBalanceInfo() {
    const [balanceChangeBlock, setBalanceChangeBlock] = useState<number | null>(null);
    const handleVisual = useVisualisation();

    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const setDisplayBlockHeight = useMiningStore((s) => s.setDisplayBlockHeight);
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);
    const postBlockAnimation = useMiningStore((s) => s.postBlockAnimation);
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const timerPaused = useMiningStore((s) => s.timerPaused);
    const blockHeightRef = useRef(block_height);
    const prevBalanceRef = useRef(previousBalance);

    const handleEarnings = useCallback(() => {
        setTimerPaused(true);
        const hasChanges = prevBalanceRef.current !== previousBalance;
        const diff = hasChanges ? balance - previousBalance : 0;
        const hasEarnings = Boolean(diff && diff > 0);
        if (hasEarnings) {
            setEarnings(diff);
        }
        handleVisual(!hasEarnings ? 'fail' : 'success');
        prevBalanceRef.current = previousBalance;
    }, [balance, handleVisual, previousBalance, setEarnings, setTimerPaused]);

    useEffect(() => {
        if (prevBalanceRef.current !== previousBalance) {
            setBalanceChangeBlock(block_height);
        }
    }, [previousBalance, block_height]);

    useEffect(() => {
        if ((block_height && block_height !== blockHeightRef.current) || !!balanceChangeBlock) {
            const timer = balanceChangeBlock === block_height ? 1 : TIMER_VALUE;
            const timeout = setTimeout(() => {
                handleEarnings();
                setBalanceChangeBlock(null);
                blockHeightRef.current = block_height;
            }, timer);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [balanceChangeBlock, block_height, handleEarnings]);

    useEffect(() => {
        if (postBlockAnimation && !timerPaused) {
            const blockTimeout = setTimeout(() => {
                setPostBlockAnimation(false);
                setDisplayBlockHeight(blockHeightRef.current);
                setEarnings(undefined);
            }, 1000);

            return () => {
                clearTimeout(blockTimeout);
            };
        }
    }, [postBlockAnimation, setDisplayBlockHeight, setEarnings, setPostBlockAnimation, timerPaused]);
}
