import { create } from './create.ts';

interface State {
    showWidget: boolean;
}

interface Actions {
    setShowWidget: (showWidget: boolean) => void;
}

const initialState: State = {
    showWidget: true,
};

export const useRewardsStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowWidget: (showWidget) => set({ showWidget }),
}));
