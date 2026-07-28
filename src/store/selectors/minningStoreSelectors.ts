import { GpuMiner, GpuMinerFeature } from '@app/types/events-payloads';
import { MiningStoreState } from '../useMiningStore';

export const getSelectedMiner = (state: MiningStoreState): GpuMiner | undefined => {
    if (!state.selectedMiner || !state.availableMiners) {
        return undefined;
    }

    return state.availableMiners[state.selectedMiner];
};

/**
 * Whether any available GPU miner supports solo (node) mining.
 *
 * Disabling the GPU pool switches GPU mining to a direct node connection, which only
 * works if some miner advertises `SoloMining`. Returns `undefined` while the miner list
 * has not been received yet, so callers can distinguish "not supported" from "not known
 * yet" and avoid gating on incomplete data.
 */
export const getIsGpuSoloMiningSupported = (state: MiningStoreState): boolean | undefined => {
    if (!state.availableMiners) {
        return undefined;
    }

    return Object.values(state.availableMiners).some((miner) => miner.features.includes(GpuMinerFeature.SoloMining));
};
