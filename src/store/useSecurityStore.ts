import { create } from 'zustand';

const _DIALOGS = ['intro', 'verify_seedphrase', 'create_pin', 'enter_pin', 'forgot_pin', 'allow_tapplet_csp'] as const;
type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
    showReminderTip: boolean;
    tappletCsp: string;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
    setShowReminderTip: (showReminderTip: boolean) => void;
    setTappletCsp: (csp: string) => void;
}

const initialState: State = {
    modal: null,
    showReminderTip: false,
    tappletCsp: '',
};

export const useSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setModal: (modal) => set({ modal }),
    setShowReminderTip: (showReminderTip: boolean) => set({ showReminderTip }),
    setTappletCsp: (tappletCsp: string) => set({ tappletCsp }),
}));
