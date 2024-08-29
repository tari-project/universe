import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';
import { createJSONStorage, persist } from 'zustand/middleware';

interface State {
    showSplash: boolean;
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    telemetryMode: boolean;
    sidebarOpen: boolean;
    isMiningSwitchingState: boolean;
    isMiningEnabled: boolean;
    isMiningInProgress: boolean;
    isChangingMode: boolean;
    isConnectionLostDuringMining: boolean;
}
interface Actions {
    setShowSplash: (showSplash: boolean) => void;
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    toggleVisualMode: () => void;
    toggleTelemetryMode: () => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setIsMiningSwitchingState: (isMiningSwitchingState: State['isMiningSwitchingState']) => void;
    setIsMiningEnabled: (isMiningEnabled: State['isMiningEnabled']) => void;
    setIsConnectionLostDuringMining: (isConnectionLostDuringMining: State['isConnectionLostDuringMining']) => void;
    setIsMiningInProgress: (isMiningInProgress: State['isMiningInProgress']) => void;
    setIsChangingMode: (isChangingMode: State['isChangingMode']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    showSplash: true,
    background: 'onboarding',
    view: 'setup',
    visualMode: true,
    telemetryMode: true,
    sidebarOpen: false,
    isMiningSwitchingState: false,
    isMiningEnabled: false,
    isMiningInProgress: false,
    isChangingMode: false,
    isConnectionLostDuringMining: false,
};

export const useUIStore = create<UIStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setShowSplash: (showSplash) => set({ showSplash }),
            setBackground: (background) => set({ background }),
            setView: (view) => set({ view }),
            toggleTelemetryMode: () => set((state) => ({ telemetryMode: !state.telemetryMode })),
            toggleVisualMode: () => set((state) => ({ visualMode: !state.visualMode })),
            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
            setIsMiningSwitchingState: (isMiningSwitchingState) => set({ isMiningSwitchingState }),
            setIsMiningEnabled: (isMiningEnabled) => set({ isMiningEnabled }),
            setIsConnectionLostDuringMining: (isConnectionLostDuringMining) => set({ isConnectionLostDuringMining }),
            setIsMiningInProgress: (isMiningInProgress) => set({ isMiningInProgress }),
            setIsChangingMode: (isChangingMode) => set({ isChangingMode }),
        }),
        {
            name: 'ui-store',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                isMiningEnabled: s.isMiningEnabled,
                isConnectionLostDuringMining: s.isConnectionLostDuringMining,
                telemetryMode: s.telemetryMode,
            }),
        }
    )
);
