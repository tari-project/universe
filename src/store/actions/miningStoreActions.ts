import { invoke } from '@tauri-apps/api/core';
import { GpuThreads, MaxConsumptionLevels } from '@app/types/app-status.ts';
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

function setModeDefaults(maxLevels: MaxConsumptionLevels) {
    useConfigMiningStore.setState({
        eco_mode_cpu_threads: (maxLevels.max_cpu_threads || 3) * 0.3,
        eco_mode_max_gpu_usage:
            maxLevels?.max_gpus_threads.map((gpu) => ({
                gpu_name: gpu.gpu_name,
                max_gpu_threads: 2,
            })) || [],
        ludicrous_mode_max_cpu_usage: maxLevels.max_cpu_threads,
        ludicrous_mode_max_gpu_usage:
            maxLevels?.max_gpus_threads.map((gpu) => ({
                gpu_name: gpu.gpu_name,
                max_gpu_threads: 1024,
            })) || [],
    });
}

export const changeMiningMode = async (params: ChangeMiningModeArgs) => {
    const { mode, customGpuLevels, customCpuLevels } = params;
    console.info(`Changing mode to ${mode}...`);
    const metricsState = useMiningMetricsStore.getState();
    useMiningStore.setState({ isChangingMode: true });
    handleMiningModeChange();
    const wasCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const wasGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;

    const maxLevels = useMiningStore.getState().maxAvailableThreads;

    let gpuLevels = customGpuLevels || [];
    let cpuLevels = customCpuLevels;

    if (mode === 'Eco') {
        gpuLevels =
            maxLevels?.max_gpus_threads.map((gpu) => ({
                gpu_name: gpu.gpu_name,
                max_gpu_threads: 2,
            })) || [];
        cpuLevels = Math.round((maxLevels?.max_cpu_threads || 3) * 0.3);
    }
    if (mode === 'Ludicrous') {
        gpuLevels =
            maxLevels?.max_gpus_threads.map((gpu) => ({
                gpu_name: gpu.gpu_name,
                max_gpu_threads: 1024,
            })) || [];
        cpuLevels = maxLevels?.max_cpu_threads;
    }

    if (metricsState.cpu_mining_status.is_mining || metricsState.gpu_mining_status.is_mining) {
        console.info('Pausing mining...');
        await stopMining();
    }
    try {
        await setMode({
            mode: mode as modeType,
            customGpuLevels: gpuLevels,
            customCpuLevels: cpuLevels,
        });
        console.info(`Mode changed to ${mode}`);
        if (wasCpuMiningInitiated) {
            await startCpuMining();
        }

        if (wasGpuMiningInitiated) {
            await startGpuMining();
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
        setModeDefaults(maxAvailableThreads);
    } catch (e) {
        console.error('Failed to get max available threads: ', e);
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
            await stopMining();
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
export const getMiningNetwork = async () => {
    try {
        const network = (await invoke('get_network', {})) as Network;
        useMiningStore.setState({ network });
        return network;
    } catch (e) {
        console.error('Could not get network: ', e);
        setError(e as string);
        useMiningStore.setState({ network: undefined });
    }
};

export const startCpuMining = async () => {
    if (!useSetupStore.getState().cpuMiningUnlocked) return;
    if (!useConfigMiningStore.getState().cpu_mining_enabled) return;
    if (useMiningStore.getState().isCpuMiningInitiated) return;

    useMiningStore.setState({ isCpuMiningInitiated: true });
    console.info('CPU Mining starting....');
    try {
        await invoke('start_cpu_mining', {});
        useBlockchainVisualisationStore
            .getState()
            .setDisplayBlockTime({ daysString: '', hoursString: '', minutes: '00', seconds: '00' });
        console.info('CPU Mining started.');
    } catch (e) {
        console.error('Failed to start CPU mining: ', e);
        setError(e as string);
        useMiningStore.setState({ isCpuMiningInitiated: false });
    }
};
export const startGpuMining = async () => {
    if (!useSetupStore.getState().gpuMiningUnlocked) return;
    if (!useConfigMiningStore.getState().gpu_mining_enabled) return;
    if (useMiningStore.getState().isGpuMiningInitiated) return;

    useMiningStore.setState({ isGpuMiningInitiated: true });
    console.info('GPU Mining starting....');
    try {
        await invoke('start_gpu_mining', {});
        useBlockchainVisualisationStore
            .getState()
            .setDisplayBlockTime({ daysString: '', hoursString: '', minutes: '00', seconds: '00' });
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
    console.info('Mining starting....');

    try {
        await startCpuMining();
        await startGpuMining();
        console.info('Mining started.');
    } catch (e) {
        console.error('Failed to start mining: ', e);
        setError(e as string);
    }
};
export const stopMining = async () => {
    console.info('Mining stopping...');
    try {
        await stopCpuMining();
        await stopGpuMining();
        console.info('Mining stopped.');
    } catch (e) {
        console.error('Failed to stop mining: ', e);
        setError(e as string);
    }
};
export const toggleDeviceExclusion = async (deviceIndex: number, excluded: boolean) => {
    try {
        const wasGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
        const metricsState = useMiningMetricsStore.getState();
        if (metricsState.gpu_mining_status.is_mining) {
            console.info('Stoping mining...');
            await stopGpuMining();
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
        if (wasGpuMiningInitiated) {
            console.info('Restarting mining...');
            await startGpuMining();
        }
        useMiningStore.setState({ isExcludingGpuDevices: false });
    } catch (e) {
        console.error('Could not set excluded gpu device: ', e);
        setError(e as string);
    }
};
