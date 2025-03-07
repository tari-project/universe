import { MaxConsumptionLevels } from '@app/types/app-status';
import { create } from './create';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from './appStateStore';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { pauseMining, startMining } from '@app/store/miningStoreActions.ts';
import { useAppConfigStore } from './useAppConfigStore';

interface State {
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

interface Actions {
    restartMining: () => Promise<void>;
    setMiningControlsEnabled: (miningControlsEnabled: boolean) => void;
    setCustomLevelsDialogOpen: (customLevelsDialogOpen: boolean) => void;
    getMaxAvailableThreads: () => void;
    setEngine: (engine: string) => Promise<void>;
    setAvailableEngines: (availableEngines: string[], currentEngine: string) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
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
        if (state.cpu_mining_status.is_mining || state.gpu_mining_status.is_mining) {
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
    setMiningControlsEnabled: (miningControlsEnabled) =>
        set((state) => {
            const gpu_mining_enabled = useAppConfigStore.getState().gpu_mining_enabled;
            const cpu_mining_enabled = useAppConfigStore.getState().cpu_mining_enabled;
            return {
                miningControlsEnabled:
                    state.isChangingMode || (!gpu_mining_enabled && !cpu_mining_enabled)
                        ? false
                        : miningControlsEnabled,
            };
        }),
    setEngine: async (engine) => {
        const current_engine = useMiningStore.getState().engine;
        try {
            await invoke('set_selected_engine', { selectedEngine: engine });
            set({ engine });
            await useMiningStore.getState().restartMining();
        } catch (e) {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set engine: ', e);
            appStateStore.setError(e as string);
            set({ engine: current_engine || undefined });
        }
    },
    setAvailableEngines: (availableEngines: string[], currentEngine: string) =>
        set({ availableEngines, engine: currentEngine }),
}));

export const toggleDeviceExclusion = async (deviceIndex: number, excluded: boolean) => {
    try {
        const metricsState = useMiningMetricsStore.getState();
        if (metricsState.cpu_mining_status.is_mining || metricsState.gpu_mining_status.is_mining) {
            console.info('Pausing mining...');
            await pauseMining();
        }
        await invoke('toggle_device_exclusion', { deviceIndex, excluded });
        const devices = metricsState.gpu_devices;
        const updatedDevices = devices.map((device) => {
            if (device.device_index === deviceIndex) {
                return { ...device, settings: { ...device.settings, is_excluded: excluded } };
            }
            return device;
        });
        const isAllExcluded = updatedDevices.every((device) => device.settings.is_excluded);
        if (isAllExcluded) {
            const appConfigStore = useAppConfigStore.getState();
            appConfigStore.setGpuMiningEnabled(false);
        }
        useMiningMetricsStore.getState().setGpuDevices(updatedDevices);
        if (useMiningStore.getState().miningInitiated) {
            console.info('Restarting mining...');
            await startMining();
        }
        useMiningStore.setState({ isExcludingGpuDevices: false });
    } catch (e) {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set excluded gpu device: ', e);
        appStateStore.setError(e as string);
    }
};
