// the sauce of truth for all block time fmts
import { useFetchExplorerData } from '@app/hooks/mining/useFetchExplorerData.ts';

export default function useBlockTime() {
    const { data } = useFetchExplorerData();
    const currentBlock = data?.currentBlock;

    console.debug(currentBlock);
}
