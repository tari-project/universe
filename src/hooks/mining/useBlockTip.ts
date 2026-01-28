import { useQuery } from '@tanstack/react-query';
import { BlockTip } from '@app/types/mining/blocks.ts';
import { getExplorerUrl } from '@app/utils/network.ts';
import { defaultHeaders } from '@app/utils';
import { processNewBlock, useBlockchainVisualisationStore } from '@app/store';
import { KEY_EXPLORER } from '@app/hooks/mining/useFetchExplorerData.ts';
import { useEffect } from 'react';

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

    const { data, isLoading, refetch } = useQuery<BlockTip>({
        queryKey: [KEY_EXPLORER, 'tip_height'],
        queryFn: async () => await getTipHeight(),
        notifyOnChangeProps: ['data'],
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 1.5,
    });

    useEffect(() => {
        if (!data || !lastBlockHeight) return;
        console.debug('useBlockTip! latestBlock VS fetch data', lastBlockHeight, data?.height);
        if (lastBlockHeight <= data?.height) {
            processNewBlock(latestBlock);
        }

        if (data.height !== lastBlockHeight) {
            console.debug('mismatched heights re-fetching explorer data...');
            refetch();
        }
    }, [data, lastBlockHeight, latestBlock, refetch]);

    return { data, isLoading };
}
