import { create } from 'zustand';

const _DIALOGS = ['intro', 'verify_seedphrase', 'create_pin', 'enter_pin', 'forgot_pin'] as const;

type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
    pinResolver: ((pin?: string) => void) | null;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
}

const initialState: State = {
    modal: null,
    pinResolver: null,
};

export const useSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setModal: (modal) => set({ modal }),
}));

export function requestPin(): Promise<string | undefined> {
    return new Promise((resolve) => {
        const current = useSecurityStore.getState();
        if (current.pinResolver) {
            current.pinResolver(undefined);
        }
        useSecurityStore.setState({ pinResolver: resolve, modal: 'enter_pin' });
    });
}
