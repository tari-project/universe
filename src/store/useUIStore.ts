import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';

interface State {
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    telemetryMode: boolean;
    sidebarOpen: boolean;
    isMiningSwitchingState: boolean;
}
interface Actions {
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    toggleVisualMode: () => void;
    toggleTelemetryMode: () => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setIsMiningSwitchingState: (isMiningSwitchingState: State['isMiningSwitchingState']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    background: 'onboarding',
    view: 'setup',
    visualMode: true,
    telemetryMode: true,
    sidebarOpen: false,
    isMiningSwitchingState: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    toggleVisualMode: () => set((state) => ({ visualMode: !state.visualMode })),
    toggleTelemetryMode: () => set((state) => ({ telemetryMode: !state.telemetryMode })),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setIsMiningSwitchingState: (isMiningSwitchingState) => set({ isMiningSwitchingState }),
}));
