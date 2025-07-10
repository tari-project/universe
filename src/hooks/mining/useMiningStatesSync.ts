import { useUiMiningStateMachine } from './useMiningUiStateMachine.ts';
import useEarningsRecap from './useEarningsRecap.ts';

export function useMiningStatesSync() {
    useUiMiningStateMachine();
    useEarningsRecap();
}
