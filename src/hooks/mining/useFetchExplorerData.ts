import { useQuery } from '@tanstack/react-query';
import { defaultHeaders } from '@app/utils';
import { getExplorerUrl, isLocalNet } from '@app/utils/network.ts';
import { BlockStats, BlockBubbleData, localBlockStatsToBlockStats } from '@app/types/mining/blocks.ts';
import { processNewBlock, useBlockchainVisualisationStore, useConfigUIStore, useMiningStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';

import { getIsMining } from '@app/store/selectors/miningStoreSelectors.ts';
import { useEffect, useRef } from 'react';

const LIMIT = 10;
const BASE_REFETCH_INTERVAL_MS = 1000 * 30;
const CATCH_UP_BASE_INTERVAL_MS = 1000 * 5;
const MAX_CATCH_UP_ATTEMPTS = 6;
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
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const isMining = useMiningStore((s) => getIsMining(s));
    const latestNodeBlockHeight = useBlockchainVisualisationStore((s) => s.latestBlockHeight);
    const cancelProcess = useRef(false);
    const catchUpAttemptsRef = useRef(0);
    const lastLaggingHeightRef = useRef<number | undefined>(undefined);

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
            const currentDataTip = state.data?.[0]?.height;
            if (!latestNodeBlockHeight || !isMining || !currentDataTip) {
                catchUpAttemptsRef.current = 0;
                return BASE_REFETCH_INTERVAL_MS;
            }

            if (currentDataTip < latestNodeBlockHeight) {
                if (lastLaggingHeightRef.current !== latestNodeBlockHeight) {
                    lastLaggingHeightRef.current = latestNodeBlockHeight;
                    catchUpAttemptsRef.current = 0;
                }
                if (catchUpAttemptsRef.current >= MAX_CATCH_UP_ATTEMPTS) {
                    return BASE_REFETCH_INTERVAL_MS;
                }
                const attempt = catchUpAttemptsRef.current;
                catchUpAttemptsRef.current += 1;
                return Math.min(CATCH_UP_BASE_INTERVAL_MS * 2 ** Math.floor(attempt / 2), BASE_REFETCH_INTERVAL_MS);
            }

            catchUpAttemptsRef.current = 0;
            return BASE_REFETCH_INTERVAL_MS;
        },
        staleTime: 60 * 1000,
    });

    const currentDataTip = data?.[0]?.height;

    useEffect(() => {
        if (!currentDataTip || !latestNodeBlockHeight) return;
        const nodeSync = latestNodeBlockHeight <= currentDataTip;
        const shouldProccess = nodeSync && isMining && !isLoading && !cancelProcess.current;
        if (shouldProccess) {
            cancelProcess.current = true;
            processNewBlock().then(() => {
                cancelProcess.current = false;
            });
        }
    }, [currentDataTip, isLoading, isMining, latestNodeBlockHeight]);

    return { blockBubblesData: data, isError, isLoading };
}
