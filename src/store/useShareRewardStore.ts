import { create } from './create.ts';

interface State {
    showModal: boolean;
    block: number;
    contributed: number;
    reward: number;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
}

const initialState: State = {
    showModal: true,
    block: 24475,
    contributed: 14475,
    reward: 2.15,
};

export const useShareRewardStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
}));
