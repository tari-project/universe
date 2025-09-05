import { create } from 'zustand';

interface UserFeedbackStoreState {
    showCloseDialog: boolean;
    earlyClosedDismissed: boolean;
    showLongTimeDialog: boolean;
    closeMiningTimeMs: number;
    longMiningTimeMs: number;
}

const MINIMUM_MINING_TIME_MS = 1000 * 60 * 60 * 60; // one hour

const initialState: UserFeedbackStoreState = {
    showCloseDialog: false,
    earlyClosedDismissed: false,
    showLongTimeDialog: false,
    closeMiningTimeMs: MINIMUM_MINING_TIME_MS,
    longMiningTimeMs: MINIMUM_MINING_TIME_MS * 3,
};

export const useUserFeedbackStore = create<UserFeedbackStoreState>()(() => ({
    ...initialState,
}));
export const setShowLongTimeDialog = (showLongTimeDialog: boolean) =>
    useUserFeedbackStore.setState({ showLongTimeDialog });
export const setShowCloseDialog = (showCloseDialog: boolean) => useUserFeedbackStore.setState({ showCloseDialog });
export const setEarlyClosedDismissed = (earlyClosedDismissed: boolean) =>
    useUserFeedbackStore.setState({ earlyClosedDismissed });

//admin
export const setMininimumMiningTimeMs = (type: 'closeMiningTimeMs' | 'longMiningTimeMs', timeInMs: number) => {
    if (type === 'closeMiningTimeMs') {
        useUserFeedbackStore.setState({ closeMiningTimeMs: timeInMs });
    } else if (type === 'longMiningTimeMs') {
        useUserFeedbackStore.setState({ longMiningTimeMs: timeInMs });
    }
};
