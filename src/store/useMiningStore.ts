import { create } from './create';
import { MaxConsumptionLevels } from '@app/types/app-status';

interface MiningStoreState {
    hashrateReady?: boolean;
    miningInitiated: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
    isExcludingGpuDevices: boolean;
    excludedGpuDevices: number[];
    counter: number;
    customLevelsDialogOpen: boolean;
    maxAvailableThreads?: MaxConsumptionLevels;
    network: string;
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
    network: 'unknown',
    excludedGpuDevices: [],
};

export const useMiningStore = create<MiningStoreState>()(() => ({
    ...initialState,
}));
