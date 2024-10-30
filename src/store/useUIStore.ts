import { create } from './create';
import { backgroundType, viewType } from './types.ts';
import { Theme } from '@app/theme/types.ts';
import { animationDarkBg, animationLightBg, setAnimationProperties } from '@app/visuals.ts';

export const DIALOG_TYPES = ['logs', 'restart'] as const;
type DialogTypeTuple = typeof DIALOG_TYPES;
export type DialogType = DialogTypeTuple[number];

interface State {
    theme: Theme;
    showSplash: boolean;
    background: backgroundType;
    view: viewType;
    visualMode: boolean;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType | null;
}
interface Actions {
    setTheme: (theme: Theme) => void;
    setShowSplash: (showSplash: boolean) => void;
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    toggleVisualMode: () => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setShowExperimental: (showExperimental: boolean) => void;
    setShowExternalDependenciesDialog: (showExternalDependenciesDialog: boolean) => void;
    setDialogToShow: (dialogToShow: State['dialogToShow']) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    theme: 'light',
    showSplash: true,
    background: 'onboarding',
    view: 'setup',
    visualMode: true,
    sidebarOpen: false,
    dialogToShow: null,
    showExperimental: false,
    showExternalDependenciesDialog: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setTheme: (theme) => {
        setAnimationProperties(theme === 'light' ? animationLightBg : animationDarkBg);
        set({ theme });
    },
    setShowSplash: (showSplash) => set({ showSplash }),
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    toggleVisualMode: () => set((state) => ({ visualMode: !state.visualMode })),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setShowExperimental: (showExperimental) => set({ showExperimental }),
    setShowExternalDependenciesDialog: (showExternalDependenciesDialog) => set({ showExternalDependenciesDialog }),
    setDialogToShow: (dialogToShow) => set({ dialogToShow }),
}));
