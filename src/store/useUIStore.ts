import { create } from './create';
import { backgroundType, viewType } from './types.ts';
import { Theme } from '@app/theme/types.ts';
import { animationDarkBg, animationLightBg, setAnimationProperties } from '@app/visuals.ts';

export const DIALOG_TYPES = ['logs', 'restart', 'autoUpdate'] as const;
type DialogTypeTuple = typeof DIALOG_TYPES;
export type DialogType = DialogTypeTuple[number];

interface State {
    theme: Theme;
    background: backgroundType;
    view: viewType;
    latestVersion?: string;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType | null;
}
interface Actions {
    setTheme: (theme: Theme) => void;
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setShowExperimental: (showExperimental: boolean) => void;
    setShowExternalDependenciesDialog: (showExternalDependenciesDialog: boolean) => void;
    setDialogToShow: (dialogToShow: State['dialogToShow']) => void;
    setLatestVersion: (latestVersion: string) => void;
}

type UIStoreState = State & Actions;

const initialState: State = {
    theme: 'light',
    background: 'onboarding',
    view: 'setup',
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
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setShowExperimental: (showExperimental) => set({ showExperimental }),
    setShowExternalDependenciesDialog: (showExternalDependenciesDialog) => set({ showExternalDependenciesDialog }),
    setDialogToShow: (dialogToShow) => set({ dialogToShow }),
    setLatestVersion: (latestVersion) => set({ latestVersion }),
}));
