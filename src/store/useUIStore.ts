import { create } from './create';
import { backgroundType, viewType } from './types.ts';
import { Theme } from '@app/theme/types.ts';
import { setAnimationProperties } from '@app/visuals.ts';
import { useAppConfigStore } from './useAppConfigStore.ts';

const _DIALOG_TYPES = ['logs', 'restart', 'autoUpdate', 'releaseNotes', 'ludicrousConfirmation'] as const;
type DialogTypeTuple = typeof _DIALOG_TYPES;
type DialogType = DialogTypeTuple[number];

interface State {
    theme: Theme;
    background: backgroundType;
    view: viewType;
    latestVersion?: string;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType | null;
    isWebglNotSupported: boolean;
    adminShow?: 'setup' | 'main' | 'shutdown' | 'orphanChainWarning' | null;
}
interface Actions {
    setBackground: (background: State['background']) => void;
    setView: (view: State['view']) => void;
    setSidebarOpen: (sidebarOpen: State['sidebarOpen']) => void;
    setShowExperimental: (showExperimental: boolean) => void;
    setDialogToShow: (dialogToShow: State['dialogToShow']) => void;
    setLatestVersion: (latestVersion: string) => void;
    setIsWebglNotSupported: (isWebglNotSupported: boolean) => void;
    setAdminShow: (adminShow: State['adminShow']) => void;
}

type UIStoreState = State & Actions;
const initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialState: State = {
    isWebglNotSupported: false,
    theme: initialDarkMode ? 'dark' : 'light',
    background: 'onboarding',
    view: 'setup',
    sidebarOpen: false,
    dialogToShow: null,
    showExperimental: false,
    showExternalDependenciesDialog: false,
};

export const useUIStore = create<UIStoreState>()((set) => ({
    ...initialState,
    setBackground: (background) => set({ background }),
    setView: (view) => set({ view }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    setShowExperimental: (showExperimental) => set({ showExperimental }),
    setDialogToShow: (dialogToShow) => set({ dialogToShow }),
    setLatestVersion: (latestVersion) => set({ latestVersion }),
    setIsWebglNotSupported: (isWebglNotSupported) => {
        useAppConfigStore.getState().setVisualMode(false);
        set({ isWebglNotSupported });
    },
    setAdminShow: (adminShow) => set({ adminShow }),
}));

export const setShowExternalDependenciesDialog = (showExternalDependenciesDialog: boolean) =>
    useUIStore.setState({ showExternalDependenciesDialog });

export const setUITheme = (theme: Theme) => {
    setAnimationProperties(theme === 'light' ? animationLightBg : animationDarkBg);
    useUIStore.setState({ theme });
};

export const animationLightBg = [
    { property: 'bgColor1', value: '#ffffff' },
    { property: 'bgColor2', value: '#d0d0d0' },
    { property: 'neutralColor', value: '#ffffff' },
    { property: 'mainColor', value: '#0096ff' },
    { property: 'successColor', value: '#00c881' },
    { property: 'failColor', value: '#ca0101' },
    { property: 'particlesColor', value: '#505050' },
    { property: 'goboIntensity', value: 0.45 },
    { property: 'particlesOpacity', value: 0.75 },
    { property: 'particlesSize', value: 0.01 },
];
export const animationDarkBg = [
    { property: 'bgColor1', value: '#212121' },
    { property: 'bgColor2', value: '#212121' },
    { property: 'neutralColor', value: '#040723' },
    { property: 'successColor', value: '#c9eb00' },
    { property: 'mainColor', value: '#813bf5' },
    { property: 'failColor', value: '#ff5610' },
    { property: 'particlesColor', value: '#813bf5' },
    { property: 'goboIntensity', value: 0.75 },
    { property: 'particlesOpacity', value: 0.95 },
    { property: 'particlesSize', value: 0.015 },
];
