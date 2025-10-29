import { create } from 'zustand';
import { FeedbackPrompts } from '@app/types/configs.ts';

interface UserFeedbackStoreState {
    earlyClosedDismissed: boolean;
    showLongTimeDialog: boolean;
    closeMiningTimeMs: number;
    longMiningTimeMs: number;
    wasFeedbackSent: boolean;
    wasLongTimeMiner: boolean;
}

const ONE_HOUR_IN_MS = 1000 * 60 * 60; // one hour
const CLOSE_MINIMUM_MINING_TIME = ONE_HOUR_IN_MS * 24;
const LONG_MINIMUM_MINING_TIME = ONE_HOUR_IN_MS * 48;

const initialState: UserFeedbackStoreState = {
    earlyClosedDismissed: false,
    showLongTimeDialog: false,
    closeMiningTimeMs: CLOSE_MINIMUM_MINING_TIME,
    longMiningTimeMs: LONG_MINIMUM_MINING_TIME,
    wasFeedbackSent: false,
    wasLongTimeMiner: false,
};

export const useUserFeedbackStore = create<UserFeedbackStoreState>()(() => ({
    ...initialState,
}));
export const setShowLongTimeDialog = (showLongTimeDialog: boolean) =>
    useUserFeedbackStore.setState({ showLongTimeDialog });
export const setEarlyClosedDismissed = (earlyClosedDismissed: boolean) =>
    useUserFeedbackStore.setState({ earlyClosedDismissed });

export const setFeedbackConfigItems = (feedbackConfig?: FeedbackPrompts) => {
    if (!feedbackConfig) return;
    const longTimeMinerSent = feedbackConfig.long_time_miner?.feedback_sent || false;
    const longTimeMinerDimissed = feedbackConfig.long_time_miner?.last_dismissed;
    const earlyCloseSent = feedbackConfig.early_close?.feedback_sent || false;

    const wasLongTimeMiner = longTimeMinerSent || longTimeMinerDimissed !== null;
    const wasFeedbackSent = longTimeMinerSent || earlyCloseSent;

    useUserFeedbackStore.setState({ wasFeedbackSent, wasLongTimeMiner });
};

//admin
export const setMininimumMiningTimeMs = (type: 'closeMiningTimeMs' | 'longMiningTimeMs', timeInMs: number) => {
    if (type === 'closeMiningTimeMs') {
        useUserFeedbackStore.setState({ closeMiningTimeMs: timeInMs });
    } else if (type === 'longMiningTimeMs') {
        useUserFeedbackStore.setState({ longMiningTimeMs: timeInMs });
    }
};
