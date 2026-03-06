import { useQuery } from '@tanstack/react-query';
import { defaultHeaders } from '@app/utils';
import { getExplorerUrl } from '@app/utils/network.ts';
import { BlockStats, BlockBubbleData } from '@app/types/mining/blocks.ts';
import { processNewBlock, useBlockchainVisualisationStore, useConfigUIStore, useMiningStore } from '@app/store';

import { getIsMining } from '@app/store/selectors/miningStoreSelectors.ts';
import { useEffect, useRef } from 'react';

const LIMIT = 10;
export const KEY_EXPLORER = 'block_explorer';
export const KEY_STATS = 'block_stats';

async function fetchExplorerData({ limit }: { limit?: number }): Promise<BlockStats[]> {
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
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const isMining = useMiningStore((s) => getIsMining(s));
    const latestNodeBlockHeight = useBlockchainVisualisationStore((s) => s.latestBlockHeight);
    const cancelProcess = useRef(false);

    const { data, isLoading, isError } = useQuery<BlockBubbleData[]>({
        queryKey: [KEY_EXPLORER, KEY_STATS, LIMIT],
        queryFn: async () => {
            const data = await fetchExplorerData({ limit: LIMIT });
            if (!data) {
                console.error('Explorer data is empty.');
                return [] as BlockBubbleData[];
            }
            return data.map(parseStats);
        },
        enabled: visualMode,
        refetchOnWindowFocus: true,
        refetchInterval: ({ state }) => {
            const currentDataTip = state.data?.[0].height;
            const BASE = 1000 * 30;
            if (!latestNodeBlockHeight || !isMining || !currentDataTip) {
                return BASE;
            }

            return currentDataTip < latestNodeBlockHeight ? 1000 : BASE;
        },
        staleTime: 60 * 1000,
    });

    const currentDataTip = data?.[0].height;

    useEffect(() => {
        if (!currentDataTip || !latestNodeBlockHeight) return;
        const nodeSync = latestNodeBlockHeight <= currentDataTip;
        const shouldProccess = nodeSync && isMining && !isLoading && !isLoading && !cancelProcess.current;
        if (shouldProccess) {
            cancelProcess.current = true;
            processNewBlock().then(() => {
                cancelProcess.current = false;
            });
        }
    }, [currentDataTip, isLoading, isMining, latestNodeBlockHeight]);

    return { blockBubblesData: data, isError, isLoading };
}
