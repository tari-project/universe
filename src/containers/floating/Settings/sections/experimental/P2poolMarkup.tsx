import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { Typography } from '@app/components/elements/Typography';
import { Input } from '@app/components/elements/inputs/Input';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import styled from 'styled-components';
import {
    SettingsGroupWrapper,
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupAction,
} from '../../components/SettingsGroup.styles';
import { invoke } from '@tauri-apps/api/core';
import { setCustomStatsServerPort, setDialogToShow } from '@app/store';

const ErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
    // Prevent jumping when the error message appears
    minHeight: '14px',
}));

const hasStatsServerPortError = (cp: number) => {
    return !cp || cp <= 0 || cp > 65535;
};

const P2poolMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const customStatsServerPort = useAppConfigStore((s) => s.p2pool_stats_server_port);
    const [editedCustomStatsServerPort, setEditedCustomStatsServerPort] = useState(customStatsServerPort);
    const [isRandomStatsServerPort, setIsRandomStatsServerPort] = useState(!customStatsServerPort);
    const [currentStatsServerPort, setCurrentStatsServerPort] = useState(customStatsServerPort);
    useEffect(() => {
        invoke('get_used_p2pool_stats_server_port').then(setCurrentStatsServerPort).catch(console.error);
    }, []);

    const onSave = useCallback(async () => {
        if (isRandomStatsServerPort) {
            await setCustomStatsServerPort(null);
        } else if (editedCustomStatsServerPort) {
            await setCustomStatsServerPort(editedCustomStatsServerPort);
        } else {
            console.error('P2Pool unhandled case', editedCustomStatsServerPort);
        }
        setDialogToShow('restart');
    }, [isRandomStatsServerPort, editedCustomStatsServerPort]);

    const isSaveButtonVisible = useMemo(() => {
        if (isRandomStatsServerPort) {
            return !!customStatsServerPort;
        } else {
            return Boolean(
                editedCustomStatsServerPort &&
                    customStatsServerPort !== editedCustomStatsServerPort &&
                    !hasStatsServerPortError(editedCustomStatsServerPort)
            );
        }
    }, [customStatsServerPort, editedCustomStatsServerPort, isRandomStatsServerPort]);

    const toggleIsRandomStatsServerPort = useCallback(() => {
        if (isRandomStatsServerPort) {
            setEditedCustomStatsServerPort(currentStatsServerPort);
        }
        setIsRandomStatsServerPort((prev) => !prev);
    }, [currentStatsServerPort, isRandomStatsServerPort]);

    const currentStatsServerInputPort = useMemo(
        () => (isRandomStatsServerPort ? currentStatsServerPort : editedCustomStatsServerPort) || 0,
        [currentStatsServerPort, editedCustomStatsServerPort, isRandomStatsServerPort]
    );

    const emptyContext = currentStatsServerInputPort ? '' : 'empty';
    const errorMessage = hasStatsServerPortError(currentStatsServerInputPort)
        ? t('invalid-stats-server-port', { context: emptyContext })
        : null;

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">
                                {t('pool-mining')}
                                <b>&nbsp;({t('app-restart-required').toUpperCase()})</b>
                            </Typography>
                        </SettingsGroupTitle>
                    </SettingsGroupContent>
                    <SettingsGroupAction style={{ alignItems: 'center', minHeight: 50 }}>
                        {isSaveButtonVisible && <Button onClick={onSave}>{t('save')}</Button>}
                    </SettingsGroupAction>
                </SettingsGroup>

                <SettingsGroup>
                    <SettingsGroupContent>
                        <Typography variant="h6">{t('stats-server-port')}</Typography>

                        <Input
                            name="stats-server-port"
                            value={currentStatsServerInputPort || ''}
                            disabled={isRandomStatsServerPort}
                            placeholder="19000"
                            hasError={hasStatsServerPortError(currentStatsServerInputPort)}
                            onChange={({ target }) => {
                                if (target.value && isNaN(+target.value)) return;
                                setEditedCustomStatsServerPort(Number(target.value.trim()));
                            }}
                        />
                        <ErrorTypography variant="p">{!isRandomStatsServerPort && errorMessage}</ErrorTypography>
                    </SettingsGroupContent>
                    <SettingsGroupAction>
                        <ToggleSwitch
                            label={t('use-random-port')}
                            variant="gradient"
                            checked={isRandomStatsServerPort}
                            onChange={toggleIsRandomStatsServerPort}
                        />
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
};

export default P2poolMarkup;
