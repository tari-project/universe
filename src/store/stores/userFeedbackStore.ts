import { create } from 'zustand';

interface State {
    showCloseDialog: boolean;
    earlyClosedDismissed: boolean;
    miningTimeInSec: number;
}
interface Actions {
    toggleCloseDialog: () => void;
}

const initialState: State = {
    showCloseDialog: false,
    earlyClosedDismissed: false,
    miningTimeInSec: 60 * 30,
};

type UserFeedbackStoreState = State & Actions;
export const useUserFeedbackStore = create<UserFeedbackStoreState>()((set) => ({
    ...initialState,
    toggleCloseDialog: () =>
        set((c) => ({
            showCloseDialog: !c.showCloseDialog,
        })),
}));

export const setShowCloseDialog = (showCloseDialog: boolean) => useUserFeedbackStore.setState({ showCloseDialog });
export const setEarlyClosedDismissed = (earlyClosedDismissed: boolean) =>
    useUserFeedbackStore.setState({ earlyClosedDismissed });
