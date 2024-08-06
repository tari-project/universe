import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';

interface State {
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
}
interface Actions {
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    setVisualMode: (visualMode: State['visualMode']) => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    background: 'idle',
    view: 'mining',
    visualMode: true,
    sidebarOpen: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    setVisualMode: (visualMode) => set({ visualMode }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
