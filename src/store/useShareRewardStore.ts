import { create } from './create.ts';

interface State {
    showModal: boolean;
    block: number | string;
    contributed: number | string;
    reward: number | string;
}

interface Actions {
    setShowModal: (state: State) => void;
}

const initialState: State = {
    showModal: false,
    block: 24475,
    contributed: 14475,
    reward: 2.15,
};

export const useShareRewardStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (state: State) => set(state),
}));
