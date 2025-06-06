import { useQuery } from '@tanstack/react-query';
import { useAirdropStore } from '@app/store';

export const KEY_MINER_STATS = 'miners';

interface MinerStats {
    totalMiners: number;
}

async function fetchMinerStats() {
    const airdropApiUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;
    const res = await fetch(`${airdropApiUrl}/miner/stats`);

    if (!res.ok) {
        console.error('Failed to fetch miner stats');
    }

    return res.json();
}

export function useMinerStats() {
    return useQuery<MinerStats['totalMiners']>({
        queryKey: [KEY_MINER_STATS],
        queryFn: async () => {
            const stats = await fetchMinerStats();
            return stats?.totalMiners ?? 0;
        },
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 1000,
    });
}
