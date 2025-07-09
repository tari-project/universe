import { useQuery } from '@tanstack/react-query';
import { getExplorerUrl } from '@app/utils/network.ts';
import { BlockData, BlockDataExtended, BlocksStats } from '@app/types/mining/blocks.ts';

export const BLOCKS_KEY = ['blocks'];

async function fetchExplorerData(): Promise<BlocksStats> {
    const explorerUrl = getExplorerUrl();
    const response = await fetch(`${explorerUrl}/?json`);

    if (!response.ok) {
        throw new Error('Failed to fetch blocks');
    }

    return response.json();
}

interface ExplorerData {
    currentBlock: BlockDataExtended;
    blockBubblesData: BlockData[];
}

export function useFetchExplorerData() {
    return useQuery<ExplorerData>({
        queryKey: BLOCKS_KEY,
        queryFn: async () => {
            const data = await fetchExplorerData();
            const currentBlock = {
                ...data.stats[0],
                timestamp: data.headers[0].timestamp,
                parsedTimestamp: data.stats[0].timestamp,
            };

            const blockBubblesData = data.stats.slice(0, 10).map((block) => ({
                ...block,
                id: block.height,
                minersSolved: block.numCoinbases,
                reward: parseInt(block.totalCoinbaseXtm.split('.')[0].replace(/,/g, ''), 10),
                timeAgo: block.timestamp,
                blocks: block.numOutputsNoCoinbases,
                isSolved: false,
            }));

            return { blockBubblesData, currentBlock };
        },
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 1000,
    });
}
