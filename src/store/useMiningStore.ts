import { create } from 'zustand';
import { Network } from '@app/utils/network';

export interface SessionMiningTime {
    startTimestamp?: number;
    stopTimestamp?: number;
    durationMs?: number;
}

interface MiningStoreState {
    hashrateReady?: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
    isExcludingGpuDevices: boolean;
    counter: number;
    isCpuMiningInitiated: boolean;
    isGpuMiningInitiated: boolean;
    wasMineOnAppStartExecuted?: boolean;
    customLevelsDialogOpen: boolean;
    network?: Network;
    engine?: string;
    availableEngines: string[];
    sessionMiningTime: SessionMiningTime;
}

const initialState: MiningStoreState = {
    customLevelsDialogOpen: false,
    counter: 0,
    sessionMiningTime: {},
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
};

export const useMiningStore = create<MiningStoreState>()(() => ({
    ...initialState,
}));
