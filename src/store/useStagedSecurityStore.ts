import { create } from './create.ts';
export type StagedSecuritySectionType = 'ProtectIntro' | 'SeedPhrase' | 'VerifySeedPhrase' | 'CreatePin';

interface State {
    showModal: boolean;
    step: StagedSecuritySectionType;
    showReminderTip: boolean;
    showCompletedTip: boolean;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setShowReminderTip: (showReminderTip: boolean) => void;
    setShowCompletedTip: (showCompletedTip: boolean) => void;
    setModalStep: (step: State['step']) => void;
}

const initialState: State = {
    step: 'ProtectIntro',
    showModal: false,
    showReminderTip: false, // when are we meant to prompt this?
    showCompletedTip: false,
};

export const useStagedSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
    setShowReminderTip: (showReminderTip) => set({ showReminderTip }),
    setShowCompletedTip: (showCompletedTip) => set({ showCompletedTip }),
    setModalStep: (step) => set({ step }),
}));
