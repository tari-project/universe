import { useUIStore } from '@app/store/useUIStore.ts';
import {
    loadTowerAnimation,
    removeTowerAnimation,
    setAnimationProperties,
    setAnimationState,
} from '@tari-project/tari-tower';
import { setVisualMode } from './appConfigStoreActions.ts';

import { Theme } from '@app/theme/types.ts';
import { ConnectionStatusPayload } from '@app/types/events-payloads.ts';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { useConfigUIStore } from '../useAppConfigStore.ts';
import { useSetupStore } from '../useSetupStore.ts';
import { CONNECTION_STATUS, DialogType, sidebarTowerOffset, TOWER_CANVAS_ID } from '../types/ui.ts';

export const setShowExternalDependenciesDialog = (showExternalDependenciesDialog: boolean) =>
    useUIStore.setState({ showExternalDependenciesDialog });
export const setUITheme = (theme: Theme | 'system') => {
    const initialPreferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const uiTheme: Theme = theme === 'system' ? initialPreferred : theme;
    setAnimationProperties(uiTheme === 'light' ? animationLightBg : animationDarkBg);
    useUIStore.setState({ theme: uiTheme });
};
export const setDialogToShow = (dialogToShow?: DialogType) => useUIStore.setState({ dialogToShow });
export const setIsWebglNotSupported = (isWebglNotSupported: boolean) => {
    setVisualMode(false).then(() => useUIStore.setState({ isWebglNotSupported }));
};

async function loadAnimation() {
    const towerSidebarOffset = useUIStore.getState().towerSidebarOffset;
    const isInitialSetupFinished = useSetupStore.getState().isInitialSetupFinished;
    const appUnlocked = useSetupStore.getState().appUnlocked;
    const setupComplete = isInitialSetupFinished && appUnlocked;

    try {
        await loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: towerSidebarOffset });
        useUIStore.setState((c) => ({ ...c, towerInitalized: true }));
        if (setupComplete) {
            setAnimationState('showVisual');
        }
    } catch (e) {
        console.error('Could not enable visual mode. Error at loadTowerAnimation:', e);
        useUIStore.setState((c) => ({ ...c, towerInitalized: false }));
    }
}
async function removeAnimation() {
    try {
        await removeTowerAnimation({ canvasId: TOWER_CANVAS_ID });
        useUIStore.setState((c) => ({ ...c, towerInitalized: false }));
        // Force garbage collection to clean up WebGL context
        if (window.gc) {
            window.gc();
        }
    } catch (e) {
        console.error('Could not disable visual mode. Error at removeTowerAnimation:', e);
    }
}
export const toggleVisualMode = async (enabled: boolean) => {
    useConfigUIStore.setState((c) => ({ ...c, visualModeToggleLoading: true }));

    try {
        await setVisualMode(enabled);
        if (enabled) {
            console.info(`Enabling visual mode. Loading animation from UI Store`);
            await loadAnimation();
        } else {
            await removeAnimation();
        }
    } catch (e) {
        console.error('Could not toggle visual mode. Error at setVisualMode:', e);
    } finally {
        useConfigUIStore.setState((c) => ({ ...c, visualModeToggleLoading: false }));
    }
};
export const handleConnectionStatusChanged = (connectionStatus: ConnectionStatusPayload) => {
    if (connectionStatus === 'InProgress') {
        setIsReconnecting(true);
    } else if (connectionStatus === 'Succeed') {
        setIsReconnecting(false);
        setConnectionStatus('connected');
    } else if (connectionStatus === 'Failed') {
        setIsReconnecting(false);
    }
};
export const setConnectionStatus = (connectionStatus: CONNECTION_STATUS) => {
    return useUIStore.setState({ connectionStatus });
};
export const setIsReconnecting = (isReconnecting: boolean) => useUIStore.setState({ isReconnecting });

export const toggleHideWalletBalance = () =>
    useUIStore.setState((current) => ({ hideWalletBalance: !current.hideWalletBalance }));
export const setSidebarOpen = (sidebarOpen: boolean) =>
    useUIStore.setState({
        sidebarOpen,
        towerSidebarOffset: sidebarOpen ? sidebarTowerOffset + SB_WIDTH : sidebarTowerOffset,
    });

export const setSeedlessUI = (seedlessUI: boolean) => useUIStore.setState((c) => ({ ...c, seedlessUI }));
export const setShouldShowExchangeSpecificModal = (shouldShowExchangeSpecificModal: boolean) =>
    useUIStore.setState({ shouldShowExchangeSpecificModal });
export const handleCloseSplashscreen = () => useUIStore.setState({ showSplashscreen: false });
export const handleAskForRestart = () => {
    setDialogToShow('restart');
};
export const setShowResumeAppModal = (showResumeAppModal: boolean) => useUIStore.setState({ showResumeAppModal });
export const setShowTapplet = (showTapplet: boolean) => useUIStore.setState({ showTapplet });
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
    { property: 'goboIntensity', value: 0.35 },
    { property: 'particlesOpacity', value: 0.95 },
    { property: 'particlesSize', value: 0.015 },
];
