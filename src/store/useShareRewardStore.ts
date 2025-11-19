import { MinotariWalletTransaction } from '@app/types/app-status';
import { create } from 'zustand';

interface State {
    showModal: boolean;
    item: MinotariWalletTransaction | null;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setItemData: (item: MinotariWalletTransaction | null) => void;
}

const initialState: State = {
    showModal: false,
    item: null,
};

export const useShareRewardStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
    setItemData: (item) => set({ item }),
}));
