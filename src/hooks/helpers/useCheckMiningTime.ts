import { setShowLongTimeDialog } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
import { useCallback, useEffect } from 'react';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';

const HOUR = 1000 * 60 * 60 * 60;
const INTERVAL = HOUR * 2.9; // safe check for just under 3 hours
export function useCheckMiningTime() {
    const feedback = useConfigUIStore((s) => s.feedback);
    const anyFeedbackSubmitted = feedback?.long_time_miner?.feedback_sent || feedback?.early_close?.feedback_sent;

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

    useEffect(() => {
        const dismissedWithinADay = checkDismissedTime();
        if (anyFeedbackSubmitted || dismissedWithinADay) return;

        const interval = setInterval(() => {
            const currentMiningTimeMs = checkMiningTime();
            if (currentMiningTimeMs < 1) return;
            const seconds = currentMiningTimeMs / 1000;
            const buffer = 1000 * 60 * 60 * 15; // 10 min
            const shouldShow = seconds + buffer >= HOUR * 3;
            if (shouldShow) {
                setShowLongTimeDialog(true);
            }
        }, INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [anyFeedbackSubmitted, checkDismissedTime]);
}
