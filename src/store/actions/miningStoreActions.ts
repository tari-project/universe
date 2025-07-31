import { invoke } from '@tauri-apps/api/core';

import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

import { useMiningStore } from '../useMiningStore.ts';
import { setError } from './appStateStoreActions.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '../useAppConfigStore.ts';
import { Network } from '@app/utils/network.ts';

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
    const unlocked = useSetupStore.getState().cpuMiningUnlocked;
    const enabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const initiated = useMiningStore.getState().isCpuMiningInitiated;

    if (!enabled || !unlocked || initiated) return;

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
    if (!useConfigMiningStore.getState().gpu_mining_enabled) return;
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
