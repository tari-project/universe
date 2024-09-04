import { useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';

export enum MiningButtonStateText {
    STARTING = 'starting-mining',
    STARTED = 'pause-mining',
    CONNECTION_LOST = 'cancel-mining',
    CHANGING_MODE = 'changing-mode',
    START = 'start-mining',
}

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const progress = useAppStateStore((s) => s.setupProgress);
    const setError = useAppStateStore((s) => s.setError);
    const isMining = useCPUStatusStore((s) => s.is_mining);

    const hashRate = useCPUStatusStore((s) => s.hash_rate);
    const { isMiningEnabled, setIsMiningEnabled } = useUIStore((s) => ({
        isMiningEnabled: s.isMiningEnabled,
        setIsMiningEnabled: s.setIsMiningEnabled,
    }));
    const { isConnectionLostDuringMining } = useUIStore((s) => ({
        isConnectionLostDuringMining: s.isConnectionLostDuringMining,
        setIsConnectionLostDuringMining: s.setIsConnectionLostDuringMining,
    }));

    const { isChangingMode, setIsChangingMode } = useUIStore((s) => ({
        isChangingMode: s.isChangingMode,
        setIsChangingMode: s.setIsChangingMode,
    }));
    const { isMiningInProgress } = useUIStore((s) => ({
        isMiningInProgress: s.isMiningInProgress,
        setIsMiningInProgress: s.setIsMiningInProgress,
    }));

    const isLoading = useMemo(() => {
        if (isConnectionLostDuringMining) return false;
        if (isChangingMode) return true;
        return !isMining && isMiningEnabled;
    }, [isMining, isMiningEnabled, isConnectionLostDuringMining, isChangingMode]);

    const isWaitingForHashRate = useMemo(() => {
        return isLoading || (isMining && hashRate <= 0);
    }, [isMining, hashRate, isLoading]);

    const shouldMiningControlsBeEnabled = useMemo(() => {
        if (isConnectionLostDuringMining) return true;

        if (isChangingMode) return false;

        if (!isMining && isMiningEnabled) return false;

        if (isMining && progress < 1) return true;

        return progress >= 1;
    }, [isMining, progress, isMiningEnabled, isConnectionLostDuringMining, isChangingMode]);

    const startMining = useCallback(async () => {
        setIsMiningEnabled(true);
        await invoke('start_mining', {})
            .then(() => {
                console.info(`mining started`);
            })
            .catch((e) => {
                setError(e);
            });
    }, [setIsMiningEnabled, setError]);

    const stopMining = useCallback(async () => {
        setIsMiningEnabled(false);
        await invoke('stop_mining', {})
            .then(async () => {
                console.info(`mining stopped`);
                await handleVisual('stop');
            })
            .catch(() => {
                setIsMiningEnabled(true);
            });
    }, [handleVisual, setIsMiningEnabled]);

    const cancelMining = useCallback(async () => {
        setIsMiningEnabled(false);
        await invoke('stop_mining', {}).then(async () => {
            console.info(`mining canceled`);
            await handleVisual('start');
            await handleVisual('stop');
        });
    }, [handleVisual, setIsMiningEnabled]);

    const changeMode = useCallback(
        async (mode: string) => {
            const hasBeenMining = isMiningInProgress;

            if (!hasBeenMining) {
                await invoke('set_mode', { mode });
                return;
            }

            setIsChangingMode(true);
            if (hasBeenMining && !isConnectionLostDuringMining) {
                await stopMining();
            }

            if (isConnectionLostDuringMining) {
                await cancelMining();
            }

            await invoke('set_mode', { mode });

            if (hasBeenMining && !isConnectionLostDuringMining) {
                setTimeout(async () => {
                    await startMining();
                }, 2000);
            }

            if (isConnectionLostDuringMining) {
                setIsChangingMode(false);
            }
        },
        [isMiningInProgress, isConnectionLostDuringMining, cancelMining, setIsChangingMode, startMining, stopMining]
    );

    const getMiningButtonStateText = useCallback(() => {
        if (isChangingMode) {
            return MiningButtonStateText.CHANGING_MODE;
        }

        if (isConnectionLostDuringMining) {
            return MiningButtonStateText.CONNECTION_LOST;
        }

        if (isMiningEnabled && !isMining) {
            return MiningButtonStateText.STARTING;
        }

        if (isMining) {
            return MiningButtonStateText.STARTED;
        }

        return MiningButtonStateText.START;
    }, [isChangingMode, isConnectionLostDuringMining, isMining, isMiningEnabled]);

    return {
        isMiningEnabled,
        cancelMining,
        changeMode,
        isConnectionLostDuringMining,
        isLoading,
        startMining,
        stopMining,
        getMiningButtonStateText,
        isWaitingForHashRate,
        shouldMiningControlsBeEnabled,
        isChangingMode,
    };
}
