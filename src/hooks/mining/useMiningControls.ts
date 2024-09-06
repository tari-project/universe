import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const setError = useAppStateStore((s) => s.setError);

    return useCallback(
        async (type: 'start' | 'stop' | 'pause') => {
            const isStart = type === 'start';
            const invokeFn = isStart ? 'start_mining' : 'stop_mining';
            try {
                await invoke(invokeFn, {});
                console.info(`mining ${isStart ? 'started' : 'stopped'}`);
                await handleVisual(type);
                return true;
            } catch (e) {
                const error = e as string;
                setError(error);
                return false;
            }
        },
        [handleVisual, setError]
    );
}
