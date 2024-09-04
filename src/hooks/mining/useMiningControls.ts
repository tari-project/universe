import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';

import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const setError = useAppStateStore((s) => s.setError);

    const setMiningLoading = useMiningStore((s) => s.setMiningLoading);
    const setMiningInitiated = useMiningStore((s) => s.setMiningInitiated);

    return useCallback(
        async (type: 'start' | 'stop' | 'pause') => {
            const isStart = type === 'start';
            setMiningLoading(isStart);
            setMiningInitiated(isStart);
            const invokeFn = isStart ? 'start_mining' : 'stop_mining';
            try {
                await invoke(invokeFn, {});
                console.info(`mining ${isStart ? 'started' : 'stopped'}`);
                await handleVisual(type);
                setMiningLoading(false);
            } catch (e) {
                const error = e as string;
                if (!isStart) {
                    setMiningInitiated(true);
                }
                setError(error);
            }
        },
        [handleVisual, setError, setMiningInitiated, setMiningLoading]
    );
}

export function useChangeMiningMode() {
    const handleMining = useMiningControls();
    const isMiningInProgress = useMiningStore((s) => s.isMiningInProgress);
    const setIsChangingMode = useMiningStore((s) => s.setIsChangingMode);

    return useCallback(
        async (mode: string) => {
            setIsChangingMode(true); // is is worth having this ? it's so quick...
            try {
                if (!isMiningInProgress) {
                    await invoke('set_mode', { mode });
                } else {
                    await handleMining('pause');
                    await invoke('set_mode', { mode }).then(() => {
                        handleMining('start');
                    });
                }
            } catch (e) {
                console.error('Could not change the mode', e);
            } finally {
                setIsChangingMode(false);
            }
        },
        [setIsChangingMode, isMiningInProgress, handleMining]
    );
}
