import { loadTowerAnimation, setAnimationState } from '@tari-project/tari-tower';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

import { SetupTitleParams } from '../types/setup.ts';
import { useAppConfigStore } from '../useAppConfigStore';
import { useSetupStore } from '../useSetupStore';
import { startMining } from './miningStoreActions';
import { sidebarTowerOffset, TOWER_CANVAS_ID } from '@app/store';

export const setSetupComplete = async () => {
    // Proceed with auto mining when enabled
    const mine_on_app_start = useAppConfigStore.getState().mine_on_app_start;
    const cpu_mining_enabled = useAppConfigStore.getState().cpu_mining_enabled;
    const gpu_mining_enabled = useAppConfigStore.getState().gpu_mining_enabled;
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

    if (mine_on_app_start && useSetupStore.getState().miningUnlocked && (cpu_mining_enabled || gpu_mining_enabled)) {
        await startMining();
    }
    useSetupStore.setState({ setupComplete: true });
};

export const setSetupProgress = (setupProgress: number) => useSetupStore.setState({ setupProgress });
export const setSetupTitle = (setupTitle: string) => useSetupStore.setState({ setupTitle });
export const setHardwarePhaseComplete = (hardwarePhaseComplete: boolean) =>
    useSetupStore.setState({ hardwarePhaseComplete });

export const setMiningUnlocked = (miningUnlocked: boolean) => useSetupStore.setState({ miningUnlocked });
export const setSetupTitleParams = (setupTitleParams: SetupTitleParams) =>
    useSetupStore.setState((current) => {
        const isEqual = deepEqual(current.setupTitleParams, setupTitleParams);
        return { setupTitleParams: isEqual ? current.setupTitleParams : setupTitleParams };
    });
