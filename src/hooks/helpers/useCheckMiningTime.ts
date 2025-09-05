import { setShowLongTimeDialog } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
import { useEffect } from 'react';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';

const _HOUR = 1000 * 60 * 60 * 60;
const INTERVAL = 1000 * 10; // safe check for just under 3 hours
// const INTERVAL = HOUR * 2.9; // safe check for just under 3 hours
export function useCheckMiningTime() {
    const feedback = useConfigUIStore((s) => s.feedback);
    const longTimeDismissed = feedback?.long_time_miner?.last_dismissed;
    const anyFeedbackSubmitted = feedback?.long_time_miner?.feedback_sent || feedback?.early_close?.feedback_sent;

    useEffect(() => {
        if (anyFeedbackSubmitted) return;
        const interval = setInterval(() => {
            const currentMiningTimeMs = checkMiningTime();
            const seconds = currentMiningTimeMs / 1000;
            const buffer = 1000 * 60 * 60 * 15; // 10 min
            if (seconds + buffer >= 1000 * 10 * 3) {
                setShowLongTimeDialog(true);
            }
        }, INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [anyFeedbackSubmitted, longTimeDismissed]);
}
