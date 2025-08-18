import { useQuery } from '@tanstack/react-query';
import { useAirdropStore } from '@app/store';
import { defaultHeaders } from '@app/utils';

export const KEY_MINER_STATS = 'miners';

interface MinerStats {
    totalMiners: number;
}

async function fetchMinerStats() {
    const airdropApiUrl = useAirdropStore.getState().backendInMemoryConfig?.airdrop_api_url;
    const res = await fetch(`${airdropApiUrl}/miner/stats`, { headers: defaultHeaders });

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
