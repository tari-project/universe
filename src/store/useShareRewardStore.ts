import { create } from 'zustand';
import { CombinedBridgeWalletTransaction } from './useWalletStore.ts';

interface State {
    showModal: boolean;
    item: CombinedBridgeWalletTransaction | null;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setItemData: (item: CombinedBridgeWalletTransaction | null) => void;
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
