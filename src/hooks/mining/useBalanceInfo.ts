import { useCallback, useEffect, useRef, useState } from 'react';
import useWalletStore from '@app/store/walletStore.ts';
import { useVisualisation } from '@app/hooks/mining/useVisualisation.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

export default function useBalanceInfo() {
    const [balanceChangeBlock, setBalanceChangeBlock] = useState<number | null>(null);
    const handleVisual = useVisualisation();

    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const setDisplayBlockHeight = useMiningStore((s) => s.setDisplayBlockHeight);
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const blockHeightRef = useRef(block_height);

    const prevBalanceRef = useRef(previousBalance);

    const handleEarnings = useCallback(() => {
        const diff = balance - previousBalance;

        const hasEarnings = diff && diff > 0;
        if (hasEarnings) {
            setEarnings(diff);
        }
        handleVisual(hasEarnings ? 'success' : 'fail');
        prevBalanceRef.current = previousBalance;
    }, [balance, handleVisual, previousBalance, setEarnings]);

    useEffect(() => {
        if (prevBalanceRef.current !== previousBalance) {
            setBalanceChangeBlock(blockHeightRef.current);
        }
    }, [previousBalance]);

    useEffect(() => {
        console.debug('blocks: ', block_height, blockHeightRef.current, balanceChangeBlock);
        if ((block_height && block_height !== blockHeightRef.current) || !!balanceChangeBlock) {
            const timer = !balanceChangeBlock ? 10 * 1000 : 1;

            const timeout = setTimeout(() => {
                handleEarnings();
                blockHeightRef.current = block_height;
                setDisplayBlockHeight(blockHeightRef.current);
                setBalanceChangeBlock(null);
            }, timer);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [balanceChangeBlock, block_height, handleEarnings, setDisplayBlockHeight]);
}
