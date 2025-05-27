import { invoke } from '@tauri-apps/api/core';
import { GpuThreads } from '@app/types/app-status.ts';
import { useBlockchainVisualisationStore } from '../useBlockchainVisualisationStore.ts';
import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

import { useMiningStore } from '../useMiningStore.ts';
import { modeType } from '../types.ts';
import { setGpuMiningEnabled, setMode } from './appConfigStoreActions.ts';
import { setError } from './appStateStoreActions.ts';
import { handleMiningModeChange, setGpuDevices } from '../actions/miningMetricsStoreActions.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '../useAppConfigStore.ts';
import { Network } from '@app/utils/network.ts';

interface ChangeMiningModeArgs {
    mode: modeType;
    customGpuLevels?: GpuThreads[];
    customCpuLevels?: number;
}

export const changeMiningMode = async (params: ChangeMiningModeArgs) => {
    const { mode, customGpuLevels, customCpuLevels } = params;
    console.info(`Changing mode to ${mode}...`);
    const metricsState = useMiningMetricsStore.getState();
    useMiningStore.setState({ isChangingMode: true });
    handleMiningModeChange();

    if (metricsState.cpu_mining_status.is_mining || metricsState.gpu_mining_status.is_mining) {
        console.info('Pausing mining...');
        await pauseMining();
    }
    try {
        await setMode({
            mode: mode as modeType,
            customGpuLevels: customGpuLevels || [],
            customCpuLevels,
        });
        console.info(`Mode changed to ${mode}`);
        if (useMiningStore.getState().miningInitiated) {
            console.info('Restarting mining...');
            await startMining();
        }
    } catch (e) {
        console.error('Failed to change mode: ', e);
    } finally {
        useMiningStore.setState({ isChangingMode: false });
    }
};
export const getMaxAvailableThreads = async () => {
    console.info('Getting max available threads...');
    try {
        const maxAvailableThreads = await invoke('get_max_consumption_levels');
        useMiningStore.setState({ maxAvailableThreads });
    } catch (e) {
        console.error('Failed to get max available threads: ', e);
        setError(e as string);
    }
};
export const pauseMining = async () => {
    console.info('Mining pausing...');
    try {
        await invoke('stop_mining', {});
        console.info('Mining paused.');
    } catch (e) {
        console.error('Failed to pause (stop) mining: ', e);
        setError(e as string);
    }
};
export const restartMining = async () => {
    const isMining =
        useMiningMetricsStore.getState().cpu_mining_status.is_mining ||
        useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    if (isMining) {
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
};
export const setAvailableEngines = (availableEngines: string[], currentEngine: string) =>
    useMiningStore.setState({ availableEngines, engine: currentEngine });
export const setCustomLevelsDialogOpen = (customLevelsDialogOpen: boolean) =>
    useMiningStore.setState({ customLevelsDialogOpen });
export const setEngine = async (engine) => {
    const current_engine = useMiningStore.getState().engine;
    try {
        await invoke('set_selected_engine', { selectedEngine: engine });
        useMiningStore.setState({ engine });
        await restartMining();
    } catch (e) {
        console.error('Could not set engine: ', e);
        setError(e as string);
        useMiningStore.setState({ engine: current_engine || undefined });
    }
};

export const setMiningControlsEnabled = (miningControlsEnabled: boolean) =>
    useMiningStore.setState((state) => {
        const gpu_mining_enabled = useConfigMiningStore.getState().gpu_mining_enabled;
        const cpu_mining_enabled = useConfigMiningStore.getState().cpu_mining_enabled;
        return {
            miningControlsEnabled:
                state.isChangingMode || (!gpu_mining_enabled && !cpu_mining_enabled) ? false : miningControlsEnabled,
        };
    });
export const setMiningNetwork = async () => {
    try {
        const network = (await invoke('get_network', {})) as Network;
        useMiningStore.setState({ network });
    } catch (e) {
        console.error('Could not get network: ', e);
        setError(e as string);
        useMiningStore.setState({ network: undefined });
    }
};

export const startCpuMining = async () => {
    if (!useSetupStore.getState().cpuMiningUnlocked) return;
    if (useMiningStore.getState().isCpuMiningInitiated) return;

    useMiningStore.setState({ isCpuMiningInitiated: true });
    console.info('CPU Mining starting....');
    try {
        await invoke('start_cpu_mining', {});
        console.info('CPU Mining started.');
    } catch (e) {
        console.error('Failed to start CPU mining: ', e);
        setError(e as string);
        useMiningStore.setState({ isCpuMiningInitiated: false });
    }
};
export const startGpuMining = async () => {
    if (!useSetupStore.getState().gpuMiningUnlocked) return;
    if (useMiningStore.getState().isGpuMiningInitiated) return;

    useMiningStore.setState({ isGpuMiningInitiated: true });
    console.info('GPU Mining starting....');
    try {
        await invoke('start_gpu_mining', {});
        console.info('GPU Mining started.');
    } catch (e) {
        console.error('Failed to start GPU mining: ', e);
        setError(e as string);
        useMiningStore.setState({ isGpuMiningInitiated: false });
    }
};
export const stopCpuMining = async () => {
    if (!useMiningStore.getState().isCpuMiningInitiated) return;

    console.info('CPU Mining stopping...');
    useMiningStore.setState({ isCpuMiningInitiated: false });
    try {
        await invoke('stop_cpu_mining', {});
        console.info('CPU Mining stopped.');
    } catch (e) {
        console.error('Failed to stop CPU mining: ', e);
        setError(e as string);
        useMiningStore.setState({ isCpuMiningInitiated: true });
    }
};
export const stopGpuMining = async () => {
    if (!useMiningStore.getState().isGpuMiningInitiated) return;

    console.info('GPU Mining stopping...');
    useMiningStore.setState({ isGpuMiningInitiated: false });
    try {
        await invoke('stop_gpu_mining', {});
        console.info('GPU Mining stopped.');
    } catch (e) {
        console.error('Failed to stop GPU mining: ', e);
        setError(e as string);
        useMiningStore.setState({ isGpuMiningInitiated: true });
    }
};

export const startMining = async () => {
    useMiningStore.setState({ miningInitiated: true });
    console.info('Mining starting....');
    useBlockchainVisualisationStore
        .getState()
        .setDisplayBlockTime({ daysString: '', hoursString: '', minutes: '00', seconds: '00' });
    try {
        await startCpuMining();
        await startGpuMining();
        console.info('Mining started.');
    } catch (e) {
        console.error('Failed to start mining: ', e);
        setError(e as string);
        useMiningStore.setState({ miningInitiated: false });
    }
};
export const stopMining = async () => {
    console.info('Mining stopping...');
    useMiningStore.setState({ miningInitiated: false });
    try {
        await stopCpuMining();
        await stopGpuMining();
        console.info('Mining stopped.');
    } catch (e) {
        console.error('Failed to stop mining: ', e);
        setError(e as string);
        useMiningStore.setState({ miningInitiated: true });
    }
};
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
            setGpuMiningEnabled(false);
        }
        setGpuDevices(updatedDevices);
        if (useMiningStore.getState().miningInitiated) {
            console.info('Restarting mining...');
            await startMining();
        }
        useMiningStore.setState({ isExcludingGpuDevices: false });
    } catch (e) {
        console.error('Could not set excluded gpu device: ', e);
        setError(e as string);
    }
};
