import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
import { setIsShuttingDown } from '@app/store/actions/uiStoreActions.ts';

export function useShutdownHandler() {
    const wasFeedbackSent = useUserFeedbackStore((s) => s.wasFeedbackSent);
    const wasLongTimeMiner = useUserFeedbackStore((s) => s.wasLongTimeMiner);
    const minimumMiningTimeForClose = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const promptDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);

    const handleShutdown = useCallback(async () => {
        setIsShuttingDown(true);
        await invoke('exit_application');
    }, []);

    const onShutdownCaught = useCallback(async () => {
        if (wasFeedbackSent || wasLongTimeMiner) {
            await handleShutdown();
        }
        const currentMiningTimeMs = checkMiningTime();

        const isEarlyClose = !currentMiningTimeMs || currentMiningTimeMs < minimumMiningTimeForClose;

        if (isEarlyClose && !promptDismissed) {
            setShowCloseDialog(true);
        } else {
            setIsShuttingDown(true);
            await handleShutdown();
        }
    }, [handleShutdown, minimumMiningTimeForClose, promptDismissed, wasFeedbackSent, wasLongTimeMiner]);

    return { onShutdownCaught };
}
