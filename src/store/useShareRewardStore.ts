import { create } from 'zustand';
import { TransactionInfo } from '@app/types/app-status.ts';

interface State {
    showModal: boolean;
    item: TransactionInfo | null;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setItemData: (item: TransactionInfo | null) => void;
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
