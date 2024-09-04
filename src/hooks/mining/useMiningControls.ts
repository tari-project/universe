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
            setIsChangingMode(true);
            if (!isMiningInProgress) {
                return await invoke('set_mode', { mode });
            }

            if (isMiningInProgress) {
                await handleMining('pause');
                await invoke('set_mode', { mode }).finally(() => {
                    handleMining('start');
                });
            }
        },
        [setIsChangingMode, isMiningInProgress, handleMining]
    );
}
