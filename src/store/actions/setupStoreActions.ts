import { loadTowerAnimation, setAnimationState } from '@tari-project/tari-tower';

import { useAppConfigStore } from '../useAppConfigStore';
import { useSetupStore } from '../useSetupStore';
import { startMining } from './miningStoreActions';
import { fetchApplicationsVersionsWithRetry, sidebarTowerOffset, TOWER_CANVAS_ID } from '@app/store';
import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';

export const handleAppUnlocked = async () => {
    useSetupStore.setState({ appUnlocked: true });
    const visual_mode = useAppConfigStore.getState().visual_mode;
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
            useAppConfigStore.setState({ visual_mode: false });
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
    const mine_on_app_start = useAppConfigStore.getState().mine_on_app_start;
    const cpu_mining_enabled = useAppConfigStore.getState().cpu_mining_enabled;
    const gpu_mining_enabled = useAppConfigStore.getState().gpu_mining_enabled;
    if (mine_on_app_start && useSetupStore.getState().miningUnlocked && (cpu_mining_enabled || gpu_mining_enabled)) {
        await startMining();
    }
};

export const updateCoreSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload) => {
    useSetupStore.setState({ core_phase_setup_payload: payload });
};

export const updateHardwareSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload) => {
    useSetupStore.setState({ hardware_phase_setup_payload: payload });
};

export const updateRemoteNodeSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload) => {
    useSetupStore.setState({ remote_node_phase_setup_payload: payload });
};

export const updateLocalNodeSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload) => {
    useSetupStore.setState({ node_phase_setup_payload: payload });
};

export const updateWalletSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload) => {
    useSetupStore.setState({ wallet_phase_setup_payload: payload });
};

export const updateUnknownSetupPhaseInfo = (payload: ProgressTrackerUpdatePayload) => {
    useSetupStore.setState({ unknown_phase_setup_payload: payload });
};

// await setSetupComplete();
