import { useQuery } from '@tanstack/react-query';
import { defaultHeaders } from '@app/utils';
import { getExplorerUrl, isLocalNet } from '@app/utils/network.ts';
import { BlockStats, BlockBubbleData, localBlockStatsToBlockStats } from '@app/types/mining/blocks.ts';
import { invoke } from '@tauri-apps/api/core';

const LIMIT = 10;
export const KEY_EXPLORER = 'block_explorer';
export const KEY_STATS = 'block_stats';

async function fetchExplorerData({ limit }: { limit?: number }): Promise<BlockStats[]> {
    if (isLocalNet()) {
        const localStats = await invoke('get_local_block_stats', { limit: limit ?? LIMIT });
        return localStats.map(localBlockStatsToBlockStats);
    }
    const explorerUrl = getExplorerUrl();
    const response = await fetch(`${explorerUrl}/blocks/stats?limit=${limit}`, { headers: defaultHeaders });

    if (!response.ok) {
        throw new Error('Failed to fetch block stats');
    }

    return response.json();
}

function parseStats(block: BlockStats): BlockBubbleData {
    return {
        ...block,
        id: block.height.toString(),
        minersSolved: block.numCoinbases,
        reward: parseInt(block.totalCoinbaseXtm?.split('.')?.[0]?.replace(/,/g, ''), 10),
        blocks: block.numOutputsNoCoinbases,
        isSolved: false,
    };
}

export function useFetchExplorerData() {
    return useQuery<BlockBubbleData[]>({
        queryKey: [KEY_EXPLORER, KEY_STATS, LIMIT],
        queryFn: async () => {
            const data = await fetchExplorerData({ limit: LIMIT });
            if (!data) {
                console.error('Explorer data is empty.');
                return [] as BlockBubbleData[];
            }
            return data.map(parseStats);
        },
        refetchOnWindowFocus: true,
        refetchInterval: 20 * 1000,
        staleTime: 20 * 1000,
    });
}
