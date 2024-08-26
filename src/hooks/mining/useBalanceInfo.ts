import { useCallback, useEffect, useRef, useState } from 'react';
import useWalletStore from '@app/store/walletStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

const TIMER_VALUE = 10 * 1000; //10s
export default function useBalanceInfo() {
    const [balanceChangeBlock, setBalanceChangeBlock] = useState<number | null>(null);
    const handleVisual = useVisualisation();

    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const setDisplayBlockHeight = useMiningStore((s) => s.setDisplayBlockHeight);
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const toggleTimerPaused = useMiningStore((s) => s.toggleTimerPaused);
    const postBlockAnimation = useMiningStore((s) => s.postBlockAnimation);
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);

    const blockHeightRef = useRef(block_height);
    const prevBalanceRef = useRef(previousBalance);

    const handleEarnings = useCallback(() => {
        const hasChanges = prevBalanceRef.current !== previousBalance;
        const diff = hasChanges ? balance - previousBalance : 0;
        const hasEarnings = Boolean(diff && diff > 0);
        if (hasEarnings) {
            setEarnings(diff);
        }
        toggleTimerPaused({ pause: true });
        handleVisual(!hasEarnings ? 'fail' : 'success');
        prevBalanceRef.current = previousBalance;
    }, [balance, handleVisual, previousBalance, setEarnings, toggleTimerPaused]);

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
        if (postBlockAnimation) {
            const blockTimeout = setTimeout(() => {
                setDisplayBlockHeight(blockHeightRef.current);
                setPostBlockAnimation(false);
                toggleTimerPaused({ pause: false });
            }, 2000);

            return () => {
                clearTimeout(blockTimeout);
            };
        }
    }, [postBlockAnimation, setDisplayBlockHeight, setPostBlockAnimation]);
}
