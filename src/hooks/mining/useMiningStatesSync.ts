import { useBlockInfo } from './useBlockInfo.ts';
import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useEarningsRecap from './useEarningsRecap.ts';

export function useMiningStatesSync() {
    useBlockInfo();
    useUiMiningStateMachine();
    useEarningsRecap();
}
