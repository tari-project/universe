import { create } from './create';
import { backgroundType, viewType } from './types.ts';

interface State {
    showSplash: boolean;
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
}
interface Actions {
    setShowSplash: (showSplash: boolean) => void;
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    toggleVisualMode: () => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    showSplash: true,
    background: 'onboarding',
    view: 'setup',
    visualMode: true,
    sidebarOpen: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setShowSplash: (showSplash) => set({ showSplash }),
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    toggleVisualMode: () => set((state) => ({ visualMode: !state.visualMode })),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
