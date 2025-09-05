import { create } from 'zustand';

interface UserFeedbackStoreState {
    showCloseDialog: boolean;
    earlyClosedDismissed: boolean;
    showLongTimeDialog: boolean;
}

const initialState: UserFeedbackStoreState = {
    showCloseDialog: false,
    earlyClosedDismissed: false,
    showLongTimeDialog: false,
};

export const useUserFeedbackStore = create<UserFeedbackStoreState>()(() => ({
    ...initialState,
}));
export const setShowLongTimeDialog = (showLongTimeDialog: boolean) =>
    useUserFeedbackStore.setState({ showLongTimeDialog });
export const setShowCloseDialog = (showCloseDialog: boolean) => useUserFeedbackStore.setState({ showCloseDialog });
export const setEarlyClosedDismissed = (earlyClosedDismissed: boolean) =>
    useUserFeedbackStore.setState({ earlyClosedDismissed });
