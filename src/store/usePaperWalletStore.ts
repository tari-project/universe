import { create } from './create.ts';

interface State {
    showModal: boolean;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
}

const initialState: State = {
    showModal: false,
};

export const usePaperWalletStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
}));
