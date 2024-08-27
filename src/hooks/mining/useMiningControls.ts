import { useCallback, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';

export enum MiningButtonStateText {
    STARTING = 'Starting mining',
    STARTED = 'Pause mining',
    CONNECTION_LOST = 'Cancel mining',
    START = 'Start mining',
    AUTO_MINING = 'Waiting for idle',
    AUTO_MINING_STARTED = 'Started auto mining',
}

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const progress = useAppStateStore((s) => s.setupProgress);
    const isMining = useCPUStatusStore((s) => s.is_mining);
    const isAutoMining = useAppStatusStore((s) => s.auto_mining);
    const hashRate = useCPUStatusStore((s) => s.hash_rate);
    const { isMiningEnabled, setIsMiningEnabled } = useUIStore((s) => ({
        isMiningEnabled: s.isMiningEnabled,
        setIsMiningEnabled: s.setIsMiningEnabled,
    }));

    // const isMiningInProgress = useRef(false);

    // const connectionToMinerLost = useMemo(() => {
    //     return isMiningInProgress.current && !isMining;
    // }, [isMining, isMiningInProgress.current]);

    // useEffect(() => {
    //     if (isMiningInProgress.current && !isMining) {
    //         console.log('dupaaaaaaaaaaaaaa');
    //         handleVisual('pause');
    //     }
    // }, [isMining]);

    const isLoading = useMemo(() => {
        if (connectionToMinerLost) return false;
        return !isMining && isMiningEnabled;
    }, [isMining, isMiningEnabled, connectionToMinerLost]);

    const isWaitingForHashRate = useMemo(() => {
        return isLoading || (isMining && hashRate <= 0);
    }, [isMining, hashRate, isLoading]);

    const shouldMiningControlsBeEnabled = useMemo(() => {
        if (connectionToMinerLost) return true;

        if (!isMining && isMiningEnabled) return false;

        if (isMining && progress < 1) return true;

        if (progress >= 1 && !isAutoMining) return true;
        return false;
    }, [isAutoMining, isWaitingForHashRate, isMining, progress, isMiningEnabled, connectionToMinerLost]);

    const shouldAutoMiningControlsBeEnabled = useMemo(() => {
        if (isMiningEnabled && !isAutoMining) return false;

        if (isMining && progress < 1) return true;
        if (progress >= 1) return true;
        return false;
    }, [isAutoMining, isMining, progress, isMiningEnabled]);

    const startMining = useCallback(async () => {
        setIsMiningEnabled(true);
        await invoke('start_mining', {})
            .then(() => {
                console.info(`mining started`);
            })
            .catch(() => {
                setIsMiningEnabled(false);
            });
    }, []);

    const stopMining = useCallback(async () => {
        setIsMiningEnabled(false);
        isMiningInProgress.current = false;
        await invoke('stop_mining', {})
            .then(async () => {
                console.info(`mining stopped`);
                handleVisual('stop');
            })
            .catch(() => {
                setIsMiningEnabled(true);
                isMiningInProgress.current = true;
            });
    }, [handleVisual]);

    const cancelMining = useCallback(async () => {}, []);

    useEffect(() => {
        if (isMining && isMiningEnabled) {
            console.log('Useffect: handleVisual start');
            handleVisual('start');
            isMiningInProgress.current = true;
        }

        if (!isMining && !isMiningEnabled) {
            console.log('Useffect: handleVisual stop');
            handleVisual('stop');
            isMiningInProgress.current = false;
        }
    }, [handleVisual, isMining, isMiningEnabled]);

    const getMiningButtonStateText = useCallback(() => {
        if (connectionToMinerLost) {
            return MiningButtonStateText.CONNECTION_LOST;
        }

        if (isMiningEnabled && !isMining) {
            return MiningButtonStateText.STARTING;
        }

        if (isAutoMining && isMining) {
            return MiningButtonStateText.AUTO_MINING_STARTED;
        }

        if (isAutoMining) {
            return MiningButtonStateText.AUTO_MINING;
        }

        if (isMining) {
            return MiningButtonStateText.STARTED;
        }

        return MiningButtonStateText.START;
    }, [isAutoMining, isMining, isWaitingForHashRate, isMiningEnabled, connectionToMinerLost]);

    return {
        connectionToMinerLost,
        isMiningInProgress,
        isLoading,
        startMining,
        stopMining,
        getMiningButtonStateText,
        isWaitingForHashRate,
        shouldMiningControlsBeEnabled,
        shouldAutoMiningControlsBeEnabled,
    };
}
