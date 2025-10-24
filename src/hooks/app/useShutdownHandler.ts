import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setShowCloseDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
import { setIsShuttingDown, setShowCloseInfoModal } from '@app/store/actions/uiStoreActions.ts';
import { queryClient } from '@app/App/queryClient.ts';
import { fetchSurvey } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import { useUIStore } from '@app/store';

export function useShutdownHandler() {
    const [canProceedWithShutdown, setCanProceedWithShutdown] = useState(false);
    const [promptDismissed, setPromptDismissed] = useState(false);
    const [isEarlyClose, setIsEarlyClose] = useState(false);
    const [shutdownInitiated, setShutdownInitiated] = useState(false);

    const wasFeedbackSent = useUserFeedbackStore((s) => s.wasFeedbackSent);
    const wasLongTimeMiner = useUserFeedbackStore((s) => s.wasLongTimeMiner);
    const minimumMiningTimeForClose = useUserFeedbackStore((s) => s.closeMiningTimeMs);
    const earlyClosedDismissed = useUserFeedbackStore((s) => s.earlyClosedDismissed);
    const isCloseInfoModalShown = useUIStore((s) => s.isCloseInfoModalShown);

    const handleShutdown = useCallback(async () => {
        console.info(`[handleShutdown] invoking exit_application`);
        await invoke('exit_application');
    }, []);

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
        if (!isCloseInfoModalShown) {
            setShowCloseInfoModal(true);
            return;
        }

        setShutdownInitiated(true);
        if (wasFeedbackSent || wasLongTimeMiner) {
            setCanProceedWithShutdown(true);
            return;
        }
        const isEarlyClose = validateMiningTime();

        if (isEarlyClose && !earlyClosedDismissed) {
            const qd = await queryClient.ensureQueryData({
                queryKey: ['surveys', 'close'],
                queryFn: async () => await fetchSurvey('close'),
            });

            if (qd && qd.slug === 'close') {
                setShowCloseDialog(true);
            } else {
                console.warn(`[early-close] no survey content available.`);
                setCanProceedWithShutdown(true);
            }
        } else {
            setCanProceedWithShutdown(true);
        }
    }, [earlyClosedDismissed, isCloseInfoModalShown, validateMiningTime, wasFeedbackSent, wasLongTimeMiner]);

    useEffect(() => {
        if (isEarlyClose) {
            setPromptDismissed(earlyClosedDismissed);
        }
    }, [earlyClosedDismissed, isEarlyClose]);

    useEffect(() => {
        if (canProceedWithShutdown || promptDismissed) {
            setIsShuttingDown(true);
            const shutdownTimeout = setTimeout(() => handleShutdown(), 50);
            return () => {
                clearTimeout(shutdownTimeout);
            };
        }
    }, [promptDismissed, handleShutdown, canProceedWithShutdown]);

    return { onShutdownCaught, shutdownInitiated };
}
