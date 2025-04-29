import { create } from './create';
import { Theme } from '@app/theme/types.ts';
import { SB_MINI_WIDTH, SB_SPACING } from '@app/theme/styles.ts';

export const sidebarTowerOffset = SB_SPACING + SB_MINI_WIDTH;
export const TOWER_CANVAS_ID = 'tower-canvas';
const _DIALOG_TYPES = ['logs', 'restart', 'autoUpdate', 'releaseNotes', 'ludicrousConfirmation'] as const;
type DialogTypeTuple = typeof _DIALOG_TYPES;
export type DialogType = DialogTypeTuple[number] | null;

export type AdminShow = 'setup' | 'main' | 'shutdown' | null;
export type CONNECTION_STATUS = 'connected' | 'disconnected' | 'disconnected-severe';
const _SIDEBAR_TYPES = ['mining', 'wallet'] as const;

type SidebarTypeTuple = typeof _SIDEBAR_TYPES;
export type SidebarType = SidebarTypeTuple[number];

interface UIStoreState {
    theme: Theme;
    preferredTheme: Theme;
    currentSidebar: SidebarType;
    latestVersion?: string;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType;
    isWebglNotSupported: boolean;
    adminShow?: AdminShow;
    connectionStatus?: CONNECTION_STATUS;
    isReconnecting?: boolean;
    showSplashscreen: boolean;
    hideWalletBalance: boolean;
    showResumeAppModal: boolean;
}
const preferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const initialState: UIStoreState = {
    isWebglNotSupported: false,
    theme: preferredTheme,
    preferredTheme,
    sidebarOpen: false,
    currentSidebar: 'mining',
    dialogToShow: null,
    showExperimental: false,
    showExternalDependenciesDialog: false,
    connectionStatus: 'connected',
    isReconnecting: false,
    showSplashscreen: true,
    hideWalletBalance: false,
    showResumeAppModal: false,
};

export const useUIStore = create<UIStoreState>()(() => ({
    ...initialState,
}));
