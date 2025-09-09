import { create } from 'zustand';

interface State {
    showWidget: boolean;
    isOpen: boolean;
    isMinimized: boolean;
}

interface Actions {
    setShowWidget: (showWidget: boolean) => void;
    setIsOpen: (isOpen: boolean) => void;
    setIsMinimized: (isMinimized: boolean) => void;
}

const initialState: State = {
    showWidget: false,
    isOpen: false,
    isMinimized: false,
};

export const useCrewRewardsStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowWidget: (showWidget) => set({ showWidget }),
    setIsOpen: (isOpen) => set({ isOpen }),
    setIsMinimized: (isMinimized) => set({ isMinimized }),
}));
