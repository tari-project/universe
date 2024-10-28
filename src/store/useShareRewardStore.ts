import { create } from './create.ts';

interface State {
    showModal: boolean;
    block: number;
    contributed: number;
    reward: number;
}

interface Actions {
    setShowModal: (showModal: boolean, block: number, contributed: number, reward: number) => void;
}

const initialState: State = {
    showModal: true,
    block: 24475,
    contributed: 14475,
    reward: 2.15,
};

export const useShareRewardStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal, block, contributed, reward) => set({ showModal, block, contributed, reward }),
}));
