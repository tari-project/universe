import { GpuMiner } from '@app/types/events-payloads';
import { MiningStoreState } from '../useMiningStore';

export const getSelectedMiner = (state: MiningStoreState): GpuMiner | undefined => {
    if (!state.selectedMiner || !state.availableMiners) {
        return undefined;
    }

    return state.availableMiners[state.selectedMiner];
};
