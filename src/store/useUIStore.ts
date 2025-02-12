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

const initialState: UIStoreState = {
    isWebglNotSupported: false,
    theme: 'light',
    background: 'onboarding',
    sidebarOpen: false,
    dialogToShow: null,
    showExperimental: false,
    showExternalDependenciesDialog: false,
};

export const useUIStore = create<UIStoreState>()(() => ({
    ...initialState,
}));
