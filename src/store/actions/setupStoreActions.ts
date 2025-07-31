import { loadTowerAnimation, setAnimationState } from '@tari-project/tari-tower';

import { useSetupStore } from '../useSetupStore';
import { startCpuMining, startGpuMining, stopCpuMining, stopGpuMining } from './miningStoreActions';
import {
    fetchApplicationsVersionsWithRetry,
    fetchCoinbaseTransactions,
    fetchTransactionsHistory,
    useConfigMiningStore,
    useConfigUIStore,
    useMiningStore,
    useUIStore,
    useWalletStore,
} from '@app/store';
import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';

import { TOWER_CANVAS_ID } from '../types/ui';
import { SetupPhase } from '@app/types/events-payloads';
import { fetchBridgeTransactionsHistory } from './bridgeApiActions';

export interface DisabledPhasesPayload {
    disabled_phases: SetupPhase[];
}

async function initializeAnimation() {
    const visual_mode = useConfigUIStore.getState().visual_mode;
    const towerInitalized = useUIStore.getState().towerInitalized;
    if (!visual_mode || towerInitalized) return;

    const offset = useUIStore.getState().towerSidebarOffset;
    try {
        console.info('Loading tower animation from Setup Store');
        let loaded = false;
        try {
            await loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: offset });
            useUIStore.setState({ towerInitalized: true });

            loaded = true;
        } catch (error) {
            console.error('Failed to set animation state:', error);
            useUIStore.setState({ towerInitalized: false });

            loaded = false;
        } finally {
            if (loaded) {
                setAnimationState('showVisual');
            }
        }
    } catch (e) {
        console.error('Error at loadTowerAnimation:', e);
        useConfigUIStore.setState((c) => ({ ...c, visual_mode: false }));
        useUIStore.setState({ towerInitalized: false });
    }
}

export const handleAppUnlocked = async () => {
    useSetupStore.setState({ appUnlocked: true });
    await fetchBridgeTransactionsHistory().catch((error) => {
        console.error('Could not fetch bridge transactions history:', error);
    });
    // todo move it to event
    await fetchApplicationsVersionsWithRetry();
    await initializeAnimation();
};
export const handleWalletUnlocked = async () => {
    useSetupStore.setState({ walletUnlocked: true });
    // Initial fetch of transactions
    const tx_history_filter = useWalletStore.getState().tx_history_filter;
    await fetchTransactionsHistory({ offset: 0, limit: 20, filter: tx_history_filter });
    await fetchCoinbaseTransactions({
        offset: 0,
        limit: 20,
    });
};

export const handleCpuMiningUnlocked = async () => {
    useSetupStore.setState({ cpuMiningUnlocked: true });

    const mineOnAppStart = useConfigMiningStore.getState().mine_on_app_start;
    const cpuMiningEnabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const gpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const wasMineOnAppStartExecuted = useMiningStore.getState().wasMineOnAppStartExecuted;
    if (mineOnAppStart && cpuMiningEnabled && !wasMineOnAppStartExecuted) {
        await startCpuMining();
        useMiningStore.setState({ wasMineOnAppStartExecuted: true });
    } else if (gpuMiningInitiated && cpuMiningEnabled) {
        await startCpuMining();
    }
};
export const handleGpuMiningUnlocked = async () => {
    useSetupStore.setState({ gpuMiningUnlocked: true });

    const mineOnAppStart = useConfigMiningStore.getState().mine_on_app_start;
    const gpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;
    const cpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const wasMineOnAppStartExecuted = useMiningStore.getState().wasMineOnAppStartExecuted;
    if (mineOnAppStart && gpuMiningEnabled && !wasMineOnAppStartExecuted) {
        await startGpuMining();
        useMiningStore.setState({ wasMineOnAppStartExecuted: true });
    } else if (cpuMiningInitiated && gpuMiningEnabled) {
        await startGpuMining();
    }
};

export const handleWalletLocked = () => {
    useSetupStore.setState({ walletUnlocked: false });
};

export const handleCpuMiningLocked = async () => {
    useSetupStore.setState({ cpuMiningUnlocked: false });
    const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;

    if (isCpuMiningInitiated) {
        await stopCpuMining();
    }
};

export const handleGpuMiningLocked = async () => {
    useSetupStore.setState({ gpuMiningUnlocked: false });
    const isMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;

    if (isMiningInitiated) {
        await stopGpuMining();
    }
};

export const handleHardwarePhaseFinished = async () => {
    useSetupStore.setState({ hardwarePhaseFinished: true });
};

export const setInitialSetupFinished = (payload: boolean) => {
    useSetupStore.setState({ isInitialSetupFinished: payload });
};

export const updateCoreSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload | undefined) => {
    useSetupStore.setState({ core_phase_setup_payload: payload });
};

export const updateHardwareSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload | undefined) => {
    useSetupStore.setState({ hardware_phase_setup_payload: payload });
};

export const updateNodeSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload | undefined) => {
    useSetupStore.setState({ node_phase_setup_payload: payload });
};

export const updateWalletSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload | undefined) => {
    useSetupStore.setState({ wallet_phase_setup_payload: payload });
};

export const updateMiningSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload | undefined) => {
    useSetupStore.setState({ mining_phase_setup_payload: payload });
};

export const updateDisabledPhases = (payload: DisabledPhasesPayload) => {
    useSetupStore.setState({ disabled_phases: payload.disabled_phases });
};

export const handleUpdateDisabledPhases = (payload: DisabledPhasesPayload) => {
    updateDisabledPhases(payload);
};
