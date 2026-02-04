import { invoke } from '@tauri-apps/api/core';

import { useMiningMetricsStore } from '../useMiningMetricsStore.ts';

import { ResumeMiningTime, SessionMiningTime, useMiningStore } from '../useMiningStore.ts';
import { setError } from './appStateStoreActions.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useConfigMiningStore } from '../useAppConfigStore.ts';
import { Network } from '@app/utils/network.ts';
import { setupStoreSelectors } from '../selectors/setupStoreSelectors.ts';
import { GpuMiner, GpuMinerType, MinerControlsState } from '@app/types/events-payloads.ts';
import { MiningModeType } from '@app/types/configs.ts';
import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { TimeUnit } from '@app/types/mining/schedule.ts';

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
export const setCustomLevelsDialogOpen = (customLevelsDialogOpen: boolean) =>
    useMiningStore.setState({ customLevelsDialogOpen });

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

    console.info('CPU Mining starting....');
    try {
        useMiningStore.setState({ isCpuMiningInitiated: true });
        await invoke('start_cpu_mining', {});
        console.info('CPU Mining started.');
    } catch (e) {
        console.error('Failed to start CPU mining: ', e);
        setError(e as string);
    }
};
export const startGpuMining = async () => {
    if (!setupStoreSelectors.isGpuMiningModuleInitialized(useSetupStore.getState())) return;
    if (!useConfigMiningStore.getState().gpu_mining_enabled) return;
    if (useMiningStore.getState().isGpuMiningInitiated) return;

    console.info('GPU Mining starting....');
    try {
        useMiningStore.setState({ isGpuMiningInitiated: true });
        await invoke('start_gpu_mining', {});
        console.info('GPU Mining started.');
    } catch (e) {
        console.error('Failed to start GPU mining: ', e);
        setError(e as string);
    }
};
export const stopCpuMining = async () => {
    if (!useMiningStore.getState().isCpuMiningInitiated) return;

    console.info('CPU Mining stopping...');
    try {
        useMiningStore.setState({ isCpuMiningInitiated: false });
        await invoke('stop_cpu_mining', {});
        console.info('CPU Mining stopped.');
    } catch (e) {
        console.error('Failed to stop CPU mining: ', e);
        setError(e as string);
    }
};
export const stopGpuMining = async () => {
    if (!useMiningStore.getState().isGpuMiningInitiated) return;

    console.info('GPU Mining stopping...');
    try {
        useMiningStore.setState({ isGpuMiningInitiated: false });
        await invoke('stop_gpu_mining', {});
        console.info('GPU Mining stopped.');
    } catch (e) {
        console.error('Failed to stop GPU mining: ', e);
        setError(e as string);
    }
};

function handleStartSideEffects() {
    handleSessionMiningTime({ startTimestamp: Date.now() });
    setResumeDuration(undefined);
}

function handleStopSideEffects() {
    handleSessionMiningTime({ stopTimestamp: Date.now() });
}

function handleEcoAlertCheck(diffSeconds?: number) {
    const eco_alert_needed = useConfigMiningStore.getState().eco_alert_needed;
    const isEco = useConfigMiningStore.getState().getSelectedMiningMode()?.mode_type === MiningModeType.Eco;
    if (!eco_alert_needed || !isEco) return;

    let duration = diffSeconds;
    if (!diffSeconds) {
        duration = useConfigMiningStore.getState().mode_mining_times?.Eco.secs;
    }

    void invoke('set_mode_mining_time', { mode: 'Eco', duration });
}

export const startMining = async () => {
    console.info('Mining starting....');
    handleEcoAlertCheck();
    try {
        await startCpuMining();
        await startGpuMining();
        handleStartSideEffects();
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
        handleStopSideEffects();
        console.info('Mining stopped.');
    } catch (e) {
        console.error('Failed to stop mining: ', e);
        setError(e as string);
    }
};

export const pauseMining = async (duration: number) => {
    invoke('add_scheduler_event', {
        eventId: 'pause_mining',
        eventTime: { In: { time_value: duration, time_unit: TimeUnit.Hours } },
        eventType: 'ResumeMining',
    })
        .then(() => {
            stopMining();
            setResumeDuration({ durationHours: duration, timeStamp: Date.now() });
        })
        .catch((e) => console.error(e));
};

export const setResumeDuration = (selectedResumeDuration: ResumeMiningTime | undefined) => {
    useMiningStore.setState({ selectedResumeDuration });
};
export const handleSelectedMinerChanged = (miner: GpuMinerType) => {
    useMiningStore.setState({ selectedMiner: miner });
};

export const handleAvailableMinersChanged = (miners: Record<GpuMinerType, GpuMiner>) => {
    useMiningStore.setState({ availableMiners: miners });
};

export const handleSessionMiningTime = ({ startTimestamp, stopTimestamp }: SessionMiningTime) => {
    const current = useMiningStore.getState().sessionMiningTime;
    if (stopTimestamp) {
        const diff = (stopTimestamp || 0) - (current.startTimestamp || 0);
        const diffSeconds = Number((diff / 1000).toFixed());

        handleEcoAlertCheck(diffSeconds);

        useMiningStore.setState({
            sessionMiningTime: { ...current, stopTimestamp, durationMs: diff },
        });
    }

    if (startTimestamp && !current.startTimestamp) {
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

export const handleCpuMinerControlsStateChanged = (state: MinerControlsState) => {
    switch (state) {
        case MinerControlsState.Idle:
            useMiningStore.setState({ isCpuMiningInitiated: false });
            break;
        case MinerControlsState.Started: {
            useMiningStore.setState({ isCpuMiningInitiated: true });
            handleStartSideEffects();
            break;
        }
        case MinerControlsState.Stopped:
            useMiningStore.setState({ isCpuMiningInitiated: false });
            handleStopSideEffects();
            break;
    }
};

export const handleGpuMinerControlsStateChanged = (state: MinerControlsState) => {
    switch (state) {
        case MinerControlsState.Idle:
            useMiningStore.setState({ isGpuMiningInitiated: false });
            break;
        case MinerControlsState.Started:
            useMiningStore.setState({ isGpuMiningInitiated: true });
            handleStartSideEffects();
            break;
        case MinerControlsState.Stopped:
            useMiningStore.setState({ isGpuMiningInitiated: false });
            handleStopSideEffects();
            break;
    }
};

export const setShowEcoAlert = (showEcoAlert: boolean) => {
    const ff = useAirdropStore.getState().features;
    const canShow = ff?.includes(FEATURE_FLAGS.FE_UI_ECO_ALERT);

    useMiningStore.setState({ showEcoAlert: canShow && showEcoAlert });
};

export const setLastSelectedMiningModeNameForSchedulerEvent = (modeName: string) => {
    useMiningStore.setState({ eventSchedulerLastSelectedMiningModeName: modeName });
};
