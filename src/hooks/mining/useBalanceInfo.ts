import useWalletStore from '@app/store/walletStore.ts';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

export default function useBalanceInfo() {
    const [hasEarned, setHasEarned] = useState(false);
    const [successHeight, setSuccessHeight] = useState<number | undefined>();
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const balance = useWalletStore((state) => state.balance);

    const balanceRef = useRef(balance);
    const heightRef = useRef(block_height);
    const previousHeightRef = useRef(successHeight);

    useEffect(() => {
        const hasChanges = balanceRef.current !== balance;
        if (hasChanges && heightRef.current !== previousHeightRef.current) {
            setHasEarned(true);
            setSuccessHeight(heightRef.current);
        }
    }, [block_height, balance]);

    const setResetSuccess = useCallback(() => {
        previousHeightRef.current = successHeight;
        balanceRef.current = balance;
        heightRef.current = block_height;

        setHasEarned(false);
        setSuccessHeight(undefined);
    }, [block_height, balance, successHeight]);

    return {
        hasEarned,
        setHasEarned,
        successHeight,
        setResetSuccess,
    };
}
