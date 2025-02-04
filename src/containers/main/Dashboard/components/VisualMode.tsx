import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { setVisualMode, useAppConfigStore } from '@app/store/useAppConfigStore';
import { sidebarTowerOffset, useUIStore } from '@app/store/useUIStore';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupAction,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { loadTowerAnimation, removeTowerAnimation, setAnimationState } from '@tari-project/tari-tower';

export const ErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
}));

function VisualMode() {
    const visualMode = useAppConfigStore((s) => s.visual_mode);
    const visualModeToggleLoading = useAppConfigStore((s) => s.visualModeToggleLoading);
    const isWebglNotSupported = useUIStore((s) => s.isWebglNotSupported);
    const { t } = useTranslation('settings', { useSuspense: false });

    const handleDisable = useCallback(() => {
        const canvas = document.getElementById('tower-canvas');
        if (canvas) {
            canvas.style.opacity = '0';
        }
        setVisualMode(false);
        removeTowerAnimation({ canvasId: 'tower-canvas' });
    }, []);

    const handleEnable = useCallback(() => {
        loadTowerAnimation({ canvasId: 'tower-canvas', offset: sidebarTowerOffset }).then(() => {
            setVisualMode(true);
            setAnimationState('showVisual');
        });
    }, []);

    const handleSwitch = useCallback(() => {
        if (visualMode) {
            handleDisable();
        } else {
            handleEnable();
        }
    }, [handleDisable, handleEnable, visualMode]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('visual-mode')}</Typography>
                    </SettingsGroupTitle>
                    {isWebglNotSupported && <ErrorTypography color="error">{t('webgl-not-supported')}</ErrorTypography>}
                </SettingsGroupContent>
                <SettingsGroupAction style={{ alignItems: 'center' }}>
                    <ToggleSwitch
                        disabled={visualModeToggleLoading || isWebglNotSupported}
                        checked={visualMode}
                        onChange={handleSwitch}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
export default VisualMode;
