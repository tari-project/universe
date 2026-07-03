import { useQuery } from '@tanstack/react-query';
import { BlockTip } from '@app/types/mining/blocks.ts';
import { getExplorerUrl, isLocalNet } from '@app/utils/network.ts';
import { defaultHeaders } from '@app/utils';
import { processNewBlock, useBlockchainVisualisationStore } from '@app/store';
import { KEY_EXPLORER } from '@app/hooks/mining/useFetchExplorerData.ts';
import { invoke } from '@tauri-apps/api/core';

async function getTipHeight(): Promise<BlockTip> {
    if (isLocalNet()) {
        const status = await invoke('get_base_node_status');
        return { height: status.block_height, timestamp: status.block_time };
    }
    const explorerUrl = getExplorerUrl();
    const r = await fetch(`${explorerUrl}/blocks/tip/height`, { headers: defaultHeaders });
    if (!r.ok) {
        throw new Error('Failed to fetch block stats');
    }
    return r.json();
}
export function useBlockTip() {
    const latestBlock = useBlockchainVisualisationStore((s) => s.latestBlockPayload);
    return useQuery<BlockTip>({
        queryKey: [KEY_EXPLORER, 'block_tip'],
        queryFn: async () => {
            const data = await getTipHeight();
            if (latestBlock && data?.height !== latestBlock?.block_height) {
                await processNewBlock(latestBlock);
            }
            return data;
        },
        refetchIntervalInBackground: true,
        refetchInterval: 20 * 1000,
        staleTime: 1000 * 60,
    });
}
