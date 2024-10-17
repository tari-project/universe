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
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Typography } from '@app/components/elements/Typography';
import { TorConfig } from '@app/types/app-status';
import { EditTorBridges } from './EditTorBridges';
import { Input } from '@app/components/elements/inputs/Input';
import { Button } from '@app/components/elements/Button';

// const validateBridge = (bridge: string) => {
//     if (bridge.length === 0) return false;
//     const [obfs4, ip] = bridge.split(' ');
// }

export const TorMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);
    const [defaultTorConfig, setDefaultTorConfig] = useState<TorConfig>();
    const useTor = useAppConfigStore((s) => s.use_tor);
    const setUseTor = useAppConfigStore((s) => s.setUseTor);

    const [editedConfig, setEditedConfig] = useState<TorConfig>();

    const toggleUseTor = useCallback(() => {
        setUseTor(!useTor).then(() => {
            setDialogToShow('restart');
        });
    }, [setDialogToShow, setUseTor, useTor]);

    useEffect(() => {
        invoke('get_tor_config')
            .then((torConfig: TorConfig) => {
                setEditedConfig(torConfig);
                setDefaultTorConfig(torConfig);
            })
            .catch((e) => console.error(e));
    }, []);

    const isSaveButtonVisible = useMemo(
        () => !(JSON.stringify(defaultTorConfig) === JSON.stringify(editedConfig)),
        [defaultTorConfig, editedConfig]
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">
                            Tor
                            <b>&nbsp;(APP RESTART REQUIRED)</b>
                        </Typography>
                    </SettingsGroupTitle>
                    <Typography>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut, maxime.</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={useTor} onChange={toggleUseTor} />
                </SettingsGroupAction>
            </SettingsGroup>
            {useTor && editedConfig && (
                <SettingsGroup style={{ padding: '0 10px', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ToggleSwitch
                        label={'Use Tor Bridges'}
                        variant="gradient"
                        checked={editedConfig.use_bridges}
                        onChange={() =>
                            setEditedConfig((prev) => ({
                                ...(prev as TorConfig),
                                use_bridges: !prev?.use_bridges,
                            }))
                        }
                    />
                    {editedConfig.use_bridges && (
                        <>
                            <Input
                                style={{ marginLeft: '15px' }}
                                placeholder="obfs4 IP:PORT FINGERPRINT cert=CERT iat-mode=0"
                                value={editedConfig.bridges[0]}
                                onChange={(e) => {
                                    setEditedConfig((prev) => ({
                                        ...(prev as TorConfig),
                                        bridges: [e.target.value.trim(), prev?.bridges[1] || ''],
                                    }));
                                }}
                            />
                            <Input
                                style={{ marginLeft: '15px' }}
                                placeholder="obfs4 IP:PORT FINGERPRINT cert=CERT iat-mode=0"
                                value={editedConfig.bridges[1]}
                                onChange={(e) => {
                                    setEditedConfig((prev) => ({
                                        ...(prev as TorConfig),
                                        bridges: [prev?.bridges[0] || '', e.target.value.trim()],
                                    }));
                                }}
                            />
                        </>
                    )}
                    {isSaveButtonVisible && <Button>Save</Button>}
                </SettingsGroup>
            )}
        </SettingsGroupWrapper>
    );
};
