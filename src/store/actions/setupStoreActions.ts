import { loadTowerAnimation, setAnimationState } from '@tari-project/tari-tower';

import { useSetupStore } from '../useSetupStore';
import { startMining, stopMining } from './miningStoreActions';
import {
    fetchApplicationsVersionsWithRetry,
    sidebarTowerOffset,
    TOWER_CANVAS_ID,
    useConfigMiningStore,
    useConfigUIStore,
    useMiningStore,
} from '@app/store';
import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';

export const handleAppUnlocked = async () => {
    useSetupStore.setState({ appUnlocked: true });
    const visual_mode = useConfigUIStore.getState().visual_mode;
    if (visual_mode) {
        try {
            console.info('Loading tower animation');
            await loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: sidebarTowerOffset });
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
export const handleMiningUnlocked = async () => {
    useSetupStore.setState({ miningUnlocked: true });
    // Proceed with auto mining when enabled
    const mine_on_app_start = useConfigMiningStore.getState().mine_on_app_start;
    const cpu_mining_enabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const gpu_mining_enabled = useConfigMiningStore.getState().gpu_mining_enabled;
    if (mine_on_app_start && (cpu_mining_enabled || gpu_mining_enabled)) {
        await startMining();
    }
};

export const handleWalletLocked = () => {
    useSetupStore.setState({ walletUnlocked: false });
};

export const handleMiningLocked = async () => {
    useSetupStore.setState({ miningUnlocked: false });
    const isMiningInitiated = useMiningStore.getState().miningInitiated;

    if (isMiningInitiated) {
        await stopMining();
    }
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

// await setSetupComplete();
