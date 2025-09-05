import { create } from 'zustand';
import { Network } from '@app/utils/network';
import { GpuMiner, GpuMinerType } from '@app/types/events-payloads';

interface MiningStoreState {
    hashrateReady?: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
    isExcludingGpuDevices: boolean;
    counter: number;
    miningTime: number;
    isCpuMiningInitiated: boolean;
    isGpuMiningInitiated: boolean;
    wasMineOnAppStartExecuted?: boolean;
    sessionMiningTime: number;
    customLevelsDialogOpen: boolean;
    network?: Network;
    engine?: string;
    availableEngines: string[];
    availableMiners?: GpuMinerType[];
    selectedMiner?: GpuMiner;
}

const initialState: MiningStoreState = {
    customLevelsDialogOpen: false,
    counter: 0,
    miningTime: 0,
    sessionMiningTime: 0,
    hashrateReady: false,
    isCpuMiningInitiated: false,
    isGpuMiningInitiated: false,
    wasMineOnAppStartExecuted: false,
    isChangingMode: false,
    isExcludingGpuDevices: false,
    //TODO: replace with CpuMiningUnlocked and GpuMiningUnlocked from useSetupStore
    miningControlsEnabled: true,
    availableEngines: [],
    engine: undefined,
    network: undefined,
    availableMiners: undefined,
    selectedMiner: undefined,
};

export const useMiningStore = create<MiningStoreState>()(() => ({
    ...initialState,
}));
