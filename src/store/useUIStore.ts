import { create } from './create';
import { backgroundType } from './types.ts';
import { Theme } from '@app/theme/types.ts';

const _DIALOG_TYPES = ['logs', 'restart', 'autoUpdate', 'releaseNotes', 'ludicrousConfirmation'] as const;
type DialogTypeTuple = typeof _DIALOG_TYPES;
export type DialogType = DialogTypeTuple[number] | null;

const sideBarWidth = 348;
const sideBarPaddingBuffer = 20;
export const sidebarTowerOffset = sideBarWidth + sideBarPaddingBuffer;
export const TOWER_CANVAS_ID = 'tower-canvas';

export type AdminShow = 'setup' | 'main' | 'shutdown' | 'orphanChainWarning' | null;
export type CONNECTION_STATUS = 'connected' | 'disconnected' | 'disconnected-severe';

interface UIStoreState {
    theme: Theme;
    preferredTheme: Theme;
    background: backgroundType;
    latestVersion?: string;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType;
    isWebglNotSupported: boolean;
    adminShow?: AdminShow;
    connectionStatus?: CONNECTION_STATUS;
    isReconnecting?: boolean;
}
const preferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const initialState: UIStoreState = {
    isWebglNotSupported: false,
    theme: preferredTheme,
    preferredTheme,
    background: 'onboarding',
    sidebarOpen: false,
    dialogToShow: null,
    showExperimental: false,
    showExternalDependenciesDialog: false,
    connectionStatus: 'connected',
    isReconnecting: false,
};

export const useUIStore = create<UIStoreState>()(() => ({
    ...initialState,
}));
