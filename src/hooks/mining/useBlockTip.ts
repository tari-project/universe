import { useQuery } from '@tanstack/react-query';
import { BlockTip } from '@app/types/mining/blocks.ts';
import { getExplorerUrl } from '@app/utils/network.ts';
import { defaultHeaders } from '@app/utils';
import { processNewBlock, useBlockchainVisualisationStore, useMiningStore } from '@app/store';
import { KEY_EXPLORER } from '@app/hooks/mining/useFetchExplorerData.ts';
import { useEffect, useRef } from 'react';
import { getIsMining } from '@app/store/selectors/miningStoreSelectors.ts';

async function getTipHeight(): Promise<BlockTip> {
    const explorerUrl = getExplorerUrl();
    const r = await fetch(`${explorerUrl}/blocks/tip/height`, { headers: defaultHeaders });
    if (!r.ok) {
        throw new Error('Failed to fetch block stats');
    }
    return r.json();
}
export function useBlockTip() {
    const isMining = useMiningStore((s) => getIsMining(s));
    const latestNodeBlockHeight = useBlockchainVisualisationStore((s) => s.latestBlockHeight);

    const cancelRefetch = useRef(false);
    const cancelProcess = useRef(false);

    const { data, isLoading, refetch, isRefetching } = useQuery<BlockTip>({
        queryKey: [KEY_EXPLORER, 'tip_height'],
        queryFn: async () => await getTipHeight(),
        notifyOnChangeProps: ['data'],
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 1.5,
    });

    const nodeSync = Boolean(latestNodeBlockHeight && data && latestNodeBlockHeight <= data?.height);
    const shouldProccess = nodeSync && !isMining && !isLoading && !isRefetching && !cancelProcess.current;
    const explorerDelayed = Boolean(latestNodeBlockHeight && data && latestNodeBlockHeight > data?.height);

    useEffect(() => {
        if (explorerDelayed && !cancelRefetch.current && !isRefetching) {
            cancelRefetch.current = true;
            refetch().then(() => {
                cancelRefetch.current = false;
            });
        }
    }, [explorerDelayed, isRefetching, refetch]);

    useEffect(() => {
        if (!shouldProccess) return;
        cancelProcess.current = true;
        cancelRefetch.current = true;
        processNewBlock().then(() => {
            cancelProcess.current = false;
            cancelRefetch.current = false;
        });
    }, [shouldProccess]);

    return { data, isLoading };
}
