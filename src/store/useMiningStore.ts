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
    network: string;
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
    network: 'unknown',
};

export const useMiningStore = create<MiningStoreState>()(() => ({
    ...initialState,
}));
