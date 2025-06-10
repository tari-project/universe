import { loadTowerAnimation, setAnimationState } from '@tari-project/tari-tower';

import { useSetupStore } from '../useSetupStore';
import { startCpuMining, startGpuMining, stopCpuMining, stopGpuMining } from './miningStoreActions';
import {
    fetchApplicationsVersionsWithRetry,
    setWalletAddress,
    TOWER_CANVAS_ID,
    useConfigBEInMemoryStore,
    useConfigMiningStore,
    useConfigUIStore,
    useMiningStore,
    useUIStore,
} from '@app/store';
import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';

import { WalletAddress } from '@app/types/app-status.ts';
import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';
import { fetchExchangeContent, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { fetchBridgeTransactionsHistory } from './walletStoreActions';
import { SetupPhase } from '@app/types/backend-state';
import { useTappletsStore } from '../useTappletsStore';

export interface DisabledPhasesPayload {
    disabled_phases: SetupPhase[];
}

export const handleAppUnlocked = async () => {
    useSetupStore.setState({ appUnlocked: true });
    await fetchBridgeTransactionsHistory().catch((error) => {
        console.error('Could not fetch bridge transactions history:', error);
    });

    const visual_mode = useConfigUIStore.getState().visual_mode;
    const offset = useUIStore.getState().towerSidebarOffset;
    if (visual_mode) {
        try {
            console.info('Loading tower animation');
            await loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: offset });
            try {
                setAnimationState('showVisual');
            } catch (error) {
                console.error('Failed to set animation state:', error);
            }
        } catch (e) {
            console.error('Error at loadTowerAnimation:', e);
            useConfigUIStore.setState({ visual_mode: false });
        }
    }
    // todo move it to event
    await fetchApplicationsVersionsWithRetry();
};
export const handleWalletUnlocked = () => {
    useSetupStore.setState({ walletUnlocked: true });
};
export const handleWalletUpdate = async (addressPayload: WalletAddress) => {
    const addressIsGenerated = addressPayload.is_tari_address_generated;
    const xcID = useConfigBEInMemoryStore.getState().exchangeId;

    setWalletAddress(addressPayload);
    setSeedlessUI(!addressIsGenerated);

    if (xcID) {
        const currentID = useExchangeStore.getState().content?.exchange_id;
        const canFetchXCContent = xcID && currentID !== xcID && xcID !== 'classic';
        if (canFetchXCContent) {
            await fetchExchangeContent(xcID);
        }
    }
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
    console.info('[DEBUG EXCHANGE MINER] handleUpdateDisabledPhases ', payload);
    updateDisabledPhases(payload);
    if (payload.disabled_phases.includes(SetupPhase.Wallet)) {
        useTappletsStore.setState({ uiBridgeSwapsEnabled: false });
    }
};
