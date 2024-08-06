import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';

interface State {
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
    isMining: boolean;
    isAutoMining: boolean;
}
interface Actions {
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    setVisualMode: (visualMode: State['visualMode']) => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setIsAutoMining: (isMining: State['isMining']) => void;
    setIsMining: (isAutoMining: State['isAutoMining']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    background: 'idle',
    view: 'mining',
    visualMode: true,
    sidebarOpen: false,
    isMining: false,
    isAutoMining: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    setVisualMode: (visualMode) => set({ visualMode }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setIsMining: (isMining) => set({ isMining }),
    setIsAutoMining: (isAutoMining) => set({ isAutoMining }),
}));
