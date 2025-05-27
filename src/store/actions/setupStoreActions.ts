import { loadTowerAnimation, setAnimationState } from '@tari-project/tari-tower';

import { useSetupStore } from '../useSetupStore';
import { startMining, stopMining } from './miningStoreActions';
import {
    fetchApplicationsVersionsWithRetry,
    initialFetchTxs,
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

export const handleAppUnlocked = async () => {
    useSetupStore.setState({ appUnlocked: true });
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
    // moved initialFetchTxs here so we don't call it constantly on sidebar open/close
    initialFetchTxs();
};
export const handleWalletUpdate = async (addressPayload: WalletAddress) => {
    const addressIsGenerated = addressPayload.is_tari_address_generated;
    const xcID = useConfigBEInMemoryStore.getState().exchangeId;

    setWalletAddress(addressPayload);
    setSeedlessUI(!addressIsGenerated);

    if (xcID) {
        const currentID = useExchangeStore.getState().content?.exchange_id;
        const canFetchXCContent = xcID && currentID !== xcID && xcID !== 'universal';
        if (canFetchXCContent) {
            await fetchExchangeContent(xcID);
        }
    }
};
export const handleCpuMiningUnlocked = async () => {
    useSetupStore.setState({ cpuMiningUnlocked: true });
    // Proceed with auto mining when enabled
    const mine_on_app_start = useConfigMiningStore.getState().mine_on_app_start;
    const cpu_mining_enabled = useConfigMiningStore.getState().cpu_mining_enabled;
    if (mine_on_app_start && cpu_mining_enabled) {
        await startMining();
    }
};
export const handleGpuMiningUnlocked = async () => {
    useSetupStore.setState({ gpuMiningUnlocked: true });
    // Proceed with auto mining when enabled
    const mine_on_app_start = useConfigMiningStore.getState().mine_on_app_start;
    const gpu_mining_enabled = useConfigMiningStore.getState().gpu_mining_enabled;
    if (mine_on_app_start && gpu_mining_enabled) {
        await startMining();
    }
};

export const handleWalletLocked = () => {
    useSetupStore.setState({ walletUnlocked: false });
};

export const handleCpuMiningLocked = async () => {
    useSetupStore.setState({ cpuMiningUnlocked: false });
    const isMiningInitiated = useMiningStore.getState().miningInitiated;

    if (isMiningInitiated) {
        await stopMining();
    }
};

export const handleGpuMiningLocked = async () => {
    useSetupStore.setState({ gpuMiningUnlocked: false });
    const isMiningInitiated = useMiningStore.getState().miningInitiated;

    if (isMiningInitiated) {
        await stopMining();
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

export const updateUnknownSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload | undefined) => {
    useSetupStore.setState({ unknown_phase_setup_payload: payload });
};
