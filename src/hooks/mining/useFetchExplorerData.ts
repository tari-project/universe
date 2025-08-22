import { useQuery } from '@tanstack/react-query';
import { defaultHeaders } from '@app/utils';
import { getExplorerUrl } from '@app/utils/network.ts';
import { BlockData, BlockDataExtended, BlocksStats } from '@app/types/mining/blocks.ts';
import { processNewBlock, useBlockchainVisualisationStore } from '@app/store';

export const KEY_EXPLORER = 'block_explorer';

async function fetchExplorerData(): Promise<BlocksStats> {
    const explorerUrl = getExplorerUrl();
    const response = await fetch(`${explorerUrl}/?json`, { headers: defaultHeaders });

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
    const latestBlock = useBlockchainVisualisationStore((s) => s.latestBlockPayload);
    return useQuery<ExplorerData>({
        queryKey: [KEY_EXPLORER],
        queryFn: async () => {
            const data = await fetchExplorerData();
            if (!data) {
                console.error('Explorer data is empty.');
                return { blockBubblesData: [], currentBlock: {} as BlockDataExtended };
            }
            const currentBlock = {
                ...data?.stats?.[0],
                timestamp: data.headers?.[0]?.timestamp,
                parsedTimestamp: data.stats?.[0]?.timestamp,
            };

            const blockBubblesData = data.stats?.slice(0, 10).map((block) => ({
                ...block,
                id: block.height,
                minersSolved: block.numCoinbases,
                reward: parseInt(block.totalCoinbaseXtm?.split('.')?.[0]?.replace(/,/g, ''), 10),
                timeAgo: block.timestamp,
                blocks: block.numOutputsNoCoinbases,
                isSolved: false,
            }));

            if (latestBlock?.block_height && Number(currentBlock.height) !== latestBlock?.block_height) {
                await processNewBlock(latestBlock);
            }

            return { blockBubblesData, currentBlock };
        },
        refetchOnWindowFocus: true,
        refetchInterval: 20 * 1000,
        staleTime: 20 * 1000,
    });
}
