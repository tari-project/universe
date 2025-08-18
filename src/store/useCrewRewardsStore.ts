import { create } from './create.ts';

interface State {
    showWidget: boolean;
    isOpen: boolean;
}

interface Actions {
    setShowWidget: (showWidget: boolean) => void;
    setIsOpen: (isOpen: boolean) => void;
}

const initialState: State = {
    showWidget: false,
    isOpen: false,
};

export const useCrewRewardsStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowWidget: (showWidget) => set({ showWidget }),
    setIsOpen: (isOpen) => set({ isOpen }),
}));
