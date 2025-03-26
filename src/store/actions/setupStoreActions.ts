import { setAnimationState } from '@tari-project/tari-tower';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

import { SetupTitleParams } from '../types/setup.ts';
import { useAppConfigStore } from '../useAppConfigStore';
import { useSetupStore } from '../useSetupStore';
import { startMining } from './miningStoreActions';

export const setSetupComplete = async () => {
    // Proceed with auto mining when enabled
    const mine_on_app_start = useAppConfigStore.getState().mine_on_app_start;
    const cpu_mining_enabled = useAppConfigStore.getState().cpu_mining_enabled;
    const gpu_mining_enabled = useAppConfigStore.getState().gpu_mining_enabled;
    const visual_mode = useAppConfigStore.getState().visual_mode;
    if (visual_mode) {
        try {
            setAnimationState('showVisual');
        } catch (error) {
            console.error('Failed to set animation state:', error);
        }
    }
    if (mine_on_app_start && (cpu_mining_enabled || gpu_mining_enabled)) {
        await startMining();
    }
    useSetupStore.setState({ setupComplete: true });
    // TODO! - remove after testing
    // useSetupStore.setState({ setupComplete: false });
};

export const setSetupProgress = (setupProgress: number) => useSetupStore.setState({ setupProgress });
export const setSetupTitle = (setupTitle: string) => useSetupStore.setState({ setupTitle });
export const setSetupTitleParams = (setupTitleParams: SetupTitleParams) =>
    useSetupStore.setState((current) => {
        const isEqual = deepEqual(current.setupTitleParams, setupTitleParams);
        return { setupTitleParams: isEqual ? current.setupTitleParams : setupTitleParams };
    });
