import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
import { setIsShuttingDown } from '@app/store/actions/uiStoreActions.ts';

export function useShutdownHandler() {
    const [proceedWithShutdown, setProceedWithShutdown] = useState(false);

    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);

    const wasFeedbackSent = useUserFeedbackStore((s) => s.wasFeedbackSent);
    const wasLongTimeMiner = useUserFeedbackStore((s) => s.wasLongTimeMiner);
    const minimumMiningTimeForClose = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const promptDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);

    const handleShutdown = useCallback(async () => await invoke('exit_application'), []);

    const onShutdownCaught = useCallback(async () => {
        if (wasFeedbackSent || wasLongTimeMiner) {
            setProceedWithShutdown(true);
            return;
        }
        const currentMiningTimeMs = checkMiningTime();
        const isEarlyClose = !currentMiningTimeMs || currentMiningTimeMs < minimumMiningTimeForClose;

        if (isEarlyClose && !promptDismissed) {
            setShowCloseDialog(true);
        } else {
            setProceedWithShutdown(true);
        }
    }, [minimumMiningTimeForClose, promptDismissed, wasFeedbackSent, wasLongTimeMiner]);

    useEffect(() => {
        if (earlyClosedDismissed || proceedWithShutdown) {
            setIsShuttingDown(true);
            const shutdownTimeout = setTimeout(() => handleShutdown(), 250);
            return () => {
                clearTimeout(shutdownTimeout);
            };
        }
    }, [earlyClosedDismissed, handleShutdown, proceedWithShutdown]);

    return { onShutdownCaught };
}
