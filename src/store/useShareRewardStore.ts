import { create } from './create.ts';

interface State {
    sharingEnabled: boolean;
    showModal: boolean;
    block: number | string;
    contributed: number | string;
    reward: number | string;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setBlock: (block: number | string) => void;
    setContributed: (contributed: number | string) => void;
    setReward: (reward: number | string) => void;
}

const initialState: State = {
    sharingEnabled: true,
    showModal: false,
    block: 24475,
    contributed: 14475,
    reward: 2.15,
};

export const useShareRewardStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal }),
    setBlock: (block) => set({ block }),
    setContributed: (contributed) => set({ contributed }),
    setReward: (reward) => set({ reward }),
}));
