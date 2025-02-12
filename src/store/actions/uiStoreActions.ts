import { AdminShow, DialogType, useUIStore } from '@app/store/useUIStore.ts';
import { animationDarkBg, animationLightBg, setAnimationProperties } from '@app/visuals.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

import { Theme } from '@app/theme/types.ts';

export const setShowExternalDependenciesDialog = (showExternalDependenciesDialog: boolean) =>
    useUIStore.setState({ showExternalDependenciesDialog });
export const setTheme = (theme: Theme) => {
    setAnimationProperties(theme === 'light' ? animationLightBg : animationDarkBg);
    useUIStore.setState({ theme });
};
export const setDialogToShow = (dialogToShow?: DialogType) => useUIStore.setState({ dialogToShow });
export const setIsWebglNotSupported = (isWebglNotSupported: boolean) => {
    useAppConfigStore.getState().setVisualMode(false);
    useUIStore.setState({ isWebglNotSupported });
};
export const setAdminShow = (adminShow: AdminShow) => useUIStore.setState({ adminShow });
