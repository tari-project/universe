import { create } from './create';
import { Theme } from '@app/theme/types.ts';
import { AdminShow, CONNECTION_STATUS, DialogType, sidebarTowerOffset, SidebarType } from '@app/store/types/ui.ts';

interface UIStoreState {
    theme: Theme;
    preferredTheme: Theme;
    currentSidebar: SidebarType;
    latestVersion?: string;
    sidebarOpen: boolean;
    showExperimental: boolean;
    showWarmup: boolean;
    showExternalDependenciesDialog: boolean;
    dialogToShow?: DialogType;
    isWebglNotSupported: boolean;
    adminShow?: AdminShow;
    connectionStatus?: CONNECTION_STATUS;
    isReconnecting?: boolean;
    seedlessUI?: boolean;
    showSplashscreen: boolean;
    hideWalletBalance: boolean;
    showResumeAppModal: boolean;
    towerSidebarOffset: number;
    showTapplet: boolean;
    blockBubblesEnabled: boolean;
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
    showWarmup: false,
    showResumeAppModal: false,
    seedlessUI: false,
    towerSidebarOffset: sidebarTowerOffset,
    showTapplet: false,
    blockBubblesEnabled: false,
};

export const useUIStore = create<UIStoreState>()(() => ({
    ...initialState,
}));
