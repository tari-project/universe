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

export async function loadAnimation() {
    console.info('[TOWER_LOG] loadAnimation()');
    const uiTheme = useUIStore.getState().theme as string;
    const preferredTheme = uiTheme === 'system' ? useUIStore.getState().preferredTheme : uiTheme;
    const animationStyle = preferredTheme === 'dark' ? animationDarkBg : animationLightBg;
    const towerSidebarOffset = useUIStore.getState().towerSidebarOffset;
    const towerInitalized = useUIStore.getState().towerInitalized;
    console.info(
        '[TOWER_LOG] uiTheme, preferredTheme, animationStyle, towerSidebarOffset, towerInitalized',
        uiTheme,
        preferredTheme,
        animationStyle,
        towerSidebarOffset,
        towerInitalized
    );
    if (!towerInitalized) {
        console.info('[TOWER_LOG] !towerInitalized');
        setAnimationProperties(animationStyle);
        loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: towerSidebarOffset })
            .then((loaded) => {
                console.info('[TOWER_LOG] loadTowerAnimation loaded =', loaded);
                if (loaded) {
                    setAnimationState('showVisual');
                }
                useUIStore.setState((c) => ({ ...c, towerInitalized: loaded }));
            })
            .catch((e) => {
                console.info('[TOWER_LOG] loadTowerAnimation error, setting init false =', e);
                console.error('Could not enable visual mode. Error at loadTowerAnimation:', e);
                useUIStore.setState((c) => ({ ...c, towerInitalized: false }));
            });

        console.info('[TOWER_LOG] ui state after loadTowerAnimation', JSON.stringify(useUIStore.getState(), null, 2));
    }
}
export async function removeAnimation() {
    console.info('[TOWER_LOG] removeAnimation()');
    removeTowerAnimation({ canvasId: TOWER_CANVAS_ID }).then((removed) => {
        console.info('[TOWER_LOG] removed =', removed);
        if (removed) {
            // Force garbage collection to clean up WebGL context
            if (window.gc) {
                window.gc();
            }
        }
        useUIStore.setState((c) => ({ ...c, towerInitalized: !removed }));
    });
    console.info('[TOWER_LOG] ui state after removeTowerAnimation', JSON.stringify(useUIStore.getState(), null, 2));
}
export const toggleVisualMode = async (enabled: boolean) => {
    console.info('[TOWER_LOG] toggleVisualMode(), enabled =', enabled);
    useConfigUIStore.setState((c) => ({ ...c, visualModeToggleLoading: true }));
    try {
        await setVisualMode(enabled);
        console.info('[TOWER_LOG] after setVisualMode()');
        if (enabled) {
            console.info(`Enabling visual mode. Loading animation from UI Store`);
            await loadAnimation();
        } else {
            console.info('[TOWER_LOG] enabled was false so removing, calling removeAnimation() ');
            await removeAnimation();
        }
    } catch (e) {
        console.error('Could not toggle visual mode. Error at setVisualMode:', e);
    }
    useConfigUIStore.setState((c) => ({ ...c, visualModeToggleLoading: false }));

    console.info('[TOWER_LOG] ui state after toggleVisualMode', JSON.stringify(useUIStore.getState(), null, 2));
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
export const setIsShuttingDown = (isShuttingDown: boolean) => useUIStore.setState({ isShuttingDown });
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
