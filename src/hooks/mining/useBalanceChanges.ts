import { useCallback, useEffect, useRef, useState } from 'react';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useWalletStore } from '@app/store/useWalletStore';

function logBalanceChanges({ balance, prevBalance, balanceDiff }) {
    console.groupCollapsed('Balance changes:');
    console.info('New Balance:', balance);
    console.info('Previous Balance:', prevBalance);
    console.info('Diff/Earnings:', balanceDiff);
    console.groupEnd();
}

const TIMER_VALUE = 15 * 1000; // 15s
export function useBalanceChanges() {
    const { handleWin, handleFail } = useVisualisation();
    const [balanceChangeBlock, setBalanceChangeBlock] = useState<number | null>(null);
    const [blockHeightChanged, setBlockHeightChanged] = useState(false);
    const block_height = useMiningStore((s) => s.base_node.block_height);
    const balance = useWalletStore((s) => s.balance);

    const balanceRef = useRef(balance);
    const blockHeightRef = useRef(block_height);

    const setDisplayBlockHeight = useMiningStore((s) => s.setDisplayBlockHeight);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const setTimerPaused = useMiningStore((s) => s.setTimerPaused);
    const setPostBlockAnimation = useMiningStore((s) => s.setPostBlockAnimation);
    const setMiningControlsEnabled = useMiningStore((s) => s.setMiningControlsEnabled);
    const postBlockAnimation = useMiningStore((s) => s.postBlockAnimation);
    const timerPaused = useMiningStore((s) => s.timerPaused);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isMining = isCPUMining || isGPUMining;

    const handleBalanceChange = useCallback(() => {
        setTimerPaused(true);

        const balanceHasChanges = balance > 0 && balanceRef.current != balance;

        if (balanceHasChanges) {
            const diff = balance - balanceRef.current;
            logBalanceChanges({ balance, prevBalance: balanceRef.current, balanceDiff: diff });
            const hasEarnings = Boolean(balance > 0 && diff > 0 && diff !== balance);
            if (hasEarnings) {
                handleWin();
                setEarnings(diff);
            }
            balanceRef.current = balance;
        } else {
            handleFail();
        }
    }, [balance, handleFail, handleWin, setEarnings, setTimerPaused]);

    useEffect(() => {
        if (block_height > 0 && blockHeightRef.current !== block_height) {
            setBlockHeightChanged(true);

            if (!isMining) {
                setDisplayBlockHeight(block_height);
            }
        }
    }, [block_height, balance, isMining, setDisplayBlockHeight]);

    useEffect(() => {
        if (balance > 0 && balanceRef.current !== balance) {
            setBalanceChangeBlock(block_height);
        }
    }, [block_height, balance]);

    useEffect(() => {
        if (blockHeightChanged || !!balanceChangeBlock) {
            const timer = !isMining || balanceChangeBlock === block_height ? 1 : TIMER_VALUE;
            blockHeightRef.current = block_height;

            const waitForBalanceTimeout = setTimeout(() => {
                if (isMining) {
                    handleBalanceChange();
                }
                setBalanceChangeBlock(null);
            }, timer);
            return () => {
                clearTimeout(waitForBalanceTimeout);
            };
        }
    }, [balanceChangeBlock, blockHeightChanged, block_height, handleBalanceChange, isMining]);

    useEffect(() => {
        if ((postBlockAnimation && !timerPaused) || !isMining) {
            const animationTimeout = setTimeout(() => {
                setPostBlockAnimation(false);
                setBlockHeightChanged(false);
                setDisplayBlockHeight(blockHeightRef.current);

                setMiningControlsEnabled(true);
            }, 3000);

            return () => {
                clearTimeout(animationTimeout);
            };
        }
    }, [
        isMining,
        postBlockAnimation,
        setDisplayBlockHeight,
        setMiningControlsEnabled,
        setPostBlockAnimation,
        timerPaused,
    ]);
}
