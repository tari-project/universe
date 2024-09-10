import { useCallback, useEffect, useRef, useState } from 'react';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useWalletStore } from '@app/store/walletStore.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useShallow } from 'zustand/react/shallow';

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
    const block_height = useBaseNodeStatusStore(useShallow((s) => s.block_height));
    const balance = useWalletStore(useShallow((s) => s.balance));

    const balanceRef = useRef(balance);
    const blockHeightRef = useRef(block_height);

    const {
        setDisplayBlockHeight,
        setEarnings,
        setTimerPaused,
        postBlockAnimation,
        timerPaused,
        setPostBlockAnimation,
    } = useMiningStore(
        useShallow((s) => ({
            setDisplayBlockHeight: s.setDisplayBlockHeight,
            setPostBlockAnimation: s.setPostBlockAnimation,
            setEarnings: s.setEarnings,
            setTimerPaused: s.setTimerPaused,
            postBlockAnimation: s.postBlockAnimation,
            timerPaused: s.timerPaused,
        }))
    );

    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMining = isCPUMining || isGPUMining;

    const handleBalanceChange = useCallback(() => {
        setTimerPaused(true);

        const balanceHasChanges = balance > 0 && balanceRef.current != balance;
        if (balanceHasChanges) {
            const diff = balance - balanceRef.current;
            logBalanceChanges({ balance, prevBalance: balanceRef.current, balanceDiff: diff });
            const hasEarnings = Boolean(balance > 0 && diff > 0 && diff !== balance);
            if (hasEarnings) {
                setEarnings(diff);
                handleWin();
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
            }, 1000);

            return () => {
                clearTimeout(animationTimeout);
            };
        }
    }, [isMining, postBlockAnimation, setDisplayBlockHeight, setPostBlockAnimation, timerPaused]);
}
