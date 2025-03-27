import { useBlockInfo } from './useBlockInfo.ts';
import useEarningsRecap from './useEarningsRecap.ts';

export function useMiningStatesSync() {
    useBlockInfo();
    useEarningsRecap();
}
