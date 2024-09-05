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
}
interface Actions {
    setShowSplash: (showSplash: boolean) => void;
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    toggleVisualMode: () => void;
    toggleTelemetryMode: () => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    showSplash: true,
    background: 'onboarding',
    view: 'setup',
    visualMode: true,
    telemetryMode: false,
    sidebarOpen: false,
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
        }),
        {
            name: 'ui-store',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                telemetryMode: s.telemetryMode,
            }),
        }
    )
);
