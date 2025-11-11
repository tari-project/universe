import { create } from 'zustand';

const _DIALOGS = ['intro', 'verify_seedphrase', 'create_pin', 'enter_pin', 'forgot_pin'] as const;

type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
}

const initialState: State = {
    modal: null,
};

export const useSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setModal: (modal) => set({ modal }),
}));
