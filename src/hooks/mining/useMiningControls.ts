import { useCallback, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { useVisualisation } from './useVisualisation.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';

export enum MiningButtonStateText {
    STARTING = 'Starting mining',
    STARTED = 'Pause mining',
    START = 'Start mining',
    AUTO_MINING = 'Waiting for idle',
    AUTO_MINING_STARTED = 'Started auto mining',
}

export function useMiningControls() {
    const handleVisual = useVisualisation();
    const progress = useAppStateStore((s) => s.setupProgress);
    const miningAllowed = progress >= 1;
    const isMining = useCPUStatusStore((s) => s.is_mining);
    const isMiningEnabled = useCPUStatusStore((s) => s.is_mining_enabled);
    const isAutoMining = useAppStatusStore((s) => s.auto_mining);

    const hasMiningStartedAtLeastOnce = useRef(false);

    const isWaitingForHashRate = useMemo(() => {
        return !isMining && isMiningEnabled;
    }, [isMining, isMiningEnabled]);

    const startMining = useCallback(async () => {
        if (miningAllowed) {
            await invoke('start_mining', {}).then(() => {
                console.info(`mining started`);
            });
        }
    }, [miningAllowed]);

    const stopMining = useCallback(async () => {
        await invoke('stop_mining', {}).then(async () => {
            console.info(`mining stopped`);
            handleVisual('stop');
        });
    }, [handleVisual]);

    useEffect(() => {
        if (isMining) {
            handleVisual('start');
            hasMiningStartedAtLeastOnce.current = true;
        }
    }, [handleVisual, isMining]);

    const getMiningButtonStateText = useCallback(() => {
        if (isWaitingForHashRate) {
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
    }, [isAutoMining, isMining, isWaitingForHashRate]);

    return {
        startMining,
        stopMining,
        hasMiningBeenStopped: hasMiningStartedAtLeastOnce.current,
        getMiningButtonStateText,
        isWaitingForHashRate,
    };
}
