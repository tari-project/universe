import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';
import { createJSONStorage, persist } from 'zustand/middleware';

interface State {
    showSplash: boolean;
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
    isMiningSwitchingState: boolean;
    isMiningEnabled: boolean;
    isConnectionLostDuringMining: boolean;
    shouldAnimate: boolean;
}
interface Actions {
    setShowSplash: (showSplash: boolean) => void;
    setBackground: (background: State['background']) => void;
    setShouldAnimate: (shouldAnimate: State['shouldAnimate']) => void;
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
    shouldAnimate: false,
    isConnectionLostDuringMining: false,
};

export const useUIStore = create<UIStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setShowSplash: (showSplash) => set({ showSplash }),
            setShouldAnimate: (shouldAnimate) => ({ shouldAnimate }),
            setBackground: (background) => set({ background }),
            setView: (view) => set({ view }),
            toggleVisualMode: () => set((state) => ({ visualMode: !state.visualMode })),
            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
            setIsMiningSwitchingState: (isMiningSwitchingState) => set({ isMiningSwitchingState }),
            setIsMiningEnabled: (isMiningEnabled) => set({ isMiningEnabled }),
            setIsConnectionLostDuringMining: (isConnectionLostDuringMining) => set({ isConnectionLostDuringMining }),
        }),
        {
            name: 'ui-store',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                isMiningEnabled: s.isMiningEnabled,
                shouldAnimate: s.shouldAnimate,
                isConnectionLostDuringMining: s.isConnectionLostDuringMining,
            }),
        }
    )
);
