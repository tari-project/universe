import { WalletTransaction } from '@app/types/app-status';
import { create } from 'zustand';

interface State {
    showModal: boolean;
    item: WalletTransaction | null;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setItemData: (item: WalletTransaction | null) => void;
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
