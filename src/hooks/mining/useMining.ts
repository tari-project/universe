import { useBlockInfo } from './useBlockInfo.ts';
import useBalanceInfo from '@app/hooks/mining/useBalanceInfo.ts';

export default function useMining() {
    // temp names, will change later
    useBlockInfo();
    useBalanceInfo();
}
