import { useQuery } from '@tanstack/react-query';
import { BlockTip } from '@app/types/mining/blocks.ts';
import { getExplorerUrl } from '@app/utils/network.ts';
import { defaultHeaders } from '@app/utils';
import { processNewBlock, useBlockchainVisualisationStore } from '@app/store';
import { KEY_EXPLORER } from '@app/hooks/mining/useFetchExplorerData.ts';
import { useEffect, useRef } from 'react';

async function getTipHeight(): Promise<BlockTip> {
    const explorerUrl = getExplorerUrl();
    const r = await fetch(`${explorerUrl}/blocks/tip/height`, { headers: defaultHeaders });
    if (!r.ok) {
        throw new Error('Failed to fetch block stats');
    }
    return r.json();
}
export function useBlockTip() {
    const latestBlock = useBlockchainVisualisationStore((s) => s.latestBlockPayload);
    const lastBlockHeight = latestBlock?.block_height;

    const cancelRefetch = useRef(false);
    const cancelProcess = useRef(false);

    const { data, isLoading, refetch, isRefetching } = useQuery<BlockTip>({
        queryKey: [KEY_EXPLORER, 'tip_height'],
        queryFn: async () => await getTipHeight(),
        notifyOnChangeProps: ['data'],
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 1.5,
    });

    const explorerDelayed = Boolean(lastBlockHeight && data && lastBlockHeight > data?.height);
    const nodeSync = Boolean(lastBlockHeight && data && lastBlockHeight <= data?.height);

    useEffect(() => {
        if (explorerDelayed) {
            console.debug(
                `explorerDelayed isRefetching=${isRefetching} | lastBlockHeight=${lastBlockHeight} | dataHeight=${data?.height}`
            );
        }
    }, [data, explorerDelayed, isRefetching, lastBlockHeight]);

    useEffect(() => {
        if (explorerDelayed && !cancelRefetch.current && !isRefetching) {
            console.debug(`==== mismatch refetch ====`);
            cancelRefetch.current = true;
            cancelProcess.current = true;
            refetch().then(() => {
                cancelRefetch.current = false;
                cancelProcess.current = false;
            });
        }
    }, [explorerDelayed, isRefetching, refetch]);

    useEffect(() => {
        if (!latestBlock) return;
        console.debug(
            `isLoading, isRefetching, latestBlock, nodeSync= `,
            isLoading,
            isRefetching,
            latestBlock,
            nodeSync
        );
        if (nodeSync && !isLoading && !isRefetching && !cancelProcess.current) {
            console.debug(`==== sync processNewBlock ====`);
            cancelProcess.current = true;
            cancelRefetch.current = true;
            processNewBlock(latestBlock).then(() => {
                cancelProcess.current = false;
                cancelRefetch.current = false;
            });
        }
    }, [isLoading, isRefetching, latestBlock, nodeSync]);

    return { data, isLoading };
}
