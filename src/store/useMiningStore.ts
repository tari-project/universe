import { Network } from '@app/utils/network';
import { create } from './create';
import { MaxConsumptionLevels } from '@app/types/app-status';

interface MiningStoreState {
    hashrateReady?: boolean;
    miningInitiated: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
    isExcludingGpuDevices: boolean;
    counter: number;
    customLevelsDialogOpen: boolean;
    maxAvailableThreads?: MaxConsumptionLevels;
    network?: Network;
    engine?: string;
    availableEngines: string[];
}

const initialState: MiningStoreState = {
    customLevelsDialogOpen: false,
    maxAvailableThreads: undefined,
    counter: 0,
    hashrateReady: false,
    miningInitiated: false,
    isChangingMode: false,
    isExcludingGpuDevices: false,
    miningControlsEnabled: true,
    availableEngines: [],
    engine: undefined,
    network: undefined,
};

export const useMiningStore = create<MiningStoreState>()(() => ({
    ...initialState,
}));
