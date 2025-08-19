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

import { TOWER_CANVAS_ID } from '../types/ui';
import { ProgressTrackerUpdatePayload, SetupPhase } from '@app/types/events-payloads';
import { fetchBridgeTransactionsHistory } from './bridgeApiActions';
import { AppModule, AppModuleState, AppModuleStatus } from '../types/setup';

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

export const handleAppLoaded = async () => {
    await fetchBridgeTransactionsHistory().catch((error) => {
        console.error('Could not fetch bridge transactions history:', error);
    });
    // todo move it to event
    await fetchApplicationsVersionsWithRetry();
    await initializeAnimation();
};

export const updateSetupProgress = (payload: ProgressTrackerUpdatePayload | undefined) => {
    if (!payload) {
        console.warn('No payload provided for setup progress update');
        return;
    }

    switch (payload.setup_phase) {
        case SetupPhase.Core:
            useSetupStore.setState({ core_phase_setup_payload: payload });
            break;
        case SetupPhase.CpuMining:
            useSetupStore.setState({ cpu_mining_phase_setup_payload: payload });
            break;
        case SetupPhase.GpuMining:
            useSetupStore.setState({ gpu_mining_phase_setup_payload: payload });
            break;
        case SetupPhase.Node:
            useSetupStore.setState({ node_phase_setup_payload: payload });
            break;
        case SetupPhase.Wallet:
            useSetupStore.setState({ wallet_phase_setup_payload: payload });
            break;
        default:
            console.warn(`Unknown setup phase: ${payload.title}`);
    }
};

export const clearSetupProgress = (setupPhase: SetupPhase) => {
    switch (setupPhase) {
        case SetupPhase.Core:
            useSetupStore.setState({ core_phase_setup_payload: undefined });
            break;
        case SetupPhase.CpuMining:
            useSetupStore.setState({ cpu_mining_phase_setup_payload: undefined });
            break;
        case SetupPhase.GpuMining:
            useSetupStore.setState({ gpu_mining_phase_setup_payload: undefined });
            break;
        case SetupPhase.Node:
            useSetupStore.setState({ node_phase_setup_payload: undefined });
            break;
        case SetupPhase.Wallet:
            useSetupStore.setState({ wallet_phase_setup_payload: undefined });
            break;
        default:
            console.warn(`Unknown setup phase: ${setupPhase}`);
    }
};

export const setInitialSetupFinished = (payload: boolean) => {
    useSetupStore.setState({ isInitialSetupFinished: payload });
};

export const updateDisabledPhases = (payload: DisabledPhasesPayload) => {
    useSetupStore.setState({ disabled_phases: payload.disabled_phases });
};

export const handleUpdateDisabledPhases = (payload: DisabledPhasesPayload) => {
    updateDisabledPhases(payload);
};

export const updateAppModule = (state: AppModuleState) => {
    useSetupStore.setState((prevState) => ({
        app_modules: {
            ...prevState.app_modules,
            [state.module]: {
                ...prevState.app_modules[state.module],
                status: state.status,
                errorMessages: state.errorMessages,
            },
        },
    }));
};

export const handleWalletModuleUpdateSideEffects = async (state: AppModuleState) => {
    switch (state.status) {
        case AppModuleStatus.Initialized: {
            const tx_history_filter = useWalletStore.getState().tx_history_filter;
            await fetchTransactionsHistory({ offset: 0, limit: 20, filter: tx_history_filter });
            await fetchCoinbaseTransactions({
                offset: 0,
                limit: 20,
            });
            break;
        }
        case AppModuleStatus.Failed:
            break;
        case AppModuleStatus.NotInitialized:
            break;
        default:
            break;
    }
};

const handleCpuMiningModuleUpdateSideEffects = async (state: AppModuleState) => {
    switch (state.status) {
        case AppModuleStatus.Initialized: {
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
            break;
        }
        case AppModuleStatus.Failed:
            break;
        case AppModuleStatus.NotInitialized: {
            const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;

            if (isCpuMiningInitiated) {
                await stopCpuMining();
            }
            break;
        }
        default:
            break;
    }
};

const handleGpuMiningModuleUpdateSideEffects = async (state: AppModuleState) => {
    switch (state.status) {
        case AppModuleStatus.Initialized: {
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
            break;
        }
        case AppModuleStatus.Failed:
            break;
        case AppModuleStatus.NotInitialized: {
            const isMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;

            if (isMiningInitiated) {
                await stopGpuMining();
            }
            break;
        }
        default:
            break;
    }
};

export const handleMainAppModuleUpdateSideEffects = async (state: AppModuleState) => {
    switch (state.status) {
        case AppModuleStatus.Initialized:
            break;
        case AppModuleStatus.Failed:
            break;
        case AppModuleStatus.NotInitialized:
            break;
        default:
            break;
    }
};

export const handleAppModulesUpdate = async (state: AppModuleState) => {
    updateAppModule(state);

    switch (state.module) {
        case AppModule.MainApp:
            await handleMainAppModuleUpdateSideEffects(state);
            break;
        case AppModule.CpuMining:
            await handleCpuMiningModuleUpdateSideEffects(state);
            break;
        case AppModule.GpuMining:
            await handleGpuMiningModuleUpdateSideEffects(state);
            break;
        case AppModule.Wallet:
            await handleWalletModuleUpdateSideEffects(state);
            break;
        default:
            console.warn(`Unknown app module: ${state.module}`);
            break;
    }
};
