import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { modeType } from '@app/store/types.ts';
import { GpuThreads } from '@app/types/app-status.ts';

interface ChangeMiningModeArgs {
    mode: modeType;
    customGpuLevels?: GpuThreads[];
    customCpuLevels?: number;
}

const stopMining = async () => {
    console.info('Mining stopping...');
    useMiningStore.setState({ miningInitiated: false });
    try {
        await invoke('stop_mining', {});
        console.info('Mining stopped.');
    } catch (e) {
        const appStateStore = useAppStateStore.getState();
        console.error('Failed to stop mining: ', e);
        appStateStore.setError(e as string);
        useMiningStore.setState({ miningInitiated: true });
    }
};
const startMining = async () => {
    console.info('Mining starting....');
    useMiningStore.setState({ miningInitiated: true });
    useBlockchainVisualisationStore
        .getState()
        .setDisplayBlockTime({ daysString: '', hoursString: '', minutes: '00', seconds: '00' });
    try {
        await invoke('start_mining', {});
        console.info('Mining started.');
    } catch (e) {
        const appStateStore = useAppStateStore.getState();
        console.error('Failed to start mining: ', e);
        appStateStore.setError(e as string);
        useMiningStore.setState({ miningInitiated: false });
    }
};
const pauseMining = async () => {
    console.info('Mining pausing...');
    try {
        await invoke('stop_mining', {});
        console.info('Mining paused.');
    } catch (e) {
        const appStateStore = useAppStateStore.getState();
        console.error('Failed to pause (stop) mining: ', e);
        appStateStore.setError(e as string);
        useMiningStore.setState({ miningInitiated: true });
    }
};

const changeMiningMode = async (params: ChangeMiningModeArgs) => {
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
        const appConfigState = useAppConfigStore.getState();
        await appConfigState.setMode({
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

const setMiningNetwork = async () => {
    try {
        const network = (await invoke('get_network', {})) as string;
        useMiningStore.setState({ network });
    } catch (e) {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not get network: ', e);
        appStateStore.setError(e as string);
        useMiningStore.setState({ excludedGpuDevices: undefined });
    }
};

export { startMining, pauseMining, stopMining, changeMiningMode, setMiningNetwork };
