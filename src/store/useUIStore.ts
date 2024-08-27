import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';

interface State {
    showSplash: boolean;
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
    isMiningSwitchingState: boolean;
    isMiningEnabled: boolean;
    isConnectionLostDuringMining: boolean;
}
interface Actions {
    setShowSplash: (showSplash: boolean) => void;
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    toggleVisualMode: () => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setIsMiningSwitchingState: (isMiningSwitchingState: State['isMiningSwitchingState']) => void;
    setIsMiningEnabled: (isMiningEnabled: State['isMiningEnabled']) => void;
    setIsConnectionLostDuringMining: (isConnectionLostDuringMining: State['isConnectionLostDuringMining']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    showSplash: true,
    background: 'onboarding',
    view: 'setup',
    visualMode: true,
    sidebarOpen: false,
    isMiningSwitchingState: false,
    isMiningEnabled: false,
    isConnectionLostDuringMining: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setShowSplash: (showSplash) => set({ showSplash }),
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    toggleVisualMode: () => set((state) => ({ visualMode: !state.visualMode })),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setIsMiningSwitchingState: (isMiningSwitchingState) => set({ isMiningSwitchingState }),
    setIsMiningEnabled: (isMiningEnabled) => set({ isMiningEnabled }),
    setIsConnectionLostDuringMining: (isConnectionLostDuringMining) => set({ isConnectionLostDuringMining }),
}));
