import { useQuery } from '@tanstack/react-query';
import { defaultHeaders } from '@app/utils';
import { isLocalNet } from '@app/utils/network.ts';
import { useConfigBEInMemoryStore } from '@app/store';

export const KEY_NODE_STATS = 'nodes';

interface NodeStats {
    confirmed_nodes_24h: number;
}

async function fetchMinerStats() {
    if (isLocalNet()) {
        return { confirmed_nodes_24h: 1 };
    }
    const networkStatsUrl = useConfigBEInMemoryStore.getState().netmap_api_base_url;
    const res = await fetch(`${networkStatsUrl}/api/v1/stats`);
    if (!res.ok) {
        console.error('Failed to fetch node stats');
    }
    return res.json();
}

export function useMinerStats() {
    return useQuery<NodeStats['confirmed_nodes_24h']>({
        queryKey: [KEY_NODE_STATS],
        queryFn: async () => {
            const stats = await fetchMinerStats();
            return stats.confirmed_nodes_24h;
        },
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 1000,
    });
}
