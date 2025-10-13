import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch.tsx';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupAction,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useConfigUIStore, useUIStore } from '@app/store';
import { toggleVisualMode } from '@app/store/actions/uiStoreActions';

const ErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
}));

function VisualMode() {
    const visualMode = useConfigUIStore((s) => s.visual_mode);
    const visualModeToggleLoading = useConfigUIStore((s) => s.visualModeToggleLoading);
    const isWebglNotSupported = useUIStore((s) => s.isWebglNotSupported);
    const { t } = useTranslation('settings', { useSuspense: false });

    const handleSwitch = useCallback(() => {
        if (visualModeToggleLoading) return;
        toggleVisualMode(!visualMode);
    }, [visualMode, visualModeToggleLoading]);

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
                        disabled={isWebglNotSupported}
                        checked={visualMode}
                        onChange={handleSwitch}
                        isLoading={visualModeToggleLoading}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
export default VisualMode;
