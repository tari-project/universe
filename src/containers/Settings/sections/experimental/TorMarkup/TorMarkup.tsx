import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUIStore } from '@app/store/useUIStore.ts';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Typography } from '@app/components/elements/Typography';
import { TorConfig } from '@app/types/app-status';
import { Input } from '@app/components/elements/inputs/Input';

import { ErrorTypography, StyledInput, TorSettingsContainer } from './TorMarkup.styles';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import * as Sentry from '@sentry/react';

interface EditedTorConfig {
    // it's also string here to prevent an empty value
    control_port: string | number;
    use_bridges: boolean;
    bridges: string[];
}

const hasBridgeError = (bridge: string) => {
    // TODO: How should we validate the bridge? (IPv4, IPv6, different formats)
    return !bridge || bridge.trim().length === 0;
};

const hasControlPortError = (cp: number) => {
    return !cp || cp <= 0;
};

export const TorMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const [defaultTorConfig, setDefaultTorConfig] = useState<TorConfig>();
    const defaultUseTor = useAppConfigStore((s) => s.use_tor);
    const setUseTor = useAppConfigStore((s) => s.setUseTor);
    const [editedUseTor, setEditedUseTor] = useState(Boolean(defaultUseTor));

    const [editedConfig, setEditedConfig] = useState<EditedTorConfig>();

    useEffect(() => {
        invoke('get_tor_config')
            .then((torConfig: TorConfig) => {
                setEditedConfig(torConfig);
                setDefaultTorConfig(torConfig);
            })
            .catch((e) => {
                Sentry.captureException(e);
                console.error(e);
            });
    }, []);

    const onSave = useCallback(async () => {
        if (editedUseTor !== defaultUseTor) {
            await setUseTor(editedUseTor);
        }

        if (editedConfig && JSON.stringify(defaultTorConfig) !== JSON.stringify(editedConfig)) {
            try {
                console.info('Updating Tor Config: ', {
                    ...editedConfig,
                    control_port: Number(editedConfig.control_port),
                });
                const updatedConfig = await invoke('set_tor_config', {
                    config: {
                        ...editedConfig,
                        control_port: Number(editedConfig.control_port),
                    },
                });
                setDefaultTorConfig(updatedConfig);
            } catch (error) {
                Sentry.captureException(error);
                console.error('Update Tor config error:', error);
            }
        }
        setDialogToShow('restart');
    }, [defaultTorConfig, defaultUseTor, editedConfig, editedUseTor, setDialogToShow, setUseTor]);

    const isSaveButtonVisible = useMemo(() => {
        if (editedUseTor !== defaultUseTor) return true;

        if (JSON.stringify(defaultTorConfig) === JSON.stringify(editedConfig)) return false;
        return !(
            (editedConfig?.use_bridges &&
                (!editedConfig?.bridges?.length || editedConfig?.bridges.some((bridge) => hasBridgeError(bridge))) &&
                !editedConfig?.control_port) ||
            Number(editedConfig?.control_port) <= 0
        );
    }, [defaultTorConfig, defaultUseTor, editedConfig, editedUseTor]);

    const toggleUseBridges = useCallback(async () => {
        const updated_use_bridges = !editedConfig?.use_bridges;
        let bridges = editedConfig?.bridges || [];
        if (updated_use_bridges && Number(bridges?.length) < 2) {
            bridges = await invoke('fetch_tor_bridges');
        }

        setEditedConfig((prev) => ({
            ...(prev as TorConfig),
            use_bridges: updated_use_bridges,
            bridges,
        }));
    }, [editedConfig?.bridges, editedConfig?.use_bridges]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">
                            <Trans>Tor</Trans>
                            <b>&nbsp;({t('app-restart-required').toUpperCase()})</b>
                        </Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('setup-tor-settings')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    {isSaveButtonVisible ? (
                        <Button onClick={onSave}>{t('save')}</Button>
                    ) : (
                        <ToggleSwitch checked={editedUseTor} onChange={() => setEditedUseTor((p) => !p)} />
                    )}
                </SettingsGroupAction>
            </SettingsGroup>

            {editedUseTor && editedConfig ? (
                <TorSettingsContainer>
                    <Stack style={{ width: '100%' }} direction="column">
                        <Typography variant="h6">{t('control-port')}</Typography>
                        <Input
                            name="control-port"
                            value={editedConfig.control_port}
                            placeholder="9051"
                            hasError={hasControlPortError(+editedConfig.control_port)}
                            onChange={({ target }) => {
                                if (target.value && isNaN(+target.value)) return;
                                setEditedConfig((prev) => ({
                                    ...(prev as TorConfig),
                                    control_port: target.value !== '' ? +target.value.trim() : '',
                                }));
                            }}
                        />
                        <ErrorTypography variant="p">
                            {hasControlPortError(+editedConfig.control_port) && t('errors.invalid-control-port')}
                        </ErrorTypography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">{t('tor-bridges')}</Typography>
                        <ToggleSwitch
                            label={'Use Tor Bridges'}
                            variant="gradient"
                            checked={editedConfig.use_bridges}
                            onChange={toggleUseBridges}
                        />
                    </Stack>

                    {editedConfig.use_bridges && (
                        <Stack>
                            <StyledInput
                                placeholder="obfs4 IP:PORT FINGERPRINT cert=CERT iat-mode=0"
                                hasError={hasBridgeError(editedConfig.bridges[0])}
                                value={editedConfig.bridges[0]}
                                onChange={({ target }) => {
                                    setEditedConfig((prev) => ({
                                        ...(prev as TorConfig),
                                        bridges: [target.value.trim(), prev?.bridges[1] || ''],
                                    }));
                                }}
                            />
                            <ErrorTypography variant="p">
                                {hasBridgeError(editedConfig.bridges[0]) && t('errors.invalid-bridge')}
                            </ErrorTypography>
                            <StyledInput
                                placeholder="obfs4 IP:PORT FINGERPRINT cert=CERT iat-mode=0"
                                hasError={hasBridgeError(editedConfig.bridges[1])}
                                value={editedConfig.bridges[1]}
                                onChange={(e) => {
                                    setEditedConfig((prev) => ({
                                        ...(prev as TorConfig),
                                        bridges: [prev?.bridges[0] || '', e.target.value.trim()],
                                    }));
                                }}
                            />
                            <ErrorTypography variant="p">
                                {hasBridgeError(editedConfig.bridges[1]) && t('errors.invalid-bridge')}
                            </ErrorTypography>
                        </Stack>
                    )}
                </TorSettingsContainer>
            ) : null}
        </SettingsGroupWrapper>
    );
};
