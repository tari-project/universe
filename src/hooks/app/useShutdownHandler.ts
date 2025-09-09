import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
import { setIsShuttingDown } from '@app/store/actions/uiStoreActions.ts';

export function useShutdownHandler() {
    const [canProceedWithShutdown, setCanProceedWithShutdown] = useState(false);
    const [promptDismissed, setPromptDismissed] = useState(false);
    const [isEarlyClose, setIsEarlyClose] = useState(false);

    const wasFeedbackSent = useUserFeedbackStore((s) => s.wasFeedbackSent);
    const wasLongTimeMiner = useUserFeedbackStore((s) => s.wasLongTimeMiner);
    const minimumMiningTimeForClose = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);

    const handleShutdown = useCallback(async () => await invoke('exit_application'), []);

    const validateMiningTime = useCallback(() => {
        const currentMiningTimeMs = checkMiningTime();
        const minimumNotMet = !currentMiningTimeMs || currentMiningTimeMs < minimumMiningTimeForClose;
        if (minimumNotMet) {
            console.info(`[early-close] Shutdown caught. Mining time: ${currentMiningTimeMs} (ms)`);
        }
        setIsEarlyClose(minimumNotMet);
        return minimumNotMet;
    }, [minimumMiningTimeForClose]);

    const onShutdownCaught = useCallback(async () => {
        if (wasFeedbackSent || wasLongTimeMiner) {
            setCanProceedWithShutdown(true);
            return;
        }
        const isEarlyClose = validateMiningTime();
        if (isEarlyClose && !earlyClosedDismissed) {
            setShowCloseDialog(true);
        } else {
            setCanProceedWithShutdown(true);
        }
    }, [earlyClosedDismissed, validateMiningTime, wasFeedbackSent, wasLongTimeMiner]);

    useEffect(() => {
        if (isEarlyClose) {
            setPromptDismissed(earlyClosedDismissed);
        }
    }, [earlyClosedDismissed, isEarlyClose]);

    useEffect(() => {
        if (canProceedWithShutdown || promptDismissed) {
            setIsShuttingDown(true);
            const shutdownTimeout = setTimeout(() => handleShutdown(), 250);
            return () => {
                clearTimeout(shutdownTimeout);
            };
        }
    }, [promptDismissed, handleShutdown, canProceedWithShutdown]);

    return { onShutdownCaught };
}
