import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';

import { useMiningStore } from '@app/store/useMiningStore.ts';

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

export function useChangeMiningMode() {
    const handleMining = useMiningControls();
    const setIsChangingMode = useMiningStore((s) => s.setIsChangingMode);

    return useCallback(
        async (mode: string) => {
            setIsChangingMode(true); // is is worth having this ? it's so quick...
            try {
                if (!isMiningInProgress) {
                    await invoke('set_mode', { mode }).finally(() => setIsChangingMode(false));
                } else {
                    await handleMining('pause');
                    await invoke('set_mode', { mode })
                        .then(() => handleMining('start'))
                        .finally(() => setIsChangingMode(false));
                }
            } catch (e) {
                console.error('Could not change the mode', e);
            }
        },
        [setIsChangingMode, handleMining]
    );
}
