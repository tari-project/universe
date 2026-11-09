import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../../components/SettingsGroup.styles.ts';
import { setTorEntryGuards, useNodeStore } from '@app/store/useNodeStore.ts';

export const TorDebug = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const torEntryGuards = useNodeStore((s) => s.tor_entry_guards);

    // Guards are read once at startup; Tor picks new ones after a restart. Re-read them
    // when the panel opens so it shows what Tor is using now. On failure (e.g. Tor not
    // running) keep the last known list.
    useEffect(() => {
        invoke('get_tor_entry_guards')
            .then(setTorEntryGuards)
            .catch((e) => console.warn('Could not refresh Tor entry guards:', e));
    }, []);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tor-entry-guards')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent style={{ fontSize: '11px' }}>
                    {torEntryGuards?.length > 0 ? (
                        <ul>
                            {torEntryGuards.map((eg) => (
                                <li key={eg}>{eg}</li>
                            ))}
                        </ul>
                    ) : (
                        t('no-entry-guard')
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
