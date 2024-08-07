import { create } from 'zustand';
import { backgroundType, viewType } from './types.ts';

interface State {
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
    isAutoMining: boolean;
    userMousePosition: [number, number];

}
interface Actions {
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    setVisualMode: (visualMode: State['visualMode']) => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setIsAutoMining: (isAutoMining: State['isAutoMining']) => void;
    setUserMousePosition: (userMousePosition: State['userMousePosition']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    background: 'idle',
    view: 'mining',
    visualMode: true,
    sidebarOpen: false,
    isAutoMining: false,
    userMousePosition: [0, 0],
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    setVisualMode: (visualMode) => set({ visualMode }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setIsAutoMining: (isAutoMining) => set({ isAutoMining }),
    setUserMousePosition: (userMousePosition) => set({ userMousePosition }),
}));
