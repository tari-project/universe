import { setShowLongTimeDialog, useUserFeedbackStore } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
import { useCallback, useEffect } from 'react';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';

const HOUR = 1000 * 60 * 60;

export function useCheckMiningTime() {
    const feedback = useConfigUIStore((s) => s.feedback);
    const wasFeedbackSent = useUserFeedbackStore((s) => s.wasFeedbackSent);
    const longMiningTimeMs = useUserFeedbackStore((s) => s.longMiningTimeMs);

    const checkDismissedTime = useCallback(() => {
        //TODO add helper/neaten nested vals ?
        const longTimeDismissed =
            feedback?.long_time_miner?.last_dismissed?.secs_since_epoch ||
            feedback?.long_time_miner?.last_dismissed?.timestamp;
        if (longTimeDismissed) {
            const now = new Date();
            const dismissedDate = new Date(longTimeDismissed * 1000);
            const diff = now.getTime() - dismissedDate.getTime();

            return diff * 1000 < HOUR * 24;
        } else {
            return false;
        }
    }, [feedback?.long_time_miner?.last_dismissed]);
    const handleModalCheck = useCallback(() => {
        const currentMiningTimeMs = checkMiningTime();
        if (currentMiningTimeMs < 1) return;
        const buffer = 1000 * 60 * 10; // 10 min
        const shouldShow = currentMiningTimeMs + buffer >= longMiningTimeMs;
        if (shouldShow) {
            setShowLongTimeDialog(true);
        }
    }, [longMiningTimeMs]);

    useEffect(() => {
        const dismissedWithinADay = checkDismissedTime();
        if (wasFeedbackSent || dismissedWithinADay) return;

        handleModalCheck();

        const interval = setInterval(() => {
            handleModalCheck();
        }, longMiningTimeMs);

        return () => {
            clearInterval(interval);
        };
    }, [wasFeedbackSent, checkDismissedTime, handleModalCheck, longMiningTimeMs]);
}
