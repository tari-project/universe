import { create } from 'zustand';

const _DIALOGS = ['intro', 'verify_seedphrase', 'create_pin', 'enter_pin', 'forgot_pin'] as const;
type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
    showReminderTip: boolean;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
    setShowReminderTip: (showReminderTip: boolean) => void;
}

const initialState: State = {
    modal: null,
    showReminderTip: false,
};

export const useSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setModal: (modal) => set({ modal }),
    setShowReminderTip: (showReminderTip: boolean) => set({ showReminderTip }),
}));
