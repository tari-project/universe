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
    const { isConnectionLostDuringMining, setIsConnectionLostDuringMining } = useUIStore((s) => ({
        isConnectionLostDuringMining: s.isConnectionLostDuringMining,
        setIsConnectionLostDuringMining: s.setIsConnectionLostDuringMining,
    }));

    const isMiningInProgress = useRef(false);

    const isLoading = useMemo(() => {
        if (isConnectionLostDuringMining) return false;
        return !isMining && isMiningEnabled;
    }, [isMining, isMiningEnabled, isConnectionLostDuringMining]);

    const isWaitingForHashRate = useMemo(() => {
        return isLoading || (isMining && hashRate <= 0);
    }, [isMining, hashRate, isLoading]);

    const shouldMiningControlsBeEnabled = useMemo(() => {
        if (isConnectionLostDuringMining) return true;

        if (!isMining && isMiningEnabled) return false;

        if (isMining && progress < 1) return true;

        if (progress >= 1 && !isAutoMining) return true;
        return false;
    }, [isAutoMining, isWaitingForHashRate, isMining, progress, isMiningEnabled, isConnectionLostDuringMining]);

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
        await invoke('stop_mining', {})
            .then(async () => {
                console.info(`mining stopped`);
                handleVisual('stop');
            })
            .catch(() => {
                setIsMiningEnabled(true);
            });
    }, [handleVisual]);

    const cancelMining = useCallback(async () => {
        setIsMiningEnabled(false);
        await invoke('stop_mining', {}).then(async () => {
            console.info(`mining canceled`);
            handleVisual('start');
            handleVisual('stop');
        });
    }, []);

    useEffect(() => {
        if (isMining && isMiningEnabled) {
            if (isConnectionLostDuringMining) setIsConnectionLostDuringMining(false);
            console.log('Useffect: handleVisual start');
            handleVisual('start');
            isMiningInProgress.current = true;
        }

        if (!isMining && !isMiningEnabled) {
            if (isConnectionLostDuringMining) setIsConnectionLostDuringMining(false);
            console.log('Useffect: handleVisual stop');
            handleVisual('stop');
            isMiningInProgress.current = false;
        }

        if (!isMining && isMiningInProgress.current) {
            console.log('Useffect: handleVisual pause');
            setIsConnectionLostDuringMining(true);
            handleVisual('pause');
        }
    }, [handleVisual, isMining, isMiningEnabled, isConnectionLostDuringMining]);

    const getMiningButtonStateText = useCallback(() => {
        if (isConnectionLostDuringMining) {
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
    }, [isAutoMining, isMining, isWaitingForHashRate, isMiningEnabled, isConnectionLostDuringMining]);

    return {
        cancelMining,
        isConnectionLostDuringMining,
        isLoading,
        startMining,
        stopMining,
        getMiningButtonStateText,
        isWaitingForHashRate,
        shouldMiningControlsBeEnabled,
        shouldAutoMiningControlsBeEnabled,
    };
}
