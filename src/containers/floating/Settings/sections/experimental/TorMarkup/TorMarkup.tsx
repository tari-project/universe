import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { setError } from '@app/store/actions';

import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

import { Typography } from '@app/components/elements/Typography';
import { TorConfig } from '@app/types/app-status';
import { Input } from '@app/components/elements/inputs/Input';

import { Stack } from '@app/components/elements/Stack.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../../components/SettingsGroup.styles.ts';
import { TorDebug } from './TorDebug';
import { ErrorTypography, StyledInput, TorSettingsContainer } from './TorMarkup.styles';

import { type } from '@tauri-apps/plugin-os';
import { setUseTor, useConfigCoreStore } from '@app/store';

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
    const defaultUseTor = useConfigCoreStore((s) => s.use_tor);
    const [hasCheckedOs, setHasCheckedOs] = useState(false);
    const [defaultTorConfig, setDefaultTorConfig] = useState<TorConfig>();
    const [isMac, setIsMac] = useState(false);
    const [editedUseTor, setEditedUseTor] = useState(Boolean(defaultUseTor));
    const [editedConfig, setEditedConfig] = useState<EditedTorConfig>();
    const [isRandomControlPort, setIsRandomControlPort] = useState(false);

    const checkPlatform = useCallback(async () => {
        const osType = type();
        if (osType) {
            setIsMac(osType === 'macos');

            setHasCheckedOs(true);
        }
    }, []);
    useEffect(() => {
        if (hasCheckedOs) return;
        checkPlatform();
    }, [checkPlatform, hasCheckedOs]);

    useEffect(() => {
        invoke('get_tor_config')
            .then((torConfig: TorConfig) => {
                setEditedConfig(torConfig);
                setDefaultTorConfig(torConfig);
                setIsRandomControlPort(!torConfig?.control_port);
            })
            .catch((e) => {
                console.error('Get Tor config error:', e);
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
                console.error('Update Tor config error:', error);
            }
        }
    }, [defaultTorConfig, defaultUseTor, editedConfig, editedUseTor]);

    const isSaveButtonVisible = useMemo(() => {
        if (editedUseTor !== defaultUseTor) return true;

        if (JSON.stringify(defaultTorConfig) === JSON.stringify(editedConfig)) return false;
        return !(
            (editedConfig?.use_bridges &&
                (!editedConfig?.bridges?.length || editedConfig?.bridges.some((bridge) => hasBridgeError(bridge))) &&
                !editedConfig?.control_port) ||
            (!isRandomControlPort && Number(editedConfig?.control_port) <= 0)
        );
    }, [defaultTorConfig, defaultUseTor, editedConfig, editedUseTor, isRandomControlPort]);
    const toggleUseBridges = useCallback(async () => {
        const updated_use_bridges = !editedConfig?.use_bridges;
        let bridges = editedConfig?.bridges || [];
        if (updated_use_bridges && Number(bridges?.length) < 2) {
            try {
                bridges = await invoke('fetch_tor_bridges');
            } catch (error) {
                console.error('Fetch Tor bridges error:', error);
                setError(t('errors.fetch-tor-bridges'));
            }
        }

        setEditedConfig((prev) => ({
            ...(prev as TorConfig),
            use_bridges: updated_use_bridges,
            bridges,
        }));
    }, [editedConfig?.bridges, editedConfig?.use_bridges, t]);

    const toggleRandomControlPort = useCallback(() => {
        setEditedConfig((prev) => ({
            ...(prev as TorConfig),
            control_port: isRandomControlPort ? prev?.control_port || 9051 : 0,
        }));
        setIsRandomControlPort((prev) => !prev);
    }, [isRandomControlPort]);

    return (
        <>
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
                    <SettingsGroupAction style={{ alignItems: 'center' }}>
                        {isSaveButtonVisible && <Button onClick={onSave}>{t('save')}</Button>}
                        <ToggleSwitch checked={editedUseTor} onChange={() => setEditedUseTor((p) => !p)} />
                    </SettingsGroupAction>
                </SettingsGroup>

                {editedUseTor && editedConfig ? (
                    <TorSettingsContainer $isMac={isMac}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            style={{ marginBottom: '16px' }}
                        >
                            <Typography variant="h6">{t('control-port')}</Typography>
                            <ToggleSwitch
                                label={t('use-random-control-port')}
                                variant="gradient"
                                checked={isRandomControlPort}
                                onChange={toggleRandomControlPort}
                            />
                        </Stack>

                        {!isRandomControlPort && (
                            <Stack style={{ width: '100%' }} direction="column">
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
                                    {hasControlPortError(+editedConfig.control_port) &&
                                        t('errors.invalid-control-port')}
                                </ErrorTypography>
                            </Stack>
                        )}

                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            style={{ marginBottom: '16px' }}
                        >
                            <Typography variant="h6">{t('tor-bridges')}</Typography>
                            <ToggleSwitch
                                label={t('use-tor-bridges')}
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
            {defaultUseTor && hasCheckedOs && <TorDebug isMac={isMac} />}
        </>
    );
};
