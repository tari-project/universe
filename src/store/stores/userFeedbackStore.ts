import { create } from 'zustand';

interface State {
    showCloseDialog: boolean;
}
interface Actions {
    toggleCloseDialog: () => void;
}

const initialState: State = {
    showCloseDialog: false,
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
