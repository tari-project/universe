import { create } from './create.ts';
import { Transaction } from '@app/types/wallet.ts';

interface State {
    sharingEnabled: boolean;
    showModal: boolean;
    item: Transaction | null;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setItemData: (item: Transaction | null) => void;
}

const initialState: State = {
    sharingEnabled: false,
    showModal: false,
    item: null,
};

export const useShareRewardStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
    setItemData: (item) => set({ item }),
}));
