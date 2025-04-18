import { AdminShow, CONNECTION_STATUS, DialogType, useUIStore } from '@app/store/useUIStore.ts';
import { setAnimationProperties } from '@tari-project/tari-tower';
import { setVisualMode } from './appConfigStoreActions.ts';

import { Theme } from '@app/theme/types.ts';

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
    setVisualMode(false);
    useUIStore.setState({ isWebglNotSupported });
};
export const setAdminShow = (adminShow: AdminShow) => useUIStore.setState({ adminShow });
export const setConnectionStatus = (connectionStatus: CONNECTION_STATUS) => {
    console.error('setConnectionStatus called with:', connectionStatus);
    return useUIStore.setState({ connectionStatus });
};
export const setIsReconnecting = (isReconnecting: boolean) => useUIStore.setState({ isReconnecting });

export const toggleHideWalletBalance = () =>
    useUIStore.setState((current) => ({ hideWalletBalance: !current.hideWalletBalance }));
export const setSidebarOpen = (sidebarOpen: boolean) => useUIStore.setState({ sidebarOpen });
export const handleCloseSplashscreen = () => useUIStore.setState({ showSplashscreen: false });
export const handleAskForRestart = () => {
    setDialogToShow('restart');
};
export const setShowResumeAppModal = (showResumeAppModal: boolean) => useUIStore.setState({ showResumeAppModal });
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
