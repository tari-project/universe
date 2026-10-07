import { useQuery } from '@tanstack/react-query';
import { isLocalNet } from '@app/utils/network.ts';
import { useConfigBEInMemoryStore } from '@app/store';

export const KEY_NODE_STATS = 'nodes';

interface NodeStats {
    confirmed_nodes_24h: number;
}

async function fetchNodeStats(netmapApiUrl: string): Promise<NodeStats> {
    if (isLocalNet()) {
        return { confirmed_nodes_24h: 1 };
    }
    const res = await fetch(`${netmapApiUrl}/api/v1/stats`);
    if (!res.ok) {
        throw new Error(`Failed to fetch node stats: ${res.status}`);
    }
    return res.json();
}

export function useNodeStats() {
    const netmapApiUrl = useConfigBEInMemoryStore((s) => s.netmap_api_base_url);
    return useQuery<NodeStats['confirmed_nodes_24h']>({
        queryKey: [KEY_NODE_STATS, netmapApiUrl],
        queryFn: async () => {
            const stats = await fetchNodeStats(netmapApiUrl);
            return stats?.confirmed_nodes_24h ?? 0;
        },
        enabled: isLocalNet() || !!netmapApiUrl,
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 1000,
    });
}
