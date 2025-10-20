import { create } from 'zustand';
import { Network } from '@app/utils/network';
import { GpuMiner, GpuMinerType } from '@app/types/events-payloads';

export interface SessionMiningTime {
    startTimestamp?: number;
    stopTimestamp?: number;
    durationMs?: number;
}

export interface MiningStoreState {
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
    availableMiners?: Record<GpuMinerType, GpuMiner>;
    selectedMiner?: GpuMinerType;
    sessionMiningTime: SessionMiningTime;
    showEcoAlert: boolean;
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
    availableMiners: undefined,
    selectedMiner: undefined,
    showEcoAlert: false,
};

export const useMiningStore = create<MiningStoreState>()(() => ({
    ...initialState,
}));
