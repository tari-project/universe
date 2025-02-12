import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { setVisualMode, useAppConfigStore } from '@app/store/useAppConfigStore';
import { sidebarTowerOffset, TOWER_CANVAS_ID, useUIStore } from '@app/store/useUIStore';
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
        setVisualMode(false);
        removeTowerAnimation({ canvasId: TOWER_CANVAS_ID })
            .then(() => {
                // Force garbage collection to clean up WebGL context
                if (window.gc) {
                    window.gc();
                }
            })
            .catch((e) => {
                console.error('Could not disable visual mode. Error at loadTowerAnimation:', e);
                setVisualMode(true);
            });
    }, []);
    const handleEnable = useCallback(() => {
        loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: sidebarTowerOffset })
            .then(() => {
                setVisualMode(true);
                setAnimationState('showVisual');
            })
            .catch((e) => {
                console.error('Could not enable visual mode. Error at loadTowerAnimation:', e);
                setVisualMode(false);
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
                        onChange={() => handleSwitch()}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
export default VisualMode;
