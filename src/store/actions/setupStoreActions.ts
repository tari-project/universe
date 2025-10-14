import { useSetupStore } from '../useSetupStore';
import {
    handleSessionMiningTime,
    startCpuMining,
    startGpuMining,
    stopCpuMining,
    stopGpuMining,
} from './miningStoreActions';
import {
    fetchApplicationsVersionsWithRetry,
    fetchTransactionsHistory,
    useConfigMiningStore,
    useMiningStore,
    useWalletStore,
} from '@app/store';

import { ProgressTrackerUpdatePayload, SetupPhase } from '@app/types/events-payloads';
import { AppModule, AppModuleState, AppModuleStatus } from '../types/setup';
import { fetchBridgeTransactionsHistory } from '@app/store/actions/bridgeApiActions.ts';
import { loadAnimation } from '@app/store/actions/uiStoreActions.ts';

export interface DisabledPhasesPayload {
    disabled_phases: SetupPhase[];
}

export const handleAppLoaded = async () => {
    console.info('Loading tower animation from Setup Store');
    console.info('[TOWER_LOG] in handleAppLoaded - before');
    await loadAnimation();
    console.info('[TOWER_LOG] in handleAppLoaded - after');
    const tari_address_base58 = useWalletStore.getState().tari_address_base58;
    await fetchBridgeTransactionsHistory(tari_address_base58);
    await fetchApplicationsVersionsWithRetry();
};

export const updateSetupProgress = (payload: ProgressTrackerUpdatePayload | undefined) => {
    if (!payload) {
        console.warn('No payload provided for setup progress update');
        return;
    }

    switch (payload.setup_phase) {
        case SetupPhase.Core:
            useSetupStore.setState((c) => ({ ...c, core_phase_setup_payload: payload }));
            break;
        case SetupPhase.CpuMining:
            useSetupStore.setState((c) => ({ ...c, cpu_mining_phase_setup_payload: payload }));
            break;
        case SetupPhase.GpuMining:
            useSetupStore.setState((c) => ({ ...c, gpu_mining_phase_setup_payload: payload }));
            break;
        case SetupPhase.Node:
            useSetupStore.setState((c) => ({ ...c, node_phase_setup_payload: payload }));
            break;
        case SetupPhase.Wallet:
            useSetupStore.setState((c) => ({ ...c, wallet_phase_setup_payload: payload }));
            break;
        default:
            console.warn(`Unknown setup phase: ${payload.title}`);
    }
};

export const clearSetupProgress = (setupPhase: SetupPhase) => {
    switch (setupPhase) {
        case SetupPhase.Core:
            useSetupStore.setState((c) => ({ ...c, core_phase_setup_payload: undefined }));
            break;
        case SetupPhase.CpuMining:
            useSetupStore.setState((c) => ({ ...c, cpu_mining_phase_setup_payload: undefined }));
            break;
        case SetupPhase.GpuMining:
            useSetupStore.setState((c) => ({ ...c, gpu_mining_phase_setup_payload: undefined }));
            break;
        case SetupPhase.Node:
            useSetupStore.setState((c) => ({ ...c, node_phase_setup_payload: undefined }));
            break;
        case SetupPhase.Wallet:
            useSetupStore.setState((c) => ({ ...c, wallet_phase_setup_payload: undefined }));
            break;
        default:
            console.warn(`Unknown setup phase: ${setupPhase}`);
    }
};

export const setInitialSetupFinished = (payload: boolean) => {
    useSetupStore.setState((c) => ({ ...c, isInitialSetupFinished: payload }));
};

export const updateDisabledPhases = (payload: DisabledPhasesPayload) => {
    useSetupStore.setState((c) => ({ ...c, disabled_phases: payload.disabled_phases }));
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
                error_messages: state.error_messages,
            },
        },
    }));
};

export const handleWalletModuleUpdateSideEffects = async (state: AppModuleState) => {
    switch (state.status) {
        case AppModuleStatus.Initialized: {
            const tx_history_filter = useWalletStore.getState().tx_history_filter;
            await fetchTransactionsHistory({ offset: 0, limit: 20, filter: tx_history_filter });
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
                handleSessionMiningTime({ startTimestamp: Date.now() });
                useMiningStore.setState((c) => ({ ...c, wasMineOnAppStartExecuted: true }));
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
                handleSessionMiningTime({ startTimestamp: Date.now() });
                useMiningStore.setState((c) => ({ ...c, wasMineOnAppStartExecuted: true }));
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

export const handleAppModulesUpdate = async (state: AppModuleState) => {
    updateAppModule(state);

    switch (state.module) {
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
