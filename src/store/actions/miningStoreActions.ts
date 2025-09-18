import { invoke } from '@tauri-apps/api/core';

import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

import { SessionMiningTime, useMiningStore } from '../useMiningStore.ts';
import { setError } from './appStateStoreActions.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '../useAppConfigStore.ts';
import { Network } from '@app/utils/network.ts';
import { setupStoreSelectors } from '../selectors/setupStoreSelectors.ts';
import { GpuMiner, GpuMinerType } from '@app/types/events-payloads.ts';

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
        const neitherEnabled = !gpu_mining_enabled && !cpu_mining_enabled;

        const enabled = neitherEnabled ? false : miningControlsEnabled;
        return {
            ...state,
            miningControlsEnabled: enabled,
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
    const cpuMiningModuleInitialized = setupStoreSelectors.isCpuMiningModuleInitialized(useSetupStore.getState());
    const enabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const initiated = useMiningStore.getState().isCpuMiningInitiated;

    if (!enabled || !cpuMiningModuleInitialized || initiated) return;

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
    if (!setupStoreSelectors.isGpuMiningModuleInitialized(useSetupStore.getState())) return;
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
        handleSessionMiningTime({ startTimestamp: Date.now() });
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
        handleSessionMiningTime({ stopTimestamp: Date.now() });
        console.info('Mining stopped.');
    } catch (e) {
        console.error('Failed to stop mining: ', e);
        setError(e as string);
    }
};
export const handleSelectedMinerChanged = (miner: GpuMinerType) => {
    useMiningStore.setState({ selectedMiner: miner });
};

export const handleAvailableMinersChanged = (miners: Record<GpuMinerType, GpuMiner>) => {
    useMiningStore.setState({ availableMiners: miners });
};

export const switchSelectedMiner = async (newGpuMiner: GpuMinerType) => {
    const oldMiner = useMiningStore.getState().selectedMiner;
    useMiningStore.setState({ selectedMiner: newGpuMiner });

    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    if (gpuMining || isGpuMiningInitiated) {
        await stopGpuMining();
    }
    try {
        await invoke('switch_gpu_miner', { gpuMinerType: newGpuMiner });

        if (anyMiningInitiated) {
            await startGpuMining();
        }
    } catch (e) {
        useMiningStore.setState({ selectedMiner: oldMiner });
        console.error('Could not switch selected miner: ', e);
        setError(e as string);
    }
};

export const handleSessionMiningTime = ({ startTimestamp, stopTimestamp }: SessionMiningTime) => {
    const current = useMiningStore.getState().sessionMiningTime;
    if (stopTimestamp) {
        const diff = (stopTimestamp || 0) - (current.startTimestamp || 0);
        useMiningStore.setState({
            sessionMiningTime: { ...current, startTimestamp, stopTimestamp, durationMs: diff },
        });
    }

    if (startTimestamp) {
        useMiningStore.setState({ sessionMiningTime: { ...current, startTimestamp } });
    }
};

export const checkMiningTime = () => {
    const current = useMiningStore.getState().sessionMiningTime;
    let stopTimestamp = current.stopTimestamp;

    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;
    const isStillMining = cpuMining || gpuMining;

    if (isStillMining) {
        const now = Date.now();
        handleSessionMiningTime({ stopTimestamp: now });
        stopTimestamp = now;
    }

    const diff = (stopTimestamp || 0) - (current.startTimestamp || 0);
    useMiningStore.setState({ sessionMiningTime: { ...current, durationMs: diff } });
    return diff;
};
