import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore';
import { useShallow } from 'zustand/react/shallow';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore';

export function useMiningControls() {
    const setMiningInitiated = useMiningStore((s) => s.setMiningInitiated);
    const setError = useAppStateStore(useShallow((s) => s.setError));

    const isMiningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));

    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));

    const isMining = isCPUMining || isGPUMining;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);

    const handleStart = useCallback(async () => {
        console.info('Mining starting....');
        setMiningInitiated(true);
        try {
            await invoke('start_mining', {});
        } catch (e) {
            console.error(e);
            const error = e as string;
            setError(error);
            setMiningInitiated(false);
        }
    }, [setError, setMiningInitiated]);

    const handleStop = useCallback(async () => {
        console.info('Mining stopping...');
        setMiningInitiated(false);
        try {
            await invoke('stop_mining', {});
        } catch (e) {
            console.error(e);
            const error = e as string;
            setError(error);
            setMiningInitiated(true);
        }
    }, [setError, setMiningInitiated]);

    const handlePause = useCallback(async () => {
        console.info('Mining pausing...');
        try {
            await invoke('stop_mining', {});
        } catch (e) {
            console.error(e);
            const error = e as string;
            setError(error);
            setMiningInitiated(true);
        }
    }, [setError, setMiningInitiated]);

    return { handleStart, handleStop, handlePause, isMiningLoading };
}
