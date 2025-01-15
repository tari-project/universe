import { MaxConsumptionLevels } from '@app/types/app-status';
import { create } from './create';
import * as Sentry from '@sentry/react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from './appStateStore';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { pauseMining, startMining } from '@app/store/miningStoreActions.ts';

interface State {
    hashrateReady?: boolean;
    miningInitiated: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
    excludedGpuDevices: number[];
    counter: number;
    customLevelsDialogOpen: boolean;
    maxAvailableThreads?: MaxConsumptionLevels;
    network: string;
}

interface Actions {
    restartMining: () => Promise<void>;
    setMiningControlsEnabled: (miningControlsEnabled: boolean) => void;
    setIsChangingMode: (isChangingMode: boolean) => void;
    setExcludedGpuDevice: (excludeGpuDevice: number[]) => Promise<void>;
    setCustomLevelsDialogOpen: (customLevelsDialogOpen: boolean) => void;
    getMaxAvailableThreads: () => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    customLevelsDialogOpen: false,
    maxAvailableThreads: undefined,
    counter: 0,
    hashrateReady: false,
    miningInitiated: false,
    isChangingMode: false,
    miningControlsEnabled: true,

    network: 'unknown',
    excludedGpuDevices: [],
};

export const useMiningStore = create<MiningStoreState>()((set) => ({
    ...initialState,
    setCustomLevelsDialogOpen: (customLevelsDialogOpen) => set({ customLevelsDialogOpen }),
    getMaxAvailableThreads: async () => {
        console.info('Getting max available threads...');
        try {
            const maxAvailableThreads = await invoke('get_max_consumption_levels');
            set({ maxAvailableThreads });
        } catch (e) {
            const appStateStore = useAppStateStore.getState();
            console.error('Failed to get max available threads: ', e);
            appStateStore.setError(e as string);
        }
    },

    restartMining: async () => {
        const state = useMiningMetricsStore.getState();
        if (state.cpu.mining.is_mining || state.gpu.mining.is_mining) {
            console.info('Restarting mining...');
            try {
                await pauseMining();
            } catch (e) {
                console.error('Failed to pause(restart) mining: ', e);
            }

            try {
                await startMining();
            } catch (e) {
                console.error('Failed to start(restart) mining: ', e);
            }
        }
    },
    setMiningControlsEnabled: (miningControlsEnabled) => set({ miningControlsEnabled }),
    setIsChangingMode: (isChangingMode) => set({ isChangingMode }),
    setExcludedGpuDevice: async (excludedGpuDevices) => {
        set({ excludedGpuDevices });
        try {
            await invoke('set_excluded_gpu_devices', { excludedGpuDevices });
        } catch (e) {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set excluded gpu device: ', e);
            appStateStore.setError(e as string);
            set({ excludedGpuDevices: undefined });
        }
    },
}));

export const setMiningNetwork = async () => {
    try {
        const network = (await invoke('get_network', {})) as string;
        useMiningStore.setState({ network });
    } catch (e) {
        Sentry.captureException(e);
        const appStateStore = useAppStateStore.getState();
        console.error('Could not get network: ', e);
        appStateStore.setError(e as string);
        useMiningStore.setState({ excludedGpuDevices: undefined });
    }
};
