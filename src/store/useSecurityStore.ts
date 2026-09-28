import { create } from 'zustand';
import { emit } from '@tauri-apps/api/event';
import type { PinPromptContext } from '@app/types/events-payloads.ts';

const _DIALOGS = ['intro', 'verify_seedphrase', 'create_pin', 'enter_pin', 'forgot_pin'] as const;

type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
    pinResolver: ((pin?: string) => void) | null;
    /** What the backend is asking the user to authorise, when it told us. */
    pinContext: PinPromptContext | null;
    /** The backend prompt the open PIN dialog answers. */
    pinPromptId: number | null;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
}

const initialState: State = {
    modal: null,
    pinResolver: null,
    pinContext: null,
    pinPromptId: null,
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
        useSecurityStore.setState({ pinResolver: resolve, modal: 'enter_pin', pinContext: null, pinPromptId: null });
    });
}

/** Answers the backend PIN prompt, no PIN meaning cancelled. The prompt id goes back with it so a
 * late or duplicate answer can't satisfy another prompt. */
export function respondToPin(pin?: string) {
    return emit('pin-dialog-response', {
        id: useSecurityStore.getState().pinPromptId,
        pin,
    });
}

/** The backend stopped waiting for prompt `id`; close its dialog if it is still open. */
export function closePinPrompt(id: number) {
    const { modal, pinPromptId } = useSecurityStore.getState();
    if (pinPromptId === id && (modal === 'enter_pin' || modal === 'create_pin')) {
        useSecurityStore.setState({ modal: null, pinContext: null });
    }
}
