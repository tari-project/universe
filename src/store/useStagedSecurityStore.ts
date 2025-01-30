import { create } from './create.ts';

interface State {
    showModal: boolean;
    showReminderTip: boolean;
    showCompletedTip: boolean;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setShowReminderTip: (showReminderTip: boolean) => void;
    setShowCompletedTip: (showCompletedTip: boolean) => void;
}

const initialState: State = {
    showModal: false,
    showReminderTip: false,
    showCompletedTip: false,
};

export const useStagedSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
    setShowReminderTip: (showReminderTip) => set({ showReminderTip }),
    setShowCompletedTip: (showCompletedTip) => set({ showCompletedTip }),
}));
