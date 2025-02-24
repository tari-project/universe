import { create } from './create';
import { backgroundType } from './types.ts';
import { Theme } from '@app/theme/types.ts';

export const DIALOG_TYPES = ['logs', 'restart', 'autoUpdate', 'releaseNotes', 'ludicrousConfirmation'] as const;
type DialogTypeTuple = typeof DIALOG_TYPES;
export type DialogType = DialogTypeTuple[number] | null;

export type AdminShow = 'setup' | 'main' | 'shutdown' | 'orphanChainWarning' | null;

interface UIStoreState {
    theme: Theme;
    background: backgroundType;
    latestVersion?: string;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType;
    isWebglNotSupported: boolean;
    adminShow?: AdminShow;
}
const initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialState: UIStoreState = {
    isWebglNotSupported: false,
    theme: initialDarkMode ? 'dark' : 'light',
    background: 'onboarding',
    sidebarOpen: false,
    dialogToShow: null,
    showExperimental: false,
    showExternalDependenciesDialog: false,
};

export const useUIStore = create<UIStoreState>()(() => ({
    ...initialState,
}));
