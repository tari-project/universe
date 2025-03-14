import { useAppStateStore } from '@app/store/appStateStore';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { XSpaceEvent } from '@app/types/ws';
import { useEffect } from 'react';

export function useXSpaceEventRefresh() {
    const setupComplete = useAppStateStore((state) => state.setupComplete);

    const backendInMemoryConfig = useAirdropStore((s) => s.backendInMemoryConfig);
    useEffect(() => {
        if (!backendInMemoryConfig?.airdropApiUrl) return;
        if (!setupComplete) return; //user logged in, data will arrive through websocket

        fetchLatestXSpaceEvent(backendInMemoryConfig?.airdropApiUrl).then((data) => {
            if (data === undefined) {
                return;
            }
            useAirdropStore.setState({ latestXSpaceEvent: data });
        });
        const interval = setInterval(
            () => {
                fetchLatestXSpaceEvent(backendInMemoryConfig?.airdropApiUrl).then((data) => {
                    if (data === undefined) {
                        return;
                    }
                    useAirdropStore.setState({ latestXSpaceEvent: data });
                });
            },
            1000 * 60 * 60
        );
        return () => clearInterval(interval);
    }, [backendInMemoryConfig?.airdropApiUrl, setupComplete]);
}

async function fetchLatestXSpaceEvent(airdropApiUrl: string) {
    const response = await fetch(`${airdropApiUrl}/miner/x-space-events/latest`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        console.error('Fetching latest x-space-events was not successful');
        return undefined;
    }

    const data: XSpaceEvent | null = await response.json();

    return data;
}
