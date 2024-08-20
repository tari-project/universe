import { useShallow } from 'zustand/react/shallow';
import useWalletStore from '@app/store/walletStore.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

export default function useBalanceInfo() {
    const [hasEarned, setHasEarned] = useState(false);
    const [successHeight, setSuccessHeight] = useState<number | undefined>();
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const total = useWalletStore(useShallow((s) => s.balance));
    const pending = useWalletStore(useShallow((s) => s.pending_incoming_balance));
    const timelocked = useWalletStore(useShallow((s) => s.timelocked_balance));
    const available = useWalletStore(useShallow((s) => s.available_balance));

    const heightRef = useRef(block_height);

    const totalRef = useRef(total);
    const pendingRef = useRef(pending);
    const timelockedRef = useRef(timelocked);
    const availableRef = useRef(available);

    const handleChanges = useCallback(() => {
        let hasChanges = false;
        if (availableRef.current !== available) {
            hasChanges = true;
            availableRef.current = available;
        }
        if (pendingRef.current !== pending) {
            hasChanges = true;
            pendingRef.current = pending;
        }
        if (timelockedRef.current !== timelocked) {
            hasChanges = true;
            timelockedRef.current = timelocked;
        }
        if (totalRef.current !== total) {
            hasChanges = true;
            totalRef.current = total;
        }
        return hasChanges;
    }, [available, pending, timelocked, total]);

    useEffect(() => {
        const hasChanges = handleChanges();
        console.log(`hasChanges | height:`, hasChanges, heightRef.current, block_height);

        if (hasChanges && heightRef.current !== block_height) {
            setHasEarned(true);
            setSuccessHeight(heightRef.current);
        }

        heightRef.current = block_height;
    }, [block_height, handleChanges]);

    return { hasEarned, setHasEarned, successHeight, setSuccessHeight };
}
