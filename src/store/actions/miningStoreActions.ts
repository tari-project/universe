import { invoke } from '@tauri-apps/api/core';
import { GpuThreads } from '@app/types/app-status.ts';
import { useBlockchainVisualisationStore } from '../useBlockchainVisualisationStore.ts';
import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

import { useMiningStore } from '../useMiningStore.ts';
import { modeType } from '../types.ts';
import { setGpuMiningEnabled, setMode } from './appConfigStoreActions.ts';
import { useAppConfigStore } from '../useAppConfigStore.ts';
import { setError } from './appStateStoreActions.ts';

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
    useMiningMetricsStore.getState().handleMiningModeChange();

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
        useMiningStore.setState({ miningInitiated: true });
    }
};
export const restartMining = async () => {
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
};
export const setCustomLevelsDialogOpen = (customLevelsDialogOpen: boolean) =>
    useMiningStore.setState({ customLevelsDialogOpen });
export const setExcludedGpuDevices = async (excludedGpuDevices: number[]) => {
    const hardware = useMiningMetricsStore.getState().gpu_devices;
    const totalGpuDevices = hardware.length;
    console.error('Excluded GPU devices: ', excludedGpuDevices);
    console.error('Hardware: ', hardware);
    try {
        await invoke('set_excluded_gpu_devices', { excludedGpuDevices });
        if (excludedGpuDevices.length === totalGpuDevices) {
            await setGpuMiningEnabled(false);
        }
        useMiningStore.setState({ excludedGpuDevices });
    } catch (e) {
        console.error('Could not set excluded gpu device: ', e);
        setError(e as string);
        useMiningStore.setState({ excludedGpuDevices: undefined });
    }
};
export const setMiningControlsEnabled = (miningControlsEnabled: boolean) =>
    useMiningStore.setState((state) => {
        const gpu_mining_enabled = useAppConfigStore.getState().gpu_mining_enabled;
        const cpu_mining_enabled = useAppConfigStore.getState().cpu_mining_enabled;
        return {
            miningControlsEnabled:
                state.isChangingMode || (!gpu_mining_enabled && !cpu_mining_enabled) ? false : miningControlsEnabled,
        };
    });
export const setMiningNetwork = async () => {
    try {
        const network = (await invoke('get_network', {})) as string;
        useMiningStore.setState({ network });
    } catch (e) {
        console.error('Could not get network: ', e);
        setError(e as string);
        useMiningStore.setState({ excludedGpuDevices: undefined });
    }
};
export const startMining = async () => {
    console.info('Mining starting....');
    useMiningStore.setState({ miningInitiated: true });
    useBlockchainVisualisationStore
        .getState()
        .setDisplayBlockTime({ daysString: '', hoursString: '', minutes: '00', seconds: '00' });
    try {
        await invoke('start_mining', {});
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
        await invoke('stop_mining', {});
        console.info('Mining stopped.');
    } catch (e) {
        console.error('Failed to stop mining: ', e);
        setError(e as string);
        useMiningStore.setState({ miningInitiated: true });
    }
};
