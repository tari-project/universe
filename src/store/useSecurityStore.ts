import { create } from 'zustand';

const _DIALOGS = [
    'intro',
    'verify_seedphrase',
    'create_pin',
    'enter_pin',
    'forgot_pin',
    'tapplet_csp',
    'tapplet_permissions',
] as const;

type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
    tappletCsp: string;
    tappletPermissions: string;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
    setTappletCsp: (csp: string) => void;
    setTappletPermissions: (tappletPermissions: string) => void;
}

const initialState: State = {
    modal: null,
    tappletCsp: '',
    tappletPermissions: '',
};

export const useSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setModal: (modal) => set({ modal }),
    setTappletCsp: (tappletCsp: string) => set({ tappletCsp }),
    setTappletPermissions: (tappletPermissions: string) => set({ tappletPermissions }),
}));
