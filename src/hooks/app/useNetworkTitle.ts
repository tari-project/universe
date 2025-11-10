import { useEffect } from 'react';
import { useMiningStore } from '@app/store';
import { updateWindowTitle } from '@app/utils/updateWindowTitle';

/**
 * Hook that automatically updates the window title when the network changes
 * This allows users to easily see which network they're mining on
 */
export function useNetworkTitle() {
    const network = useMiningStore((state) => state.network);

    useEffect(() => {
        updateWindowTitle(network);
    }, [network]);
}
