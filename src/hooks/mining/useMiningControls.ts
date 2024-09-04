import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

import { useMiningStore } from '@app/store/useMiningStore.ts';

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const setError = useAppStateStore((s) => s.setError);
    const isMining = useCPUStatusStore((s) => s.is_mining);

    const setMiningLoading = useMiningStore((s) => s.setMiningLoading);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const setMiningInitiated = useMiningStore((s) => s.setMiningInitiated);

    useEffect(() => {
        const initLoading = miningInitiated && !isMining;
        const modeChange = miningInitiated && isChangingMode;
        setMiningLoading(initLoading || modeChange);
    }, [isChangingMode, isMining, miningInitiated, setMiningLoading]);

    return useCallback(
        async (type: 'start' | 'stop' | 'pause') => {
            const isStart = type === 'start';
            setMiningInitiated(!isStart);
            const invokeFn = isStart ? 'start_mining' : 'stop_mining';
            invoke(invokeFn, {})
                .then(() => {
                    console.info(`mining ${isStart ? 'started' : 'stopped'}`);
                    handleVisual(type);
                })
                .catch((e) => {
                    setError(e);
                    if (!isStart) {
                        setMiningInitiated(true);
                    }
                });
        },
        [handleVisual, setError, setMiningInitiated]
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
                return await invoke('set_mode', { mode }).finally(() => setIsChangingMode(false));
            }

            if (isMiningInProgress) {
                await handleMining('pause');
                await invoke('set_mode', { mode }).finally(() => {
                    handleMining('start');
                    setIsChangingMode(false);
                });
            }
        },
        [setIsChangingMode, isMiningInProgress, handleMining]
    );
}
