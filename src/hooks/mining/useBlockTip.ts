import { useQuery } from '@tanstack/react-query';
import { BlockTip } from '@app/types/mining/blocks.ts';
import { getExplorerUrl } from '@app/utils/network.ts';
import { defaultHeaders } from '@app/utils';
import { KEY_EXPLORER } from '@app/hooks/mining/useFetchExplorerData.ts';

async function getTipHeight(): Promise<BlockTip> {
    const explorerUrl = getExplorerUrl();
    const r = await fetch(`${explorerUrl}/blocks/tip/height`, { headers: defaultHeaders });
    if (!r.ok) {
        throw new Error('Failed to fetch block stats');
    }
    return r.json();
}
export function useBlockTip() {
    const { data, isLoading } = useQuery<BlockTip>({
        queryKey: [KEY_EXPLORER, 'tip_height'],
        queryFn: async () => await getTipHeight(),
        refetchIntervalInBackground: true,
        refetchInterval: 1000 * 60 * 1.5,
    });

    return { data, isLoading };
}
